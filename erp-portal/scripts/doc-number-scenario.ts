// 문서번호 채번 검증 — 무결번, 문서유형·기간별 분리, 서버/로컬 폴백.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let pass = 0;
let fail = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (ok) { pass++; console.log(`PASS | ${label}`); }
  else { fail++; console.log(`FAIL | ${label}${detail ? ` — ${detail}` : ""}`); }
};

const dataDir = await mkdtemp(join(tmpdir(), "erp-docnum-"));
process.env.DATA_DIR = dataDir;

const { start, server } = await import("../server/index.mjs");
await start(0, "127.0.0.1");
const addr = server.address();
const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
process.env.ERP_API_URL = base;

const post = async (path: string, body: unknown) => {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) as any };
};

const docNumber = await import("../src/services/docNumber");
const backend = await import("../src/services/restBackend");

console.log("\n[1] 형식 — seed 와 같은 <유형>-<YY><연번>");
{
  check(docNumber.formatDocCode("PO", "26", 54) === "PO-26054", "PO/26/54 → PO-26054");
  check(docNumber.formatDocCode("AR", "26", 1) === "AR-26001", "연번은 3자리로 채운다");

  const p = docNumber.parseDocCode("PO-26053");
  check(p?.docType === "PO" && p?.period === "26" && p?.seq === 53, "PO-26053 을 분해한다", JSON.stringify(p));
  check(docNumber.parseDocCode("MAT-1203") === null, "기술 키 형식(MAT-1203)은 문서번호가 아니다");
  check(docNumber.parseDocCode("") === null, "빈 문자열은 null");
  check(docNumber.parseDocCode("po-26001") === null, "소문자 유형은 거부");

  // seed 에 있는 실제 번호들이 모두 파싱되어야 한다
  const seeds = ["PO-26051", "PR-26031", "SO-26010", "JV-26002", "AR-26001", "AP-26001", "QT-26001"];
  check(seeds.every((c) => docNumber.parseDocCode(c) !== null), "seed 문서번호가 모두 파싱된다");
}

console.log("\n[2] maxDocSeq — 유형·기간별 최대 연번");
{
  const codes = ["PO-26051", "PO-26053", "PO-26052", "SO-26010", "PO-25999"];
  check(docNumber.maxDocSeq(codes, "PO", "26") === 53, "PO/26 최대는 53", String(docNumber.maxDocSeq(codes, "PO", "26")));
  check(docNumber.maxDocSeq(codes, "SO", "26") === 10, "SO/26 은 PO 와 분리된다");
  check(docNumber.maxDocSeq(codes, "PO", "25") === 999, "기간이 다르면 별도로 센다");
  check(docNumber.maxDocSeq(codes, "WO", "26") === 0, "해당 유형이 없으면 0");
}

console.log("\n[3] 서버 채번 — 무결번");
{
  const issued: number[] = [];
  for (let i = 0; i < 5; i++) {
    const r = await post("/api/docnumber/next", { docType: "PO", period: "26" });
    issued.push(r.body.seq);
  }
  check(JSON.stringify(issued) === JSON.stringify([1, 2, 3, 4, 5]), "1부터 구멍 없이 증가한다", JSON.stringify(issued));

  const so = await post("/api/docnumber/next", { docType: "SO", period: "26" });
  check(so.body.seq === 1, "다른 문서유형은 별도 카운터다 (SO 는 1부터)", String(so.body.seq));

  const other = await post("/api/docnumber/next", { docType: "PO", period: "27" });
  check(other.body.seq === 1, "기간이 다르면 별도 카운터다");

  const back = await post("/api/docnumber/next", { docType: "PO", period: "26" });
  check(back.body.seq === 6 && back.body.number === "PO-26006", "PO/26 은 이어서 6번", back.body.number);
}

console.log("\n[4] 동시 채번 — 같은 번호가 두 번 나가지 않는다");
{
  const results = await Promise.all(
    Array.from({ length: 30 }, () => post("/api/docnumber/next", { docType: "JV", period: "26" }))
  );
  const seqs = results.map((r) => r.body.seq).sort((a, b) => a - b);
  const unique = new Set(seqs);
  check(unique.size === 30, "30건이 모두 고유하다", `unique=${unique.size}`);
  check(seqs[0] === 1 && seqs[29] === 30, "1~30 이 빠짐없이 발급된다 (무결번)", `${seqs[0]}~${seqs[29]}`);
}

