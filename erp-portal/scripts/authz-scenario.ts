// 인증·인가 검증 — 권한 판정, 서버측 재검증, User Exit 권한 기반 활성/바이패스.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let pass = 0;
let fail = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (ok) { pass++; console.log(`PASS | ${label}`); }
  else { fail++; console.log(`FAIL | ${label}${detail ? ` — ${detail}` : ""}`); }
};

const dataDir = await mkdtemp(join(tmpdir(), "erp-authz-"));
process.env.DATA_DIR = dataDir;

const { start, server } = await import("../server/index.mjs");
await start(0, "127.0.0.1");
const addr = server.address();
const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;

const authz = await import("../src/services/authz");
const { moduleIdFromPath, resolvePermLevel, meetsLevel, isAdmin, isActive } = authz;
const userExit = await import("../src/services/userExit");
const { registerDefaultUserExits, PO_APPROVAL_LIMIT } = await import("../src/services/userExitDefaults");
const serverAuthz = await import("../server/authz.mjs");

// 권한 매트릭스 — 영업은 sd 승인 / fi 조회 없음, 회계는 fi 승인
const perms = [
  { id: "관리자", role: "관리자", perms: { sd: "승인", mm: "승인", fi: "승인" } },
  { id: "영업", role: "영업", perms: { sd: "승인", mm: "없음", fi: "없음" } },
  { id: "회계", role: "회계", perms: { sd: "조회", mm: "조회", fi: "승인" } },
  // mm 편집은 있으나 구매/관리자가 아닌 역할 — 발주 한도 Exit 의 차단 대상
  { id: "생산", role: "생산", perms: { sd: "조회", mm: "편집", fi: "없음" } },
  { id: "구매", role: "구매", perms: { sd: "조회", mm: "승인", fi: "조회" } },
];
const admin = { id: "U-1", name: "관리자", role: "관리자", status: "활성" };
const sales = { id: "U-2", name: "김영업", role: "영업", status: "활성" };
const acct = { id: "U-3", name: "정회계", role: "회계", status: "활성" };
const prod = { id: "U-4", name: "이생산", role: "생산", status: "활성" };
const buyer = { id: "U-5", name: "박구매", role: "구매", status: "활성" };
const retired = { id: "U-9", name: "퇴사자", role: "영업", status: "비활성" };

console.log("\n[1] 권한 판정 — 역할 유지 + 관리자=admin");
{
  check(isAdmin(admin) && !isAdmin(sales), "role 이 관리자면 admin 이다");
  check(isActive(sales) && !isActive(retired), "비활성 사용자는 isActive false");

  check(resolvePermLevel(perms, admin, "fi") === "승인", "admin 은 모든 모듈 승인");
  check(resolvePermLevel(perms, admin, "없는모듈") === "승인", "admin 은 매트릭스에 없는 모듈도 승인");
  check(resolvePermLevel(perms, sales, "sd") === "승인", "영업은 sd 승인");
  check(resolvePermLevel(perms, sales, "fi") === "없음", "영업은 fi 없음");
  check(resolvePermLevel(perms, sales, "미정의") === "없음", "정의 없는 모듈은 없음");
  check(resolvePermLevel(perms, retired, "sd") === "없음", "비활성 사용자는 어떤 모듈도 없음");
  check(resolvePermLevel(perms, undefined, "sd") === "없음", "사용자 미지정은 없음");

  check(meetsLevel("승인", "편집") && meetsLevel("편집", "편집"), "등급 비교는 상위 포함");
  check(!meetsLevel("조회", "편집"), "조회는 편집을 충족하지 않는다");
}

