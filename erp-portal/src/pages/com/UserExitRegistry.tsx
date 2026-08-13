// COM-27 User Exit 관리 — 등록된 확장 훅과 현재 사용자의 예외 승인 가능 여부.
//
// 검증은 모든 사용자에게 항상 실행된다. 권한은 "규칙 위반을 예외 승인할 수 있는가"
// 에만 쓰인다(문서 4.5 §2.4 T-1). 이 화면은 레지스트리를 읽어 보여주는 조회 화면이다.
import { MODULES } from "../../data/menu";
import { PERM_ORDER, meetsLevel, resolvePermLevel, useAuthz } from "../../services/authz";
import { ROLES, permStore } from "../../data/mock/platform";
import { useStore } from "../../services/store";
import { listUserExits } from "../../services/userExit";
import { downloadCsv } from "../../services/store";

const POINT_LABEL: Record<string, string> = {
  "sd.order.beforeSave": "SD 수주 저장 전",
  "mm.po.beforeSave": "MM 발주 저장 전",
  "fi.journal.beforeSave": "FI 전표 저장 전",
};

const moduleName = (id: string) => MODULES.find((m) => m.id === id)?.name ?? id;

export default function UserExitRegistry() {
  const authz = useAuthz();
  const perms = useStore(permStore);
  const exits = listUserExits();

  // 권한그룹(역할) × User Exit 매트릭스 — 어느 역할에서 어떤 Exit 이 가동되는지.
  // admin 이 권한 설계를 검토할 때 참조하는 표이며, 사용자 메뉴얼의 근거 자료다.
  const matrix = ROLES.map((role) => {
    const asUser = { id: role, role, status: "활성" };
    return {
      role,
      cells: exits.map((e) => {
        if (!e.approval) return { canApprove: false, held: "-" as string };
        const held = resolvePermLevel(perms, asUser, e.approval.moduleId);
        return { canApprove: meetsLevel(held, e.approval.level), held };
      }),
    };
  });

  const rows = exits.map((e) => {
    const req = e.approval;
    const canApprove = req ? authz.can(req.moduleId, req.level) : false;
    const held = req ? authz.levelOf(req.moduleId) : "-";
    return { exit: e, canApprove, held, req };
  });

  const excel = () =>
    downloadCsv(
      "공통_UserExit_레지스트리.csv",
      ["Exit ID", "명칭", "훅 지점", "실행", "예외승인 모듈", "예외승인 등급", "현재 보유 등급", "현재 사용자 예외승인"],
      rows.map((r) => [
        r.exit.id,
        r.exit.label,
        POINT_LABEL[r.exit.point] ?? r.exit.point,
        "항상",
        r.req ? moduleName(r.req.moduleId) : "-",
        r.req?.level ?? "예외 불가",
        r.held,
        r.canApprove ? "가능" : "불가",
      ])
    );

  const matrixExcel = () =>
    downloadCsv(
      "공통_권한그룹별_UserExit_매트릭스.csv",
      ["권한그룹(역할)", ...exits.map((e) => `${e.label} 예외승인 (${e.approval ? `${moduleName(e.approval.moduleId)} ${e.approval.level}` : "불가"})`)],
      matrix.map((row) => [row.role, ...row.cells.map((c) => `${c.canApprove ? "승인가능" : "불가"} (보유 ${c.held})`)])
    );

  const approverCount = rows.filter((r) => r.canApprove).length;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">13. 공통/플랫폼 (Platform)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">User Exit 관리 (COM-27)</h1>
          <span className="text-[11px] text-sub">
            표준 로직 확장 훅 · 검증은 항상 실행, 권한은 예외승인에만 쓰인다
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">등록된 Exit (모두 항상 실행)</div>
          <div className="text-xl font-bold mt-1 font-mono">{rows.length} <span className="text-xs font-normal">개</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">현재 사용자 예외승인 가능</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{approverCount} <span className="text-xs font-normal text-ink">개</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">예외승인 불가</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{rows.length - approverCount} <span className="text-xs font-normal text-ink">개</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <span className="text-sub">
          현재 사용자{" "}
          <b className="text-main">{String(authz.user?.name ?? "-")}</b> (
          {String(authz.user?.role ?? "-")}
          {authz.isAdmin ? " · admin" : ""})
        </span>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 User Exit Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">Exit ID</th>
              <th className="px-3 py-2">명칭</th>
              <th className="px-3 py-2">훅 지점</th>
              <th className="px-3 py-2">예외승인 권한</th>
              <th className="px-3 py-2">보유 등급</th>
              <th className="px-3 py-2">예외승인</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sub" colSpan={6}>등록된 User Exit 이 없습니다.</td>
              </tr>
            ) : (
              rows.map(({ exit, canApprove, held, req }) => (
                <tr key={exit.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-mono text-[11px]">{exit.id}</td>
                  <td className="px-3 py-2 font-medium">{exit.label}</td>
                  <td className="px-3 py-2 text-sub">{POINT_LABEL[exit.point] ?? exit.point}</td>
                  <td className="px-3 py-2 text-sub">
                    {req ? `${moduleName(req.moduleId)} ${req.level}` : "예외 불가"}
                  </td>
                  <td className="px-3 py-2 font-mono">{held}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        canApprove
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {canApprove ? "가능" : "불가"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line">
          Exit 은 코드로 등록한다(services/userExitDefaults.ts). 검증은 모든 사용자에게 항상
          실행되며, 예외승인 권한이 있으면 규칙 위반을 경고로 통과시킬 수 있다.
          자기완결 규칙(전표 차대·발주 한도)은 서버에서도 같은 함수로 재검증한다.
        </div>
      </div>

      {/* 권한그룹 × User Exit 매트릭스 — 권한 설계 검토용 참조표 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="p-2.5 bg-surface font-bold text-main border-b border-line flex flex-wrap justify-between items-center gap-2">
          <span>🔐 권한그룹 × User Exit 예외승인 매트릭스</span>
          <button onClick={matrixExcel} className="px-2.5 py-1 rounded border border-line font-bold text-[11px] hover:bg-accent-soft">
            📥 매트릭스 Excel
          </button>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface/60">
              <th className="px-3 py-2 sticky left-0 bg-surface">권한그룹 (역할)</th>
              {exits.map((e) => (
                <th key={e.id} className="px-3 py-2 text-center">
                  {e.label}
                  <div className="font-normal text-[10px] text-sub">
                    {e.approval ? `예외승인: ${moduleName(e.approval.moduleId)} ${e.approval.level}` : "예외 불가"}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.role} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-semibold sticky left-0 bg-panel border-r border-line">
                  {row.role}
                  {row.role === "관리자" && <span className="ml-1 text-[10px] text-purple-600 font-bold">admin</span>}
                </td>
                {row.cells.map((c, i) => (
                  <td key={i} className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      c.canApprove ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {c.canApprove ? "승인가능" : "불가"}
                    </span>
                    <div className="text-[10px] text-sub mt-0.5">{c.held}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line leading-relaxed">
          각 칸은 해당 역할이 규칙 위반을 예외승인할 수 있는지와 현재 보유 등급을 보여준다.
          검증 자체는 모든 역할에서 실행된다.
          권한 등급은 {PERM_ORDER.join(" < ")} 순이며 상위 등급은 하위를 포함한다.
          매트릭스는 COM-02 설정을 그대로 반영하므로, 권한을 바꾸면 이 표도 함께 바뀐다.
        </div>
      </div>
    </div>
  );
}
