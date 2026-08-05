// PP-003 작업지시·실적 — 시작/실적등록, 완료 시 백플러시 + FG 입고
import { useState } from "react";
import { materialStore, bomStore } from "../../data/mock/master";
import { woStore, WO_STYLE } from "../../data/mock/production";
import { lotStore, txStore, newLotCode } from "../../data/mock/logistics";
import { useStore, nextId, downloadCsv } from "../../services/store";

const TODAY = "2026-07-03";

export default function WorkOrderPage() {
  const wos = useStore(woStore);
  const mats = useStore(materialStore);
  const boms = useStore(bomStore);
  const [creating, setCreating] = useState(false);
  const [reporting, setReporting] = useState<any>(null);
  const [form, setForm] = useState({ material: "", qty: 1000, dueDate: "2026-07-31" });
  const [report, setReport] = useState({ good: 0, defect: 0 });

  const producible = mats.filter((m) => m.type === "완제품" || m.type === "반제품");

  const create = () => {
    if (!form.material) return alert("생산 품목을 선택하세요.");
    const code = nextId("WO");
    woStore.create({
      id: code, code, material: form.material, qty: form.qty,
      startDate: TODAY, dueDate: form.dueDate, status: "계획", good: 0, defect: 0,
    });
    setCreating(false);
  };

  const start = (wo: any) => woStore.update(wo.id, { status: "진행" });

  const complete = () => {
    if (!reporting) return;
    const { good, defect } = report;
    if (good + defect <= 0) return alert("양품/불량 수량을 입력하세요.");
    // 1) 직하위 자재 백플러시 (재고 차감)
    const children = boms.filter((b) => b.parent === reporting.material);
    for (const c of children) {
      const m = mats.find((x) => x.code === c.child);
      if (m) {
        const consume = Math.ceil(c.qty * (good + defect));
        if (m.stock < consume && !confirm(`⚠️ ${c.child} 재고 부족 (${m.stock} < ${consume}). 음수 재고로 진행할까요?`)) return;
        materialStore.update(m.id, { stock: m.stock - consume });
      }
    }
    // 2) 생산품 입고 + LOT 생성
    const prod = mats.find((x) => x.code === reporting.material);
    if (prod) materialStore.update(prod.id, { stock: prod.stock + good });
    const wh = reporting.material.startsWith("FG-") ? "WH-101" : "WH-103";
    const lot = newLotCode();
    lotStore.create({ id: lot, code: lot, material: reporting.material, qty: good, wh, vendor: "-", date: TODAY, status: "가용" });
    txStore.create({ id: nextId("TX"), type: "입고", material: reporting.material, qty: good, from: "생산라인", to: wh, lot, date: TODAY, ref: reporting.code });
    // 3) WO 완료
    woStore.update(reporting.id, { status: "완료", good, defect });
    setReporting(null);
  };

  const excel = () =>
    downloadCsv("작업지시.csv", ["WO번호", "품목", "지시수량", "양품", "불량", "시작일", "납기일", "상태"],
      wos.map((w) => [w.code, w.material, w.qty, w.good, w.defect, w.startDate, w.dueDate, w.status]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. 생산관리 (Production)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">작업지시·실적 (PP-003)</h1>
          <span className="text-[11px] text-sub">완료 시 자재 백플러시 + 생산품 LOT 입고</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-2">
        <span className="text-[11px] text-sub">{wos.length}건</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 작업지시</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">WO번호</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">지시수량</th>
              <th className="px-3 py-2 text-right">양품</th>
              <th className="px-3 py-2 text-right">불량</th>
              <th className="px-3 py-2 text-right">수율</th>
              <th className="px-3 py-2">납기일</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody>
            {wos.map((w) => {
              const done = w.good + w.defect;
              const yieldPct = done > 0 ? ((w.good / done) * 100).toFixed(1) : "-";
              return (
                <tr key={w.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-mono">{w.code}</td>
                  <td className="px-3 py-2">{w.material} — {mats.find((m) => m.code === w.material)?.name ?? ""}</td>
                  <td className="px-3 py-2 text-right">{w.qty.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-emerald-600">{w.good.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-red-500">{w.defect.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{yieldPct}{yieldPct !== "-" && "%"}</td>
                  <td className={`px-3 py-2 ${w.status !== "완료" && w.dueDate < TODAY ? "text-red-500 font-bold" : "text-sub"}`}>{w.dueDate}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${WO_STYLE[w.status] ?? ""}`}>{w.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    {w.status === "계획" && (
                      <button onClick={() => start(w)} className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-semibold">▶ 시작</button>
                    )}
                    {w.status === "진행" && (
                      <button onClick={() => { setReporting(w); setReport({ good: w.qty, defect: 0 }); }}
                        className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">✓ 실적등록</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 작업지시 생성 */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[420px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">작업지시 생성</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                생산 품목 (완제품/반제품)
                <select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {producible.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="text-[11px] text-sub">
                  지시수량
                  <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                    className="block w-28 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
                <label className="text-[11px] text-sub">
                  납기일
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="block mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={create} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 지시</button>
            </div>
          </div>
        </div>
      )}

      {/* 실적 등록 */}
      {reporting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setReporting(null)}>
          <div className="bg-panel border border-line rounded-lg w-[420px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">{reporting.code} 실적 등록</div>
            <div className="p-4 space-y-3">
              <div className="text-[12px]">{reporting.material} | 지시수량 {reporting.qty.toLocaleString()}</div>
              <div className="flex gap-3">
                <label className="text-[11px] text-sub">
                  양품
                  <input type="number" value={report.good} onChange={(e) => setReport({ ...report, good: Number(e.target.value) })}
                    className="block w-28 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
                <label className="text-[11px] text-sub">
                  불량
                  <input type="number" value={report.defect} onChange={(e) => setReport({ ...report, defect: Number(e.target.value) })}
                    className="block w-28 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
              </div>
              <div className="text-[11px] text-sub bg-accent-soft rounded p-2">
                완료 시: BOM 직하위 자재 {(report.good + report.defect).toLocaleString()}세트 백플러시 차감 → 양품 {report.good.toLocaleString()}개 LOT 입고
              </div>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setReporting(null)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={complete} className="px-4 py-1.5 rounded bg-emerald-600 text-white text-[12px] font-semibold">✓ 완료 처리</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
