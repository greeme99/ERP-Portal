// PLM-004 도면관리 — 도면 등록·승인·개정(Rev↑)·폐기, ECO 연계
import { useState } from "react";
import { materialStore } from "../../data/mock/master";
import { drawingStore, nextRev, DWG_STATUS_STYLE } from "../../data/mock/pdm";
import { useStore, nextId, downloadCsv } from "../../services/store";

const TODAY = "2026-07-03";

export default function DrawingManagement() {
  const drawings = useStore(drawingStore);
  const mats = useStore(materialStore);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ material: "", name: "" });

  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;

  const approve = (d: any) => drawingStore.update(d.id, { status: "승인", date: TODAY });
  const revise = (d: any) => {
    if (!confirm(`${d.code} 도면을 Rev ${d.rev} → ${nextRev(d.rev)}로 개정할까요?`)) return;
    drawingStore.update(d.id, { rev: nextRev(d.rev), status: "작성", date: TODAY });
  };
  const discard = (d: any) => {
    if (!confirm(`${d.code} 도면을 폐기할까요?`)) return;
    drawingStore.update(d.id, { status: "폐기", date: TODAY });
  };

  const save = () => {
    if (!form.material) return alert("품목을 선택하세요.");
    if (!form.name.trim()) return alert("도면명을 입력하세요.");
    const code = nextId("DWG");
    drawingStore.create({ id: code, code, material: form.material, name: form.name, rev: "A", status: "작성", eco: "-", date: TODAY });
    setCreating(false);
    setForm({ material: "", name: "" });
  };

  const excel = () =>
    downloadCsv("도면목록.csv", ["도번", "품목", "도면명", "Rev", "상태", "연계ECO", "일자"],
      drawings.map((d) => [d.code, d.material, d.name, d.rev, d.status, d.eco, d.date]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. 연구개발 (Engineering / PLM)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">도면관리 (PLM-004)</h1>
          <span className="text-[11px] text-sub">개정 이력(Rev) · ECO 연계 · 폐기 관리</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3 text-[12px]">
        <span>도면 <b>{drawings.length}</b>건</span>
        <span className="text-amber-600">작성 {drawings.filter((d) => d.status === "작성").length}</span>
        <span className="text-emerald-600">승인 {drawings.filter((d) => d.status === "승인").length}</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 도면 등록</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">도번</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2">도면명</th>
              <th className="px-3 py-2 text-center">Rev</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">연계 ECO</th>
              <th className="px-3 py-2">최종일</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody>
            {drawings.map((d) => (
              <tr key={d.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{d.code}</td>
                <td className="px-3 py-2">{d.material} — {matName(d.material)}</td>
                <td className="px-3 py-2">{d.name}</td>
                <td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 rounded bg-accent-soft text-accent text-[11px] font-bold">{d.rev}</span></td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${DWG_STATUS_STYLE[d.status] ?? ""}`}>{d.status}</span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{d.eco}</td>
                <td className="px-3 py-2 text-sub">{d.date}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {d.status === "작성" && (
                      <button onClick={() => approve(d)} className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">승인</button>
                    )}
                    {d.status === "승인" && (
                      <button onClick={() => revise(d)} className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-semibold">개정</button>
                    )}
                    {d.status !== "폐기" && (
                      <button onClick={() => discard(d)} className="px-2 py-0.5 rounded border border-line text-[10px] text-red-500 hover:bg-accent-soft">폐기</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[440px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">도면 등록</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                품목
                <select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {mats.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
                </select>
              </label>
              <label className="text-[11px] text-sub block">
                도면명
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 외형도 / 조립도 / 금형도"
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
              </label>
              <div className="text-[11px] text-sub bg-accent-soft rounded p-2">신규 도면은 Rev A · 작성 상태로 등록됩니다.</div>
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
