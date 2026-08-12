// 백엔드 REST 서버 검증 — 실제 서버를 임시 포트/임시 데이터 디렉터리로 띄워 검사한다.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let pass = 0;
let fail = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (ok) { pass++; console.log(`PASS | ${label}`); }
  else { fail++; console.log(`FAIL | ${label}${detail ? ` — ${detail}` : ""}`); }
};

const dataDir = await mkdtemp(join(tmpdir(), "erp-backend-"));
process.env.DATA_DIR = dataDir;
process.env.ALLOWED_ORIGINS = "http://localhost:5180";

const { start, server } = await import("../server/index.mjs");
await start(0, "127.0.0.1");
const addr = server.address();
const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;

const call = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  let body: any = null;
  try { body = await res.json(); } catch { /* 본문 없음 */ }
  return { status: res.status, body, headers: res.headers };
};

console.log("\n[1] 헬스체크와 빈 스냅샷");
{
  const h = await call("/api/health");
  check(h.status === 200 && h.body?.ok === true, "GET /api/health 200 ok", JSON.stringify(h.body));
  const s = await call("/api/snapshot");
  check(s.status === 200 && Object.keys(s.body?.data ?? {}).length === 0, "초기 스냅샷은 비어 있다");
}

console.log("\n[2] 일괄 반영(PUT)과 조회");
{
  const rows = [{ id: "M-1", code: "FG-1001", name: "에어프라이어" }, { id: "M-2", code: "RM-3001", name: "MLCC" }];
  const put = await call("/api/entities/master.material", { method: "PUT", body: JSON.stringify({ data: rows }) });
  check(put.status === 200 && put.body?.data?.length === 2, "PUT 으로 2건 원자적 반영");
  const get = await call("/api/entities/master.material");
  check(get.body?.data?.[0]?.code === "FG-1001", "GET 으로 저장 내용 확인");
  const snap = await call("/api/snapshot");
  check(snap.body?.data?.["master.material"]?.length === 2, "스냅샷에 키가 포함된다");
}

console.log("\n[3] 단건 CRUD");
{
  const post = await call("/api/entities/master.material", {
    method: "POST", body: JSON.stringify({ row: { id: "M-3", code: "PK-4001", name: "포장박스" } }),
  });
  check(post.status === 201 && post.body?.data?.length === 3, "POST 로 1건 추가");

  const dup = await call("/api/entities/master.material", {
    method: "POST", body: JSON.stringify({ row: { id: "M-3", code: "DUP" } }),
  });
  check(dup.status === 409, "중복 id POST 는 409", `status=${dup.status}`);

  const patch = await call("/api/entities/master.material/M-1", {
    method: "PATCH", body: JSON.stringify({ patch: { name: "에어프라이어 5.5L", id: "해킹시도" } }),
  });
  const patched = patch.body?.data?.find((r: any) => r.id === "M-1");
  check(patch.status === 200 && patched?.name === "에어프라이어 5.5L", "PATCH 로 필드 수정");
  check(patched?.id === "M-1" && !patch.body?.data?.some((r: any) => r.id === "해킹시도"), "PATCH 는 id 를 변경하지 않는다");

  const missing = await call("/api/entities/master.material/NOPE", { method: "PATCH", body: JSON.stringify({ patch: { x: 1 } }) });
  check(missing.status === 404, "없는 id PATCH 는 404", `status=${missing.status}`);

  const del = await call("/api/entities/master.material", { method: "DELETE", body: JSON.stringify({ ids: ["M-2", "M-3"] }) });
  check(del.status === 200 && del.body?.data?.length === 1, "DELETE 로 2건 삭제");
}

console.log("\n[4] 입력 검증 (신뢰 경계)");
{
  const traversal = await call("/api/entities/..%2F..%2Fetc%2Fpasswd");
  check(traversal.status === 400, "경로 조작 키는 400 으로 거부", `status=${traversal.status}`);

  const upper = await call("/api/entities/Master.Material");
  check(upper.status === 400, "패턴 외 키(대문자)는 400");

  const badJson = await fetch(`${base}/api/entities/master.material`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: "{not json",
  });
  check(badJson.status === 400, "깨진 JSON 본문은 400", `status=${badJson.status}`);

  const noId = await call("/api/entities/test.rows", { method: "PUT", body: JSON.stringify({ data: [{ code: "X" }] }) });
  check(noId.status === 400, "id 없는 행은 400");

  const dupIds = await call("/api/entities/test.rows", {
    method: "PUT", body: JSON.stringify({ data: [{ id: "A" }, { id: "A" }] }),
  });
  check(dupIds.status === 400, "중복 id 배열은 400");

  const notArray = await call("/api/entities/test.rows", { method: "PUT", body: JSON.stringify({ data: { id: "A" } }) });
  check(notArray.status === 400, "배열이 아닌 data 는 400");

  const badMethod = await call("/api/entities/master.material", { method: "HEAD" as any });
  check(badMethod.status === 405 || badMethod.status === 400, "미지원 메서드는 405");

  const unknown = await call("/api/nope");
  check(unknown.status === 404, "알 수 없는 경로는 404");
}

