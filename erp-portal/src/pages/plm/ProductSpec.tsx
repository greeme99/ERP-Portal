// PLM-002 제품사양 (Product Specification) — 가전 제품 모델별 기술 스펙(전압·소비전력·치수·소음dB) 승인 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ProductSpecItem {
  id: string;
  productCode: string;
  productName: string;
  voltageSpec: string; // 정격 전압 (예: AC 220V / 60Hz)
  powerConsumptionWatts: number; // 소비 전력 (W)
  dimensionsMm: string; // 제품 치수 (W x D x H mm)
  weightKg: number; // 중량 (kg)
  noiseLevelDb: number; // 소음 수준 (dB)
  certStatus: "KC인증완료" | "인증진행중";
  status: "승인완료" | "검토중";
}

export const productSpecStore = createStore("plm.product_spec", [
  { id: "SPEC-01", productCode: "FG-1001", productName: "소형가전 무선청소기", voltageSpec: "DC 25.2V (Li-Ion 2,500mAh)", powerConsumptionWatts: 450, dimensionsMm: "250 x 220 x 1150", weightKg: 2.3, noiseLevelDb: 68, certStatus: "KC인증완료", status: "승인완료" },
  { id: "SPEC-02", productCode: "FG-1002", productName: "스마트 무선 로봇청소기", voltageSpec: "DC 14.4V (Li-Ion 5,200mAh)", powerConsumptionWatts: 65, dimensionsMm: "350 x 350 x 98", weightKg: 3.6, noiseLevelDb: 62, certStatus: "KC인증완료", status: "승인완료" },
  { id: "SPEC-03", productCode: "FG-2001", productName: "전자기판 컨트롤러 모듈", voltageSpec: "DC 5V / 12V 겸용", powerConsumptionWatts: 15, dimensionsMm: "120 x 85 x 18", weightKg: 0.15, noiseLevelDb: 0, certStatus: "KC인증완료", status: "승인완료" },
]);

export default function ProductSpec() {
  const specs = useStore(productSpecStore) as ProductSpecItem[];
  const [certFilter, setCertFilter] = useState("전체");

  const filtered = specs.filter((s) => certFilter === "전체" || s.certStatus === certFilter);

  const excel = () =>
    downloadCsv(
      "연구개발_제품기술사양_대장.csv",
      ["제품코드", "제품명", "정격전압", "소비전력(W)", "외형치수(mm)", "중량(kg)", "소음(dB)", "인증상태", "상태"],
      filtered.map((s) => [
        s.productCode,
        s.productName,
        s.voltageSpec,
        s.powerConsumptionWatts,
        s.dimensionsMm,
        s.weightKg,
        s.noiseLevelDb,
        s.certStatus,
        s.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. Engineering Management (연구개발)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">제품사양 (PLM-002)</h1>
          <span className="text-[11px] text-sub">소형 가전 모델별 전기/기구/환경 정격 기술 스펙(Specification) 중앙 확정</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 승인 등록 제품 스펙</div>
          <div className="text-xl font-bold mt-1 font-mono">{specs.length} <span className="text-xs font-normal">종</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">KC/안전 인증 완료 제품</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{specs.filter((s) => s.certStatus === "KC인증완료").length} <span className="text-xs font-normal text-ink">종</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 제품 소음 레벨</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(specs.filter((s) => s.noiseLevelDb > 0).reduce((acc, s) => acc + s.noiseLevelDb, 0) / (specs.filter((s) => s.noiseLevelDb > 0).length || 1)).toFixed(0)} <span className="text-xs font-normal text-ink">dB</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">인증상태:</span>
          {["전체", "KC인증완료", "인증진행중"].map((st) => (
            <button
              key={st}
              onClick={() => setCertFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                certFilter === st
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 제품사양 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">제품 코드 / 명</th>
              <th className="px-3 py-2">정격 전압 스펙</th>
              <th className="px-3 py-2 text-right">소비 전력</th>
              <th className="px-3 py-2">외형 치수 (mm)</th>
              <th className="px-3 py-2 text-right">중량</th>
              <th className="px-3 py-2 text-right">소음 레벨</th>
              <th className="px-3 py-2">KC 인증 상태</th>
              <th className="px-3 py-2">스펙 승인</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{s.productCode} — {s.productName}</td>
                <td className="px-3 py-2 font-mono text-sub">{s.voltageSpec}</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{s.powerConsumptionWatts}W</td>
                <td className="px-3 py-2 font-mono text-sub">{s.dimensionsMm}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{s.weightKg}kg</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{s.noiseLevelDb > 0 ? `${s.noiseLevelDb}dB` : "-"}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {s.certStatus}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
