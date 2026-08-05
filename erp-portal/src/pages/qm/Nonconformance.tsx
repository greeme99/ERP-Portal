// QM-008 부적합관리 / 8D — D1~D8 단계 진행, CAPA 연계
import { useState } from "react";
import { materialStore } from "../../data/mock/master";
import { ncStore, capaStore, D_STEPS, NC_STATUS_STYLE, SEVERITY_STYLE } from "../../data/mock/quality2";
import { useStore, nextId, downloadCsv } from "../../services/store";

const TODAY = "2026-07-03";

export default function Nonconformance() {
  const ncs = useStore(ncStore);
  const capas = useStore(capaStore);
  const mats = useStore(materialStore);
  const [sel, setSel] = useState<string | null>(ncs[0]?.id ?? null);

  const nc = ncs.find((n) => n.id === sel);
  const linkedCapa = capas.filter((c) => c.nc === nc?.code);

  const advance = () => {
    if (!nc) return;
    if (nc.dStep >= 8) return;
    ncStore.update(nc.id, { dStep: nc.dStep + 1, status: nc.dStep + 1 === 8 ? "종결" : "진행" });
  };

  const issueCapa = () => {
    if (!nc) return;
    const code = nextId("CAPA");
    capaStore.create({
      id: code, code, nc: nc.code, type: "시정조치", owner: "품질팀",
      action: "(작성 필요) 근본원인 기반 시정조치", dueDate: "2026-07-31", status: "진행", effectiveness: "-",
    });
    ncStore.update(nc.id, { capa: code });
    alert(`${code} 발행 — CAPA 화면에서 조치 내용 작성`);
  };

  const excel = () =>
    downloadCsv("부적합.csv", ["NC번호", "발생원", "품목", "불량유형", "심각도", "8D단계", "상태", "일자"],
      ncs.map((n) => [n.code, n.source, n.material, n.defectType, n.severity, D_STEPS[n.dStep - 1], n.status, n.date]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. 품질관리 (Quality)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">부적합관리 / 8D Report (QM-008)</h1>
          <span className="text-[11px] text-sub">D1~D8 단계 진행 · CAPA 연계</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3 text-[12px]">
        <span>부적합 <b>{ncs.length}</b>건</span>
        <span className="text-amber-600">진행 {ncs.filter((n) => n.status === "진행").length}</span>
        <span className="text-emerald-600">종결 {ncs.filter((n) => n.status === "종결").length}</span>
        <button onClick={excel} className="ml-auto px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* 목록 */}
        <div className="bg-panel border border-line rounded-lg overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-sub text-left">
                <th className="px-3 py-2">NC번호</th>
                <th className="px-3 py-2">발생원</th>
                <th className="px-3 py-2">품목</th>
                <th className="px-3 py-2">심각도</th>
                <th className="px-3 py-2">8D</th>
                <th className="px-3 py-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {ncs.map((n) => (
                <tr key={n.id} onClick={() => setSel(n.id)}
                  className={`border-b border-line last:border-0 cursor-pointer hover:bg-accent-soft ${sel === n.id ? "bg-accent-soft" : ""}`}>
                  <td className="px-3 py-2 font-mono">{n.code}</td>
                  <td className="px-3 py-2 text-sub">{n.source}</td>
                  <td className="px-3 py-2">{n.material}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SEVERITY_STYLE[n.severity] ?? ""}`}>{n.severity}</span>
                  </td>
                  <td className="px-3 py-2 font-semibold">D{n.dStep}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${NC_STATUS_STYLE[n.status] ?? ""}`}>{n.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 8D 상세 */}
        <div className="bg-panel border border-line rounded-lg">
          {nc ? (
            <>
              <div className="px-4 py-2.5 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{nc.code}</span>
                  <span className="text-[11px] text-sub">{nc.source} | {nc.material} {nc.vendor !== "-" && `| ${nc.vendor}`}</span>
                </div>
                <div className="text-[11px] text-sub mt-1">{nc.desc}</div>
              </div>

              {/* 8D 진행 스텝 */}
              <div className="p-4">
                <div className="flex flex-wrap gap-1 mb-3">
                  {D_STEPS.map((s, i) => (
                    <span key={s}
                      className={`px-2 py-1 rounded text-[10px] font-semibold ${i < nc.dStep ? "bg-emerald-500 text-white" : i === nc.dStep ? "bg-amber-400 text-white" : "bg-surface text-sub"}`}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="text-[12px] mb-3">
                  현재 단계: <b>{D_STEPS[nc.dStep - 1]}</b> ({nc.dStep}/8)
                </div>
                <div className="flex gap-2">
                  {nc.status !== "종결" && (
                    <button onClick={advance} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">
                      {nc.dStep >= 7 ? "✓ D8 종결" : "▶ 다음 단계"}
                    </button>
                  )}
                  {!nc.capa && (
                    <button onClick={issueCapa} className="px-3 py-1.5 rounded bg-blue-600 text-white text-[12px] font-semibold">📋 CAPA 발행</button>
                  )}
                </div>

                {linkedCapa.length > 0 && (
                  <div className="mt-3 border-t border-line pt-3">
                    <div className="text-[11px] text-sub mb-1">연계 CAPA</div>
                    {linkedCapa.map((c) => (
                      <div key={c.id} className="text-[12px] flex items-center gap-2">
                        <span className="font-mono">{c.code}</span>
                        <span>{c.type}</span>
                        <span className="text-sub ml-auto">{c.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-sub text-[12px]">부적합 건을 선택하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}
