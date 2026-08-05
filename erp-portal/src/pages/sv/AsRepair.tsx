// SV-002 AS 접수 / 수리관리 — 보증 자동 체크, 접수→수리중→완료(비용)
import { useState } from "react";
import { materialStore, customerStore } from "../../data/mock/master";
import { warrantyStore, asStore, AS_STATUS_STYLE, WARRANTY_STYLE, TODAY } from "../../data/mock/service";
import { useStore, nextId, downloadCsv } from "../../services/store";

export default function AsRepair() {
  const ass = useStore(asStore);
  const warranties = useStore(warrantyStore);
  const mats = useStore(materialStore);
  const customers = useStore(customerStore);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ customer: "", material: "", symptom: "" });

  const custName = (c: string) => customers.find((x) => x.code === c)?.name ?? c;
  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;
  const fgs = mats.filter((m) => m.type === "완제품");

  // 보증 여부: 해당 고객+품목의 유효 보증 존재 여부
  const checkWarranty = (customer: string, material: string) =>
    warranties.some((w) => w.customer === customer && w.material === material && w.expiry >= TODAY) ? "유효" : "만료";

  const save = () => {
    if (!form.customer || !form.material) return alert("고객과 제품을 선택하세요.");
    if (!form.symptom.trim()) return alert("증상을 입력하세요.");
    const code = nextId("AS");
    asStore.create({
      id: code, code, customer: form.customer, material: form.material, symptom: form.symptom,
      receiveDate: TODAY, status: "접수", warranty: checkWarranty(form.customer, form.material), cost: 0, note: "",
    });
    setCreating(false);
    setForm({ customer: "", material: "", symptom: "" });
  };

  const startRepair = (a: any) => asStore.update(a.id, { status: "수리중" });

  const complete = (a: any) => {
    let cost = 0;
    if (a.warranty === "만료") {
      const input = prompt(`${a.code} 수리 완료 — 유상 수리비(원) 입력:`, "0");
      if (input === null) return;
      cost = Number(input) || 0;
    }
    const note = prompt("수리 내용/비고:", a.note || "");
    if (note === null) return;
    asStore.update(a.id, { status: "완료", cost, note });
  };

  const excel = () =>
    downloadCsv("AS접수.csv", ["AS번호", "고객", "제품", "증상", "접수일", "보증", "상태", "수리비"],
      ass.map((a) => [a.code, custName(a.customer), a.material, a.symptom, a.receiveDate, a.warranty, a.status, a.cost]));

  const openCount = ass.filter((a) => a.status !== "완료").length;
  const totalCost = ass.reduce((s, a) => s + a.cost, 0);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. 서비스 (Service)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">AS 접수 / 수리관리 (SV-002)</h1>
          <span className="text-[11px] text-sub">보증 자동 체크 · 유상/무상 판정</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3 text-[12px]">
        <span>AS <b>{ass.length}</b>건</span>
        <span className="text-blue-600">처리중 {openCount}</span>
        <span className="text-sub">누적 수리비 {totalCost.toLocaleString()}원</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ AS 접수</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">AS번호</th>
              <th className="px-3 py-2">고객</th>
              <th className="px-3 py-2">제품</th>
              <th className="px-3 py-2">증상</th>
              <th className="px-3 py-2">접수일</th>
              <th className="px-3 py-2">보증</th>
              <th className="px-3 py-2 text-right">수리비</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody>
            {ass.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{a.code}</td>
                <td className="px-3 py-2">{custName(a.customer)}</td>
                <td className="px-3 py-2">{a.material} — {matName(a.material)}</td>
                <td className="px-3 py-2 max-w-[180px] text-sub">{a.symptom}</td>
                <td className="px-3 py-2 text-sub">{a.receiveDate}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${WARRANTY_STYLE[a.warranty] ?? ""}`}>
                    {a.warranty === "유효" ? "무상" : "유상"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">{a.cost > 0 ? a.cost.toLocaleString() : "-"}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${AS_STATUS_STYLE[a.status] ?? ""}`}>{a.status}</span>
                </td>
                <td className="px-3 py-2">
                  {a.status === "접수" && (
                    <button onClick={() => startRepair(a)} className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-semibold">▶ 수리시작</button>
                  )}
                  {a.status === "수리중" && (
                    <button onClick={() => complete(a)} className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">✓ 완료</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[460px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">AS 접수</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                고객
                <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {customers.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
              </label>
              <label className="text-[11px] text-sub block">
                제품
                <select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {fgs.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
                </select>
              </label>
              {form.customer && form.material && (
                <div className={`text-[12px] p-2 rounded ${checkWarranty(form.customer, form.material) === "유효" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  보증 상태: {checkWarranty(form.customer, form.material)} → {checkWarranty(form.customer, form.material) === "유효" ? "무상 수리" : "유상 수리"}
                </div>
              )}
              <label className="text-[11px] text-sub block">
                증상
                <input value={form.symptom} onChange={(e) => setForm({ ...form, symptom: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
              </label>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 접수</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
