// MK-005 캠페인관리 — 판촉비·기여매출·ROI, 상태 관리
import { useState } from "react";
import { campaignStore, roi, CP_STATUS_STYLE, CHANNELS } from "../../data/mock/marketing";
import { useStore, nextId, downloadCsv } from "../../services/store";
import { nextDocCode } from "../../services/docNumber";

const eok = (v: number) => `${(v / 100000000).toFixed(2)}억`;

export default function CampaignManagement() {
  const camps = useStore(campaignStore);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", channel: "온라인", budget: 50000000 });

  const totalSpent = camps.reduce((s, c) => s + c.spent, 0);
  const totalRev = camps.reduce((s, c) => s + c.revenue, 0);
  const totalRoi = roi(totalRev, totalSpent);

  const toggle = (c: any) => campaignStore.update(c.id, { status: c.status === "진행" ? "종료" : "진행" });

  const save = async () => {
    if (!form.name.trim()) return alert("캠페인명을 입력하세요.");
    const code = await nextDocCode("CP", campaignStore.getAll().map((x) => String(x.code)));
    campaignStore.create({ id: code, code, name: form.name, channel: form.channel, budget: form.budget, spent: 0, revenue: 0, start: "2026-07-03", status: "진행" });
    setCreating(false);
    setForm({ name: "", channel: "온라인", budget: 50000000 });
  };

  const excel = () =>
    downloadCsv("캠페인.csv", ["캠페인번호", "캠페인명", "채널", "예산", "집행", "기여매출", "ROI%", "상태"],
      camps.map((c) => [c.code, c.name, c.channel, c.budget, c.spent, c.revenue, roi(c.revenue, c.spent).toFixed(0), c.status]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. 마케팅 (Marketing)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">캠페인관리 (MK-005)</h1>
          <span className="text-[11px] text-sub">판촉비 집행 · 기여매출 · ROI</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">캠페인</div><div className="text-xl font-bold mt-1">{camps.length}건</div></div>
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">총 집행비</div><div className="text-xl font-bold mt-1">{eok(totalSpent)}</div></div>
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">기여매출</div><div className="text-xl font-bold mt-1">{eok(totalRev)}</div></div>
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">종합 ROI</div><div className={`text-xl font-bold mt-1 ${totalRoi >= 100 ? "text-emerald-500" : totalRoi >= 0 ? "text-amber-500" : "text-red-500"}`}>{totalRoi.toFixed(0)}%</div></div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-2">
        <span className="text-[11px] text-sub">ROI = (기여매출 − 집행비) / 집행비</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 캠페인</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">캠페인</th>
              <th className="px-3 py-2">채널</th>
              <th className="px-3 py-2 text-right">예산</th>
              <th className="px-3 py-2 text-right">집행</th>
              <th className="px-3 py-2 text-right">기여매출</th>
              <th className="px-3 py-2 text-right">ROI</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {camps.map((c) => {
              const r = roi(c.revenue, c.spent);
              const exec = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
              return (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-mono text-[11px]">{c.code}<div className="text-[12px] font-sans text-ink">{c.name}</div></td>
                  <td className="px-3 py-2">{c.channel}</td>
                  <td className="px-3 py-2 text-right text-sub">{c.budget.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{c.spent.toLocaleString()}<div className="text-[10px] text-sub">집행률 {exec}%</div></td>
                  <td className="px-3 py-2 text-right">{c.revenue.toLocaleString()}</td>
                  <td className={`px-3 py-2 text-right font-bold ${r >= 100 ? "text-emerald-500" : r >= 0 ? "text-amber-500" : "text-red-500"}`}>{r.toFixed(0)}%</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${CP_STATUS_STYLE[c.status] ?? ""}`}>{c.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => toggle(c)} className="px-2 py-0.5 rounded border border-line text-[10px] hover:bg-accent-soft">
                      {c.status === "진행" ? "종료" : "재개"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[440px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">캠페인 등록</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                캠페인명
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
              </label>
              <div className="flex gap-3">
                <label className="text-[11px] text-sub flex-1">
                  채널
                  <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                    {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-sub">
                  예산(원)
                  <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                    className="block w-32 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