console.log("\n[2] 라우트에서 모듈 추출");
{
  check(moduleIdFromPath("/m/sd/sd-04") === "sd", "/m/sd/sd-04 → sd");
  check(moduleIdFromPath("/m/fi/fi-03") === "fi", "/m/fi/fi-03 → fi");
  check(moduleIdFromPath("/") === null, "루트는 모듈 화면이 아니다");
  check(moduleIdFromPath("/m/없는모듈/x") === null, "알 수 없는 모듈은 null");
  check(moduleIdFromPath("/m/sd") === "sd", "슬러그가 없어도 모듈은 인식한다");
}

console.log("\n[3] 서버측 인가 재검증");
{
  const { checkAuthz, moduleForKey, requiredLevel } = serverAuthz;
  check(moduleForKey("procurement.order") === "mm", "procurement.* → mm");
  check(moduleForKey("finance.ar") === "fi", "finance.* → fi");
  check(moduleForKey("master.material") === "mdm", "master.* → mdm");
  check(moduleForKey("알수없는키") === null, "매핑 없는 키는 null");
  check(requiredLevel("DELETE") === "승인" && requiredLevel("POST") === "편집" && requiredLevel("GET") === "조회",
    "메서드별 요구 등급");

  const salesId = { id: "U-2", role: "영업", status: "활성" };
  const acctId = { id: "U-3", role: "회계", status: "활성" };

  check(checkAuthz({ identity: salesId, permissionRows: perms, key: "sales.order", method: "POST" }).allowed,
    "영업이 sd 문서를 생성하는 것은 허용");
  const denied = checkAuthz({ identity: salesId, permissionRows: perms, key: "finance.ar", method: "POST" });
  check(!denied.allowed, "영업이 fi 문서를 생성하는 것은 차단", denied.reason);
  check(/fi/.test(denied.reason), "차단 이유에 모듈이 담긴다", denied.reason);

  check(checkAuthz({ identity: acctId, permissionRows: perms, key: "finance.ar", method: "POST" }).allowed,
    "회계는 fi 문서를 생성할 수 있다");
  check(!checkAuthz({ identity: acctId, permissionRows: perms, key: "sales.order", method: "DELETE" }).allowed,
    "조회 권한만 있으면 삭제는 차단");
  check(checkAuthz({ identity: { role: "관리자", status: "활성" }, permissionRows: perms, key: "finance.ar", method: "DELETE" }).allowed,
    "관리자는 통과");
  check(!checkAuthz({ identity: { role: "영업", status: "비활성" }, permissionRows: perms, key: "sales.order", method: "POST" }).allowed,
    "비활성 사용자는 차단");
  check(checkAuthz({ identity: {}, permissionRows: perms, key: "finance.ar", method: "POST" }).allowed,
    "신원 헤더가 없으면 검사를 생략한다 (하위 호환)");
  check(checkAuthz({ identity: salesId, permissionRows: perms, key: "finance.ar", method: "GET" }).allowed,
    "읽기는 차단하지 않는다");
}

