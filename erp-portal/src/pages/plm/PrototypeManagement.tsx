// PLM-009 시제품관리 — 시제품 제작 등록·판정(합격/불합격)
import { useState } from "react";
import { materialStore } from "../../data/mock/master";
import { prototypeStore, PT_STATUS_STYLE } from "../../data/mock/pdm";
import { useStore, nextId, downloadCsv } from "../../services/store";

const TODAY = "2026-07-03";

export default function PrototypeManagement() {
  const protos = useStore(prototypeStore);
  const mats = useStore(materialStore);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ material: "", purpose: "", qty: 3 });

  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;
  const producible = mats.filter((m) => m.type === "완제품" || m.type === "반제품");

  const judge = (p: any, result: string) => {
    const note = prompt(`${p.code} 판정 사유/비고:`, p.note || "");
    if (note === null) return;
    prototypeStore.update(p.id, { result, note });
  };

  const save = () => {
    if (!form.material) return alert("품목을 선택하세요.");
    if (!form.purpose.trim()) return alert("제작 목적을 입력하세요.");
    const code = nextId("PT");
    prototypeStore.create({ id: code, code, material: form.material, purpose: form.purpose, qty: form.qty, buildDate: TODAY, result: "진행", note: "" });
    setCreating(false);
    setForm({ material: "", purpose: "", qty: 3 });
  };

  const excel = () =>
    downloadCsv("시제품.csv", ["시제품번호", "품목", "제작목적", "수량", "제작일", "판정", "비고"],
      protos.map((p) => [p.code, p.material, p.purpose, p.qty, p.buildDate, p.result, p.note]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. 연구개발 (Engineering / PLM)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">시제품관리 (PLM-009)</h1>
          <span className="text-[11px] text-sub">시제품 제작 · 검증 판정</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3 text-[12px]">
        <span>시제품 <b>{protos.length}</b>건</span>
        <span className="text-amber-600">진행 {protos.filter((p) => p.result === "진행").length}</span>
        <span className="text-emerald-600">합격 {protos.filter((p) => p.result === "합격").length}</span>
        <span className="text-red-500">불합격 {protos.filter((p) => p.result === "불합격").length}</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 시제품 등록</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">시제품번호</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2">제작목적</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2">제작일</th>
              <th className="px-3 py-2">판정</th>
              <th className="px-3 py-2">비고</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody>
            {protos.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{p.code}</td>
                <td className="px-3 py-2">{p.material} — {matName(p.material)}</td>
                <td className="px-3 py-2">{p.purpose}</td>
                <td className="px-3 py-2 text-right">{p.qty}</td>
                <td className="px-3 py-2 text-sub">{p.buildDate}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PT_STATUS_STYLE[p.result] ?? ""}`}>{p.result}</span>
                </td>
                <td className="px-3 py-2 max-w-[200px] text-sub">{p.note}</td>
                <td className="px-3 py-2">
                  {p.result === "진행" && (
                    <div className="flex gap-1">
                      <button onClick={() => judge(p, "합격")} className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">합격</button>
                      <button onClick={() => judge(p, "불합격")} className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-semibold">불합격</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[440px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">시제품 등록</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                품목
                <select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {producible.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="text-[11px] text-sub flex-1">
                  제작 목적
                  <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
                <label className="text-[11px] text-sub">
                  수량
                  <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                    className="block w-20 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
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
