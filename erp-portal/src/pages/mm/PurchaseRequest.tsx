// MM-001 구매요청(PR) — 승인 Workflow + 예산 체크
import { useState } from "react";
import { materialStore } from "../../data/mock/master";
import { budgetStore, prStore } from "../../data/mock/procurement";
import { useStore, nextId, downloadCsv } from "../../services/store";

const STATUS_STYLE: Record<string, string> = {
  승인대기: "bg-amber-100 text-amber-700",
  승인: "bg-emerald-100 text-emerald-700",
  반려: "bg-red-100 text-red-700",
};

export default function PurchaseRequest() {
  const prs = useStore(prStore);
  const budgets = useStore(budgetStore);
  const mats = useStore(materialStore).filter((m) => m.type === "원자재" || m.type === "부자재");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ dept: "생산팀", material: "", qty: 1000, dueDate: "2026-07-31" });

  const mat = mats.find((m) => m.code === form.material);
  const amount = (mat?.price ?? 0) * form.qty;
  const budget = budgets.find((b) => b.dept === form.dept);
  const remain = budget ? budget.budget - budget.used : 0;
  const over = amount > remain;

  const save = () => {
    if (!form.material) return alert("품목을 선택하세요.");
    if (over && !confirm(`⚠️ 예산 초과: ${form.dept} 잔여 ${remain.toLocaleString()}원 < 요청 ${amount.toLocaleString()}원.\n예산 초과 승인 절차로 진행할까요?`)) return;
    const code = nextId("PR");
    prStore.create({
      id: code, code, dept: form.dept, material: form.material, qty: form.qty,
      amount, reqDate: new Date().toISOString().slice(0, 10), dueDate: form.dueDate, status: "승인대기",
    });
    setCreating(false);
  };

  const setStatus = (id: string, status: string, dept?: string, amt?: number) => {
    prStore.update(id, { status });
    if (status === "승인" && dept && amt) {
      const b = budgets.find((x) => x.dept === dept);
      if (b) budgetStore.update(b.id, { used: b.used + amt });
    }
  };

  const excel = () =>
    downloadCsv("구매요청.csv", ["PR번호", "부서", "품목", "수량", "금액", "요청일", "납기요청", "상태"],
      prs.map((p) => [p.code, p.dept, p.material, p.qty, p.amount, p.reqDate, p.dueDate, p.status]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">03. 구매관리 (Procurement)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">구매요청 PR (MM-001)</h1>
          <span className="text-[11px] text-sub">승인 Workflow · 예산 체크</span>
        </div>
      </div>

      {/* 부서 예산 현황 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {budgets.map((b) => {
          const pct = Math.round((b.used / b.budget) * 100);
          const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
          return (
            <div key={b.id} className="bg-panel border border-line rounded-lg p-3">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold">{b.dept}</span>
                <span className="text-sub">{pct}%</span>
              </div>
              <div className="h-1.5 bg-surface rounded mt-2">
                <div className={`h-1.5 rounded ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="text-[10px] text-sub mt-1">
                {(b.used / 100000000).toFixed(1)}억 / {(b.budget / 100000000).toFixed(1)}억
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-2">
        <span className="text-[11px] text-sub">{prs.length}건</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ PR 생성</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      {/* PR 목록 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">PR번호</th>
              <th className="px-3 py-2">부서</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2 text-right">금액(원)</th>
              <th className="px-3 py-2">납기요청</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">승인처리</th>
            </tr>
          </thead>
          <tbody>
            {prs.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{p.code}</td>
                <td className="px-3 py-2">{p.dept}</td>
                <td className="px-3 py-2">{p.material}</td>
                <td className="px-3 py-2 text-right">{p.qty.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{p.amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-sub">{p.dueDate}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[p.status] ?? ""}`}>{p.status}</span>
                </td>
                <td className="px-3 py-2">
                  {p.status === "승인대기" && (
                    <div className="flex gap-1">
                      <button onClick={() => setStatus(p.id, "승인", p.dept, p.amount)} className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">✓ 승인</button>
                      <button onClick={() => setStatus(p.id, "반려")} className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-semibold">✗ 반려</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 생성 모달 */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[440px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">구매요청 생성</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                요청 부서
                <select value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  {budgets.map((b) => <option key={b.dept} value={b.dept}>{b.dept}</option>)}
                </select>
              </label>
              <label className="text-[11px] text-sub block">
                품목 (원자재/부자재)
                <select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {mats.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="text-[11px] text-sub">
                  수량
                  <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                    className="block w-28 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
                <label className="text-[11px] text-sub">
                  납기요청일
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="block mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
              </div>
              <div className={`text-[12px] p-2 rounded ${over ? "bg-red-100 text-red-700" : "bg-accent-soft"}`}>
                예상 금액 <b>{amount.toLocaleString()}원</b> | {form.dept} 예산 잔여 <b>{remain.toLocaleString()}원</b>
                {over && " — ⚠️ 예산 초과"}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 상신</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