console.log("\n[5] 저장된 code 를 관찰해 수위를 올린다");
{
  // seed 처럼 이미 번호가 있는 데이터를 넣으면 그보다 큰 번호를 발급해야 한다
  await fetch(`${base}/api/entities/procurement.order`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [{ id: "PO-26051", code: "PO-26051" }, { id: "PO-26099", code: "PO-26099" }] }),
  });
  const next = await post("/api/docnumber/next", { docType: "PO", period: "26" });
  check(next.body.seq === 100, "저장된 최대 번호(99) 다음인 100 을 발급한다", String(next.body.seq));
}

console.log("\n[6] 입력 검증 (신뢰 경계)");
{
  const bad1 = await post("/api/docnumber/next", { docType: "po", period: "26" });
  check(bad1.status === 400, "소문자 문서유형은 400", String(bad1.status));
  const bad2 = await post("/api/docnumber/next", { docType: "../etc", period: "26" });
  check(bad2.status === 400, "경로 문자가 섞인 유형은 400");
  const bad3 = await post("/api/docnumber/next", { docType: "PO", period: "2" });
  check(bad3.status === 400, "기간 형식이 틀리면 400");
  const bad4 = await post("/api/docnumber/next", {});
  check(bad4.status === 400, "본문이 비면 400");
}

console.log("\n[7] nextDocCode — REST 모드");
{
  await backend.bootstrapBackend();
  check(backend.getBackendStatus() === "rest", "REST 모드로 동작한다");

  const a = await docNumber.nextDocCode("WO", []);
  const b = await docNumber.nextDocCode("WO", [a]);
  const pa = docNumber.parseDocCode(a)!;
  const pb = docNumber.parseDocCode(b)!;
  check(pb.seq === pa.seq + 1, "연속한 번호를 받는다", `${a} → ${b}`);
  check(a.startsWith("WO-26"), "현재 기간(26)이 붙는다", a);
}

console.log("\n[7-2] 서버 수위가 화면 데이터보다 낮으면 로컬을 따른다");
{
  // seed 가 서버에 저장되지 않은 상황. 서버의 ZZ 카운터는 0 이지만 화면에는 ZZ-26053 까지 있다.
  const code = await docNumber.nextDocCode("ZZ", ["ZZ-26051", "ZZ-26052", "ZZ-26053"]);
  check(code === "ZZ-26054", "서버가 1번을 줘도 기존 최대(53) 다음을 쓴다", code);

  // 실제로 서버에 저장되면 서버가 code 를 관찰해 수위를 올리고, 이후에는 서버가 앞선다
  await fetch(`${base}/api/entities/zz.docs`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [{ id: "ZZ-26054", code: "ZZ-26054" }] }),
  });
  const next = await docNumber.nextDocCode("ZZ", ["ZZ-26054"]);
  check(next === "ZZ-26055", "저장 후에는 서버 채번이 이어진다", next);
}

console.log("\n[8] 서버가 없으면 로컬 최대값 + 1 로 폴백한다");
{
  server.close();
  await new Promise((r) => setTimeout(r, 100));
  await backend.bootstrapBackend();
  check(backend.getBackendStatus() === "localStorage", "폴백 모드로 내려간다");

  const code = await docNumber.nextDocCode("PO", ["PO-26051", "PO-26053", "SO-26010"]);
  check(code === "PO-26054", "기존 최대(53) 다음 번호를 만든다", code);

  const first = await docNumber.nextDocCode("XX", []);
  check(first === "XX-26001", "기존 번호가 없으면 1번부터", first);
}

await rm(dataDir, { recursive: true, force: true });

console.log(`\n═══ 결과: PASS ${pass} / FAIL ${fail} — ${fail === 0 ? "✅ 문서번호 검증 성공" : "❌ 실패 있음"} ═══`);
process.exit(fail === 0 ? 0 : 1);
