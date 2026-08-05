// QM-011 CAPA — 시정·예방조치 관리, 효과성 검증 후 완료
import { useState } from "react";
import { ncStore, capaStore, CAPA_STATUS_STYLE } from "../../data/mock/quality2";
import { useStore, downloadCsv } from "../../services/store";

const TODAY = "2026-07-03";

export default function CapaPage() {
  const capas = useStore(capaStore);
  const ncs = useStore(ncStore);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ action: "", effectiveness: "" });

  const openEdit = (c: any) => { setEditing(c.id); setDraft({ action: c.action, effectiveness: c.effectiveness === "-" ? "" : c.effectiveness }); };

  const save = () => {
    if (!editing) return;
    capaStore.update(editing, { action: draft.action || "(미작성)", effectiveness: draft.effectiveness || "-" });
    setEditing(null);
  };

  const complete = (c: any) => {
    if (c.effectiveness === "-" || !c.effectiveness) return alert("효과성 검증 내용을 먼저 작성하세요.");
    capaStore.update(c.id, { status: "완료" });
    // 연계 NC 종결 처리
    const nc = ncs.find((n) => n.code === c.nc);
    if (nc && nc.status !== "종결") ncStore.update(nc.id, { dStep: 8, status: "종결" });
    alert(`${c.code} 완료 → 연계 부적합 ${c.nc} 종결 처리`);
  };

  const excel = () =>
    downloadCsv("CAPA.csv", ["CAPA번호", "부적합", "유형", "담당", "조치", "기한", "상태", "효과성"],
      capas.map((c) => [c.code, c.nc, c.type, c.owner, c.action, c.dueDate, c.status, c.effectiveness]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. 품질관리 (Quality)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">CAPA (QM-011)</h1>
          <span className="text-[11px] text-sub">시정·예방조치 · 효과성 검증 후 완료 → NC 종결</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3 text-[12px]">
        <span>CAPA <b>{capas.length}</b>건</span>
        <span className="text-amber-600">진행 {capas.filter((c) => c.status === "진행").length}</span>
        <span className="text-emerald-600">완료 {capas.filter((c) => c.status === "완료").length}</span>
        <button onClick={excel} className="ml-auto px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">CAPA번호</th>
              <th className="px-3 py-2">부적합</th>
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2">담당</th>
              <th className="px-3 py-2">조치 내용</th>
              <th className="px-3 py-2">기한</th>
              <th className="px-3 py-2">효과성</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody>
            {capas.map((c) => {
              const late = c.status === "진행" && c.dueDate < TODAY;
              return (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-accent-soft align-top">
                  <td className="px-3 py-2 font-mono">{c.code}</td>
                  <td className="px-3 py-2 font-mono text-sub">{c.nc}</td>
                  <td className="px-3 py-2">{c.type}</td>
                  <td className="px-3 py-2">{c.owner}</td>
                  <td className="px-3 py-2 max-w-[220px]">{c.action}</td>
                  <td className={`px-3 py-2 ${late ? "text-red-500 font-bold" : "text-sub"}`}>{c.dueDate}{late && " ⚠️"}</td>
                  <td className="px-3 py-2 text-sub">{c.effectiveness}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${CAPA_STATUS_STYLE[late ? "지연" : c.status] ?? ""}`}>
                      {late ? "지연" : c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {c.status === "진행" && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="px-2 py-0.5 rounded border border-line text-[10px] hover:bg-accent-soft">✏️ 작성</button>
                        <button onClick={() => complete(c)} className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">✓ 완료</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-panel border border-line rounded-lg w-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">CAPA 조치 작성</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                시정/예방 조치 내용
                <textarea value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} rows={3}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
              </label>
              <label className="text-[11px] text-sub block">
                효과성 검증 (완료 처리 전 필수)
                <textarea value={draft.effectiveness} onChange={(e) => setDraft({ ...draft, effectiveness: e.target.value })} rows={2}
                  placeholder="예: 후속 3LOT 전수검사 결과 불량 0건, 재발 없음 확인"
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
              </label>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
