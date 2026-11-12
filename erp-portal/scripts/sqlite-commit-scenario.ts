// SQLite (WAL 모드) 하이브리드 스키마, 시뮬레이션 확정(Commit) 원자적 트랜잭션,
// 버전 증가, 감사 로그(Audit Trail), 레거시 JSON 마이그레이션 통합 검증 스크립트.
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let pass = 0;
let fail = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (ok) {
    pass++;
    console.log(`PASS | ${label}`);
  } else {
    fail++;
    console.log(`FAIL | ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

const dataDir = await mkdtemp(join(tmpdir(), "erp-sqlite-commit-"));
process.env.DATA_DIR = dataDir;
process.env.ALLOWED_ORIGINS = "*";

// [0] 레거시 JSON 파일 사전 배치 -> SQLite 자동 마이그레이션 검증
await writeFile(
  join(dataDir, "master.material.json"),
  JSON.stringify([
    { id: "M-1001", code: "FG-1001", name: "에어프라이어 5L" },
    { id: "M-1002", code: "FG-1002", name: "무선청소기 프로" },
  ]),
  "utf8"
);

const { start, server } = await import("../server/index.mjs");
await start(0, "127.0.0.1");
const addr = server.address();
const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
process.env.ERP_API_URL = base;

const call = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-ERP-User-Id": encodeURIComponent("U-1"),
      "X-ERP-User-Role": encodeURIComponent("관리자"),
      "X-ERP-User-Status": encodeURIComponent("활성"),
      ...(init?.headers ?? {}),
    },
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  return { status: res.status, body };
};

console.log("\n[1] SQLite (WAL) 엔진 헬스체크 및 레거시 JSON 자동 마이그레이션");
{
  const h = await call("/api/health");
  check(h.status === 200 && h.body?.ok === true, "GET /api/health 응답 200");
  check(h.body?.db?.engine === "SQLite (WAL Mode)", "DB 엔진이 SQLite (WAL Mode) 로 보고됨", JSON.stringify(h.body?.db));
  check(h.body?.keys === 1, "레거시 JSON 파일 1종이 SQLite 로 자동 마이그레이션됨");

  const mat = await call("/api/entities/master.material");
  check(mat.body?.data?.length === 2 && mat.body?.data?.[0]?.code === "FG-1001", "마이그레이션된 품목 데이터 정합성 확인");
}

console.log("\n[2] 프론트엔드 시뮬레이션 결과 원자적 확정(Commit) 및 버전 관리");
{
  const simStores = {
    "scm.forecast": [
      { id: "FC-1", material: "FG-1001", week: "2026-W43", forecast: 412, aiForecast: 412 },
      { id: "FC-2", material: "FG-1001", week: "2026-W44", forecast: 436, aiForecast: 436 },
    ],
    "scm.forecast_params": [
      { id: "FP-1", material: "FG-1001", alpha: 0.4, beta: 0.2, maWindow: 4 },
    ],
  };

  const c1 = await call("/api/simulation/commit", {
    method: "POST",
    body: JSON.stringify({
      module: "SCM",
      planPeriod: "2026-W27~W50",
      planType: "DEMAND_FORECAST_24W",
      comment: "1차 Holt AI 통계예측 시뮬레이션 확정",
      stores: simStores,
    }),
  });
  check(c1.status === 201 && c1.body?.ok === true, "POST /api/simulation/commit 1차 확정 성공 (201)");
  check(c1.body?.data?.version === 1, "첫 확정 버전은 v1 이다", JSON.stringify(c1.body?.data));
  check(c1.body?.data?.rowCount === 3, "확정된 총 행 수는 3건 (2 + 1)");

  // 2차 시뮬레이션 수정 후 재확정 -> v2 증가 확인
  simStores["scm.forecast"][0].forecast = 450;
  const c2 = await call("/api/simulation/commit", {
    method: "POST",
    body: JSON.stringify({
      module: "SCM",
      planPeriod: "2026-W27~W50",
      planType: "DEMAND_FORECAST_24W",
      comment: "2차 영업 프로모션 물량 반영 재확정",
      stores: simStores,
    }),
  });
  check(c2.status === 201 && c2.body?.data?.version === 2, "동일 계획 재확정 시 버전이 v2 로 자동 증가");

  // 스토어에 실제 반영되었는지 조회
  const fc = await call("/api/entities/scm.forecast");
  check(fc.body?.data?.[0]?.forecast === 450, "확정된 시뮬레이션 값이 SQLite erp_entities 에 영속화됨");

  // 확정 이력 조회
  const hist = await call("/api/simulation/history?module=SCM");
  check(hist.status === 200 && hist.body?.data?.length === 2, "확정 이력 2건이 최신순으로 조회됨");
  check(hist.body?.data?.[0]?.version === 2 && hist.body?.data?.[1]?.version === 1, "최신 버전(v2)이 상단에 위치");
}

console.log("\n[3] 시뮬레이션 확정 원자성(ACID Rollback) 검증");
{
  // 두 번째 스토어에 고의로 잘못된 엔티티(id 누락)를 넣어 전체 롤백되는지 확인
  const badCommit = await call("/api/simulation/commit", {
    method: "POST",
    body: JSON.stringify({
      module: "SCM",
      planPeriod: "2026-W27~W50",
      planType: "DEMAND_FORECAST_24W",
      comment: "오류 데이터 포함 커밋",
      stores: {
        "scm.forecast": [{ id: "FC-1", material: "FG-1001", week: "2026-W43", forecast: 9999 }],
        "scm.badstore": [{ noIdField: "broken" }],
      },
    }),
  });
  check(badCommit.status === 400, "유효하지 않은 스토어 포함 시 400 거부");

  const fcAfter = await call("/api/entities/scm.forecast");
  check(fcAfter.body?.data?.[0]?.forecast === 450, "트랜잭션 거부로 인해 앞 스토어 값도 변경되지 않고 450 유지됨");
}

console.log("\n[4] 감사 추적 로그 (Audit Trail) 자동 기록 검증");
{
  const logs = await call("/api/audit-logs?storeKey=scm.forecast");
  check(logs.status === 200 && Array.isArray(logs.body?.data), "GET /api/audit-logs 200 응답");
  check(
    logs.body?.data?.length >= 2 && logs.body?.data?.[0]?.action === "SIMULATION_COMMIT",
    "감사 로그에 SIMULATION_COMMIT 액션과 버전 정보가 기록됨",
    JSON.stringify(logs.body?.data?.[0])
  );
}

await new Promise<void>((resolve) => server.close(() => resolve()));
await rm(dataDir, { recursive: true, force: true });

console.log(`\n═══ 결과: PASS ${pass} / FAIL ${fail} — ${fail === 0 ? "✅ SQLite 시뮬레이션 확정 검증 성공" : "❌ 실패 있음"} ═══`);
if (fail > 0) process.exitCode = 1;

