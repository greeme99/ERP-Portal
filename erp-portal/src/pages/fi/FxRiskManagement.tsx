// FI-010 외환관리 (FX & Foreign Exchange Risk Management) — 외화 채권/채무 통화별 평가·기말 외화환산손익 및 선물환 헤징 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface FxRiskItem {
  id: string;
  currency: "USD" | "EUR" | "JPY";
  arForeignAmount: number; // 외화 매출채권 금액 (외화)
  apForeignAmount: number; // 외화 매입채무 금액 (외화)
  bookExchangeRate: number; // 장부 환율
  currentExchangeRate: number; // 현재 기말 환율
  unrealizedFxGainLoss: number; // 외화환산 평가손익 (KRW)
  hedgingRatePct: number; // 선물환 헤징 비율 (%)
  status: "이익 발생" | "손실 발생" | "헤징 완충";
}

export const fxRiskStore = createStore("fi.fx_risk", [
  { id: "FX-01", currency: "USD", arForeignAmount: 2500000, apForeignAmount: 800000, bookExchangeRate: 1320.5, currentExchangeRate: 1350.0, unrealizedFxGainLoss: 50150000, hedgingRatePct: 75.0, status: "이익 발생" },
  { id: "FX-02", currency: "EUR", arForeignAmount: 400000, apForeignAmount: 650000, bookExchangeRate: 1450.0, currentExchangeRate: 1420.0, unrealizedFxGainLoss: 7500000, hedgingRatePct: 60.0, status: "손실 발생" },
  { id: "FX-03", currency: "JPY", arForeignAmount: 35000000, apForeignAmount: 20000000, bookExchangeRate: 9.10, currentExchangeRate: 9.25, unrealizedFxGainLoss: 2250000, hedgingRatePct: 80.0, status: "이익 발생" },
]);

export default function FxRiskManagement() {
  const items = useStore(fxRiskStore) as FxRiskItem[];
  const [currFilter, setCurrFilter] = useState("전체");

  const filtered = items.filter((i) => currFilter === "전체" || i.currency === currFilter);

  const totalFxGainLoss = filtered.reduce((acc, i) => acc + i.unrealizedFxGainLoss, 0);

  const excel = () =>
    downloadCsv(
      "재무_외환_환리스크_평가대장.csv",
      ["통화", "외화매출채권", "외화매입채무", "장부환율", "현재환율", "외화환산손익(원)", "선물환헤징비율(%)", "상태"],
      filtered.map((i) => [
        i.currency,
        i.arForeignAmount,
        i.apForeignAmount,
        i.bookExchangeRate,
        i.currentExchangeRate,
        i.unrealizedFxGainLoss,
        `${i.hedgingRatePct}%`,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. Financial Accounting (재무회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">외환관리 (FI-010)</h1>
          <span className="text-[11px] text-sub">외화 채권/채무 통화별 장부 vs 평가 환율 손익(FX Gain/Loss) 및 선물환 헤징 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 기말 외화환산 평가손익</div>
          <div className={`text-xl font-bold mt-1 font-mono ${totalFxGainLoss >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {totalFxGainLoss >= 0 ? `+${(totalFxGainLoss / 10000).toLocaleString()}` : (totalFxGainLoss / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">평균 외화 선물환 헤징 비율</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {(items.reduce((acc, i) => acc + i.hedgingRatePct, 0) / (items.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">관리 대상 거래 통화</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">종 (USD, EUR, JPY)</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">통화:</span>
          {["전체", "USD", "EUR", "JPY"].map((c) => (
            <button
              key={c}
              onClick={() => setCurrFilter(c)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                currFilter === c
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 외환평가 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">거래 통화</th>
              <th className="px-3 py-2 text-right">외화 매출채권 (AR)</th>
              <th className="px-3 py-2 text-right">외화 매입채무 (AP)</th>
              <th className="px-3 py-2 text-right">장부 환율</th>
              <th className="px-3 py-2 text-right">현재 기말 환율</th>
              <th className="px-3 py-2 text-right">외화환산 평가손익</th>
              <th className="px-3 py-2 text-right">선물환 헤징율</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-bold font-mono text-blue-600">{i.currency}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.arForeignAmount.toLocaleString()} {i.currency}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.apForeignAmount.toLocaleString()} {i.currency}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.bookExchangeRate.toFixed(2)}원</td>
                <td className="px-3 py-2 text-right font-mono font-medium">{i.currentExchangeRate.toFixed(2)}원</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.unrealizedFxGainLoss >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {i.unrealizedFxGainLoss >= 0 ? `+${(i.unrealizedFxGainLoss / 10000).toLocaleString()}` : (i.unrealizedFxGainLoss / 10000).toLocaleString()}만원
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.hedgingRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.status.includes("이익") ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {i.status}
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