console.log("\n[4] 서버 HTTP 레벨 인가 — 실제 403");
{
  const put = (headers: Record<string, string>) =>
    fetch(`${base}/api/entities/finance.ar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ data: [{ id: "AR-1", code: "AR-26001" }] }),
    });

  // 권한 매트릭스를 서버에 올려둔다 (헤더 없이 = 검사 생략 경로)
  const seed = await fetch(`${base}/api/entities/platform.permission`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: perms }),
  });
  check(seed.status === 200, "권한 매트릭스를 서버에 저장한다", String(seed.status));

  const noHeader = await put({});
  check(noHeader.status === 200, "헤더 없는 요청은 통과 (하위 호환)", String(noHeader.status));

  const asSales = await put({ "X-ERP-User-Role": encodeURIComponent("영업"), "X-ERP-User-Status": encodeURIComponent("활성") });
  check(asSales.status === 403, "영업 역할로 fi 쓰기는 403", String(asSales.status));
  const body = await asSales.json();
  check(/권한/.test(String(body?.error)), "403 응답에 이유가 담긴다", String(body?.error));

  const asAcct = await put({ "X-ERP-User-Role": encodeURIComponent("회계"), "X-ERP-User-Status": encodeURIComponent("활성") });
  check(asAcct.status === 200, "회계 역할은 fi 쓰기 허용", String(asAcct.status));

  const asRetired = await put({ "X-ERP-User-Role": encodeURIComponent("회계"), "X-ERP-User-Status": encodeURIComponent("비활성") });
  check(asRetired.status === 403, "비활성 사용자는 403", String(asRetired.status));
}

console.log("\n[5] User Exit — 검증은 항상 실행, 권한은 예외승인에만 쓴다");
{
  userExit.clearUserExits();
  registerDefaultUserExits();
  check(userExit.listUserExits().length === 3, "기본 Exit 3개 등록", String(userExit.listUserExits().length));
  check(userExit.listUserExits("sd.order.beforeSave").length === 1, "지점별 조회가 된다");

  const canFor = (user: typeof sales) => (moduleId: string, level: authz.PermLevel) =>
    meetsLevel(resolvePermLevel(perms, user, moduleId), level);

  const overLimit = { user: sales, document: { total: 900 }, extra: { creditLimit: 1000, creditUsed: 500 } };

  // 핵심 변경: fi 권한이 없는 영업에게도 여신 검증이 실행되어 차단된다 (이전에는 바이패스)
  const asSales = userExit.runUserExits("sd.order.beforeSave", overLimit, canFor(sales));
  check(asSales.executed.includes("EXIT_SD_CREDIT_CHECK"), "fi 권한 없어도 검증이 실행된다 (바이패스 없음)");
  check(!asSales.ok, "영업의 한도 초과 수주가 차단된다", JSON.stringify(asSales.messages));
  check(asSales.blocked.some((b) => b.id === "EXIT_SD_CREDIT_CHECK"), "예외승인 권한 부재를 알린다");

  // fi 승인 권한자는 경고로 통과
  const asAcct = userExit.runUserExits("sd.order.beforeSave", { ...overLimit, user: acct }, canFor(acct));
  check(asAcct.ok, "fi 승인 권한자는 예외 통과한다");
  check(asAcct.messages.some((m) => m.includes("⚠️")), "경고로 알린다", JSON.stringify(asAcct.messages));

  const within = userExit.runUserExits(
    "sd.order.beforeSave",
    { user: sales, document: { total: 100 }, extra: { creditLimit: 1000, creditUsed: 100 } },
    canFor(sales)
  );
  check(within.ok && within.messages.length === 0, "한도 내면 조용히 통과");

  // 발주 한도 — mm 승인 권한자만 예외 통과
  const bigPo = { document: { amount: PO_APPROVAL_LIMIT + 1 } };
  const poSales = userExit.runUserExits("mm.po.beforeSave", { ...bigPo, user: sales }, canFor(sales));
  check(!poSales.ok, "mm 승인 권한 없으면 한도 초과 발주 차단");
  check(poSales.executed.includes("EXIT_MM_PO_LIMIT"), "mm 권한 없어도 검증은 실행된다");

  const poBuyer = userExit.runUserExits("mm.po.beforeSave", { ...bigPo, user: buyer }, canFor(buyer));
  check(poBuyer.ok && poBuyer.messages.some((m) => m.includes("⚠️")), "구매(mm 승인)는 경고 통과", JSON.stringify(poBuyer.messages));

  // 전표 차대 — approval 이 없어 아무도 못 넘긴다
  const jvBad = userExit.runUserExits("fi.journal.beforeSave", { user: admin, document: { debit: 100, credit: 90 } }, () => true);
  check(!jvBad.ok, "차대 불일치는 관리자도 넘길 수 없다 (approval 없음)");
  check(jvBad.blocked.length === 0, "approval 이 없으면 blocked 에 담지 않는다");
  const jvOk = userExit.runUserExits("fi.journal.beforeSave", { user: admin, document: { debit: 100, credit: 100 } }, () => true);
  check(jvOk.ok, "차대 일치 전표는 통과");
}

console.log("\n[5-2] 서버 업무 규칙 재검증 — UI 우회 차단 (T-4)");
{
  const put = (key: string, data: unknown[], headers: Record<string, string> = {}) =>
    fetch(`${base}/api/entities/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ data }),
    });
  const asRole = (role: string) => ({
    "X-ERP-User-Role": encodeURIComponent(role),
    "X-ERP-User-Status": encodeURIComponent("활성"),
  });

  const bad = await put("finance.journal", [{ id: "JV-1", code: "JV-26001", lines: [{ dr: 100, cr: 0 }, { dr: 0, cr: 90 }] }], asRole("회계"));
  check(bad.status === 422, "불균형 전표는 422", String(bad.status));
  const badBody = await bad.json();
  check(/RULE_FI_JV_BALANCE/.test(String(badBody?.error)), "위반 규칙 id 를 알려준다", String(badBody?.error));

  const good = await put("finance.journal", [{ id: "JV-1", code: "JV-26001", lines: [{ dr: 100, cr: 0 }, { dr: 0, cr: 100 }] }], asRole("회계"));
  check(good.status === 200, "균형 전표는 200", String(good.status));

  const adminBad = await put("finance.journal", [{ id: "JV-2", code: "JV-26002", lines: [{ dr: 1, cr: 0 }] }], asRole("관리자"));
  check(adminBad.status === 422, "관리자도 차대 불일치는 막힌다", String(adminBad.status));

  const overPo = [{ id: "PO-1", code: "PO-26001", qty: 2, price: PO_APPROVAL_LIMIT }];
  const poByProd = await put("procurement.order", overPo, asRole("생산"));
  check(poByProd.status === 422, "mm 승인 권한 없으면 한도 초과 발주 422", String(poByProd.status));
  const poByBuyer = await put("procurement.order", overPo, asRole("구매"));
  check(poByBuyer.status === 200, "구매(mm 승인)는 한도 초과 발주 통과", String(poByBuyer.status));

  const so = await put("sales.order", [{ id: "SO-1", code: "SO-26001", total: 99999999999 }], asRole("영업"));
  check(so.status === 200, "여신한도는 서버가 검증하지 않는다 (클라이언트 전용)", String(so.status));

  const noHeader = await put("finance.journal", [{ id: "JV-3", code: "JV-26003", lines: [{ dr: 5, cr: 0 }] }]);
  check(noHeader.status === 422, "신원 헤더가 없어도 업무 규칙은 적용된다", String(noHeader.status));
}

