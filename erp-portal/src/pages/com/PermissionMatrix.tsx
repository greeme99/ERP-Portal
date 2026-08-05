// COM-002 권한관리 — 역할 × 모듈 권한 매트릭스 (없음/조회/편집/승인)
import { MODULES } from "../../data/menu";
import { permStore, userStore, PERM_LEVELS, PERM_STYLE } from "../../data/mock/platform";
import { useStore, downloadCsv } from "../../services/store";

export default function PermissionMatrix() {
  const perms = useStore(permStore);
  const users = useStore(userStore);

  const setPerm = (role: string, moduleId: string, level: string) => {
    const row = perms.find((p) => p.role === role);
    if (row) permStore.update(row.id, { perms: { ...row.perms, [moduleId]: level } });
  };

  const userCount = (role: string) => users.filter((u) => u.role === role && u.status === "활성").length;

  const excel = () =>
    downloadCsv("권한매트릭스.csv", ["역할", ...MODULES.map((m) => m.name)],
      perms.map((p) => [p.role, ...MODULES.map((m) => p.perms[m.id] ?? "없음")]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">13. 공통/플랫폼 (Platform)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">권한관리 (COM-002)</h1>
          <span className="text-[11px] text-sub">역할 × 모듈 접근권한 매트릭스</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3 text-[11px] text-sub">
        <span>권한 레벨: <span className="text-slate-400">없음</span> · <span className="text-blue-500">조회</span> · <span className="text-amber-600">편집</span> · <span className="text-emerald-600 font-semibold">승인</span></span>
        <button onClick={excel} className="ml-auto px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="text-[11px]">
          <thead>
            <tr className="border-b border-line text-sub">
              <th className="px-3 py-2 text-left sticky left-0 bg-panel z-10 min-w-[90px]">역할</th>
              {MODULES.map((m) => (
                <th key={m.id} className="px-2 py-2 text-center whitespace-nowrap" title={m.name}>{m.code}<br /><span className="text-[10px]">{m.name.slice(0, 4)}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {perms.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="px-3 py-1.5 sticky left-0 bg-panel z-10 font-semibold">
                  {p.role}<span className="ml-1 text-[10px] text-sub">({userCount(p.role)}명)</span>
                </td>
                {MODULES.map((m) => (
                  <td key={m.id} className="px-1 py-1 text-center">
                    <select
                      value={p.perms[m.id] ?? "없음"}
                      onChange={(e) => setPerm(p.role, m.id, e.target.value)}
                      className={`px-1 py-0.5 rounded border border-line bg-surface text-[10px] ${PERM_STYLE[p.perms[m.id] ?? "없음"] ?? ""}`}
                    >
                      {PERM_LEVELS.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[11px] text-sub">
        관리자=전체 승인, 경영진=전체 조회, 기능역할=담당 모듈 승인+기타 조회 (기본값). 셀 변경 시 즉시 반영.
      </div>
    </div>
  );
}
