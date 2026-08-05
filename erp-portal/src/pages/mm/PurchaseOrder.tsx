// MM-002 구매발주(PO) — 승인 PR 연계, 공급사 배정, 납기 관리
import { useState } from "react";
import { materialStore, partnerStore } from "../../data/mock/master";
import { prStore, poStore } from "../../data/mock/procurement";
import { useStore, nextId, downloadCsv } from "../../services/store";

const TODAY = "2026-07-03";

const STATUS_STYLE: Record<string, string> = {
  발주: "bg-blue-100 text-blue-700",
  입고완료: "bg-emerald-100 text-emerald-700",
  취소: "bg-red-100 text-red-700",
};

export default function PurchaseOrder() {
  const pos = useStore(poStore);
  const prs = useStore(prStore);
  const vendors = useStore(partnerStore).filter((p) => p.type === "공급사");
  const mats = useStore(materialStore);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ pr: "", vendor: "", material: "", qty: 1000, price: 0, dueDate: "2026-07-31" });

  // PO 미생성 승인 PR
  const openPrs = prs.filter((p) => p.status === "승인" && !pos.some((o) => o.pr === p.code));

  const pickPr = (code: string) => {
    const pr = prs.find((p) => p.code === code);
    if (!pr) return setForm({ ...form, pr: "" });
    const mat = mats.find((m) => m.code === pr.material);
    setForm({ ...form, pr: code, material: pr.material, qty: pr.qty, price: mat?.price ?? 0, dueDate: pr.dueDate });
  };

  const save = () => {
    if (!form.vendor) return alert("공급사를 배정하세요.");
    if (!form.material) return alert("품목을 선택하세요.");
    const code = nextId("PO");
    poStore.create({
      id: code, code, pr: form.pr || "-", vendor: form.vendor, material: form.material,
      qty: form.qty, price: form.price, orderDate: TODAY, dueDate: form.dueDate, status: "발주",
    });
    setCreating(false);
    setForm({ pr: "", vendor: "", material: "", qty: 1000, price: 0, dueDate: "2026-07-31" });
  };

  const isLate = (o: any) => o.status === "발주" && o.dueDate < TODAY;

  const excel = () =>
    downloadCsv("구매발주.csv", ["PO번호", "PR참조", "공급사", "품목", "수량", "단가", "발주일", "납기일", "상태"],
      pos.map((o) => [o.code, o.pr, o.vendor, o.material, o.qty, o.price, o.orderDate, o.dueDate, o.status]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">03. 구매관리 (Procurement)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">구매발주 PO (MM-002)</h1>
          <span className="text-[11px] text-sub">승인 PR 연계 · 공급사 배정 · 납기 관리</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3">
        <span className="text-[11px] text-sub">{pos.length}건</span>
        {openPrs.length > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">
            발주 대기 PR {openPrs.length}건
          </span>
        )}
        {pos.some(isLate) && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
            납기 지연 {pos.filter(isLate).length}건
          </span>
        )}
        <div className="ml-auto flex gap-1">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 발주 생성</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">PO번호</th>
              <th className="px-3 py-2">PR참조</th>
              <th className="px-3 py-2">공급사</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2 text-right">금액(원)</th>
              <th className="px-3 py-2">납기일</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {pos.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{o.code}</td>
                <td className="px-3 py-2 font-mono text-sub">{o.pr}</td>
                <td className="px-3 py-2">{vendors.find((v) => v.code === o.vendor)?.name ?? o.vendor}</td>
                <td className="px-3 py-2">{o.material}</td>
                <td className="px-3 py-2 text-right">{o.qty.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{(o.qty * o.price).toLocaleString()}</td>
                <td className={`px-3 py-2 ${isLate(o) ? "text-red-500 font-bold" : "text-sub"}`}>
                  {o.dueDate}{isLate(o) && " ⚠️지연"}
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[o.status] ?? ""}`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[460px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">발주 생성</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                승인 PR 참조 (선택)
                <select value={form.pr} onChange={(e) => pickPr(e.target.value)}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">직접 발주</option>
                  {openPrs.map((p) => (
                    <option key={p.code} value={p.code}>{p.code} — {p.material} {p.qty.toLocaleString()}개 ({p.dept})</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] text-sub block">
                공급사 배정 *
                <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {vendors.map((v) => <option key={v.code} value={v.code}>{v.code} — {v.name}</option>)}
                </select>
              </label>
              <label className="text-[11px] text-sub block">
                품목
                <select value={form.material} disabled={!!form.pr}
                  onChange={(e) => {
                    const m = mats.find((x) => x.code === e.target.value);
                    setForm({ ...form, material: e.target.value, price: m?.price ?? 0 });
                  }}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink disabled:opacity-60">
                  <option value="">선택</option>
                  {mats.filter((m) => m.type === "원자재" || m.type === "부자재").map((m) => (
                    <option key={m.code} value={m.code}>{m.code} — {m.name}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="text-[11px] text-sub">
                  수량
                  <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                    className="block w-24 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
                <label className="text-[11px] text-sub">
                  단가(원)
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="block w-28 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
                <label className="text-[11px] text-sub">
                  납기일
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="block mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
              </div>
              <div className="text-right font-bold text-[12px]">발주금액 {(form.qty * form.price).toLocaleString()}원</div>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 발주</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