console.log("\n[5] CORS 허용 목록");
{
  const allowed = await call("/api/health", { headers: { Origin: "http://localhost:5180" } });
  check(allowed.headers.get("access-control-allow-origin") === "http://localhost:5180", "허용 오리진에는 CORS 헤더를 준다");
  const denied = await call("/api/health", { headers: { Origin: "http://evil.example" } });
  check(denied.headers.get("access-control-allow-origin") === null, "허용 목록 밖 오리진에는 주지 않는다");
}

console.log("\n[6] 동시 쓰기 직렬화 (갱신 유실 방지)");
{
  await call("/api/entities/concurrent.test", { method: "PUT", body: JSON.stringify({ data: [] }) });
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      call("/api/entities/concurrent.test", { method: "POST", body: JSON.stringify({ row: { id: `C-${i}`, n: i } }) })
    )
  );
  check(results.every((r) => r.status === 201), "동시 POST 20건이 모두 성공");
  const after = await call("/api/entities/concurrent.test");
  check(after.body?.data?.length === 20, "20건이 모두 남아 있다 (유실 없음)", `count=${after.body?.data?.length}`);
}

console.log("\n[7] ID 순번 구간 예약 — 클라이언트 간 충돌 방지");
{
  const a = await call("/api/sequence/reserve", { method: "POST", body: JSON.stringify({ count: 10 }) });
  check(a.status === 200 && a.body?.end - a.body?.start === 9, "10개 구간을 예약한다", JSON.stringify(a.body));

  const b = await call("/api/sequence/reserve", { method: "POST", body: JSON.stringify({ count: 10 }) });
  check(b.body?.start > a.body?.end, "다음 예약은 앞 구간과 겹치지 않는다", `${JSON.stringify(a.body)} → ${JSON.stringify(b.body)}`);

  // 동시 예약 20건이 서로 겹치지 않아야 한다 (다중 클라이언트 상황)
  const blocks = await Promise.all(
    Array.from({ length: 20 }, () => call("/api/sequence/reserve", { method: "POST", body: JSON.stringify({ count: 5 }) }))
  );
  const used = new Set<number>();
  let overlap = false;
  for (const blk of blocks) {
    for (let n = blk.body.start; n <= blk.body.end; n++) {
      if (used.has(n)) overlap = true;
      used.add(n);
    }
  }
  check(!overlap && used.size === 100, "동시 예약 20건(각 5개)이 전혀 겹치지 않는다", `unique=${used.size}`);

  const bad = await call("/api/sequence/reserve", { method: "POST", body: JSON.stringify({ count: 0 }) });
  check(bad.status === 400, "count 0 은 400");

  // 기존 데이터의 id 순번을 관찰해 최고 수위를 올린다
  await call("/api/entities/seq.observe", {
    method: "PUT",
    body: JSON.stringify({ data: [{ id: "X-500000" }] }),
  });
  const after = await call("/api/sequence/reserve", { method: "POST", body: JSON.stringify({ count: 1 }) });
  check(after.body?.start > 500000, "저장된 id 보다 큰 번호를 발급한다", JSON.stringify(after.body));
}

console.log("\n[8] 재시작 후에도 데이터가 유지된다");
{
  const before = await call("/api/entities/master.material");
  server.close();
  const { start: start2, server: server2 } = await import(`../server/index.mjs?reload=${Date.now()}`);
  await start2(0, "127.0.0.1");
  const a2 = server2.address();
  const base2 = `http://127.0.0.1:${typeof a2 === "object" && a2 ? a2.port : 0}`;
  const res = await fetch(`${base2}/api/entities/master.material`);
  const body: any = await res.json();
  check(
    JSON.stringify(body?.data) === JSON.stringify(before.body?.data),
    "새 프로세스 인스턴스가 같은 데이터를 읽는다"
  );
  server2.close();
}

await rm(dataDir, { recursive: true, force: true });

console.log(`\n═══ 결과: PASS ${pass} / FAIL ${fail} — ${fail === 0 ? "✅ 백엔드 검증 성공" : "❌ 실패 있음"} ═══`);
process.exit(fail === 0 ? 0 : 1);