console.log("\n[6] Exit 오류가 표준 로직을 깨뜨리지 않는다");
{
  userExit.clearUserExits();
  userExit.registerUserExit({
    id: "EXIT_BOOM",
    label: "오류 Exit",
    point: "sd.order.beforeSave",
    run: () => { throw new Error("의도된 오류"); },
  });
  const r = userExit.runUserExits("sd.order.beforeSave", { user: admin, document: {} }, () => true);
  check(!r.ok, "Exit 이 던지면 차단한다 (조용히 넘기지 않는다)");
  check(r.messages.some((m) => m.includes("의도된 오류")), "오류 메시지를 전달한다", JSON.stringify(r.messages));

  // 같은 id 재등록은 덮어쓴다 (HMR 중복 방지)
  userExit.registerUserExit({ id: "EXIT_BOOM", label: "정상화", point: "sd.order.beforeSave", run: () => ({ ok: true }) });
  check(userExit.listUserExits().length === 1, "같은 id 는 덮어쓴다");
}

server.close();
await rm(dataDir, { recursive: true, force: true });

console.log(`\n═══ 결과: PASS ${pass} / FAIL ${fail} — ${fail === 0 ? "✅ 인증·인가 검증 성공" : "❌ 실패 있음"} ═══`);
process.exit(fail === 0 ? 0 : 1);
