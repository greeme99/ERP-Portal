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
];
const admin = { id: "U-1", name: "관리자", role: "관리자", status: "활성" };
const sales = { id: "U-2", name: "김영업", role: "영업", status: "활성" };
const acct = { id: "U-3", name: "정회계", role: "회계", status: "활성" };
const prod = { id: "U-4", name: "이생산", role: "생산", status: "활성" };
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

console.log("\n[5] User Exit — 권한에 따라 활성/바이패스");
{
  userExit.clearUserExits();
  registerDefaultUserExits();
  const exits = userExit.listUserExits();
  check(exits.length === 3, "기본 Exit 3개가 등록된다", String(exits.length));
  check(userExit.listUserExits("sd.order.beforeSave").length === 1, "지점별 조회가 된다");

  const canFor = (user: typeof sales) => (moduleId: string, level: authz.PermLevel) =>
    meetsLevel(resolvePermLevel(perms, user, moduleId), level);

  // 한도 초과 수주: 회계(fi 승인)는 Exit 이 돌아 차단, 영업(fi 없음)은 바이패스
  const overLimit = {
    user: acct,
    document: { total: 900 },
    extra: { creditLimit: 1000, creditUsed: 500 },
  };
  const asAcct = userExit.runUserExits("sd.order.beforeSave", overLimit, canFor(acct));
  check(!asAcct.ok, "fi 권한자에게는 여신 Exit 이 돌아 차단된다", JSON.stringify(asAcct.messages));
  check(asAcct.executed.includes("EXIT_SD_CREDIT_CHECK"), "Exit 이 실행 목록에 있다");

  const asSales = userExit.runUserExits("sd.order.beforeSave", { ...overLimit, user: sales }, canFor(sales));
  check(asSales.ok, "fi 권한이 없으면 Exit 이 바이패스되어 통과한다");
  check(asSales.bypassed.some((b) => b.id === "EXIT_SD_CREDIT_CHECK"), "바이패스 목록에 기록된다", JSON.stringify(asSales.bypassed));
  check(asSales.executed.length === 0, "바이패스된 Exit 은 실행되지 않는다");

  // 한도 내 수주는 통과
  const within = userExit.runUserExits(
    "sd.order.beforeSave",
    { user: acct, document: { total: 100 }, extra: { creditLimit: 1000, creditUsed: 100 } },
    canFor(acct)
  );
  check(within.ok && within.messages.length === 0, "한도 내면 조용히 통과");

  // 소진율 90% 이상은 경고(통과)
  const warn = userExit.runUserExits(
    "sd.order.beforeSave",
    { user: acct, document: { total: 450 }, extra: { creditLimit: 1000, creditUsed: 500 } },
    canFor(acct)
  );
  check(warn.ok && warn.messages.some((m) => m.includes("⚠️")), "소진율 경고는 통과시키고 알린다", JSON.stringify(warn.messages));

  // MM 발주 한도 — 영업은 mm 권한이 없어 바이패스
  const bigPo = { user: sales, document: { amount: PO_APPROVAL_LIMIT + 1 } };
  const poSales = userExit.runUserExits("mm.po.beforeSave", bigPo, canFor(sales));
  check(poSales.ok && poSales.bypassed.length === 1, "mm 권한 없으면 발주 한도 Exit 바이패스");

  const poAdmin = userExit.runUserExits("mm.po.beforeSave", { ...bigPo, user: admin }, canFor(admin));
  check(poAdmin.ok && poAdmin.messages.some((m) => m.includes("⚠️")), "관리자는 한도 초과를 경고로 통과", JSON.stringify(poAdmin.messages));

  const poAcct = userExit.runUserExits("mm.po.beforeSave", { ...bigPo, user: acct }, canFor(acct));
  check(poAcct.ok && poAcct.bypassed.length === 1, "mm 조회만 있으면 Exit 이 바이패스된다 (평가 불가)", JSON.stringify(poAcct.bypassed));

  // mm 편집은 있으나 구매/관리자가 아닌 역할 → Exit 이 돌아 한도 초과를 차단한다
  const poProd = userExit.runUserExits("mm.po.beforeSave", { ...bigPo, user: prod }, canFor(prod));
  check(!poProd.ok, "mm 편집 권한자라도 구매 승인권자가 아니면 한도 초과 차단", JSON.stringify(poProd.messages));
  check(poProd.executed.includes("EXIT_MM_PO_LIMIT"), "해당 Exit 이 실제로 실행됐다");

  // FI 전표 차대
  const jvBad = userExit.runUserExits("fi.journal.beforeSave", { user: acct, document: { debit: 100, credit: 90 } }, canFor(acct));
  check(!jvBad.ok, "차대 불일치 전표는 차단");
  const jvOk = userExit.runUserExits("fi.journal.beforeSave", { user: acct, document: { debit: 100, credit: 100 } }, canFor(acct));
  check(jvOk.ok, "차대 일치 전표는 통과");
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
