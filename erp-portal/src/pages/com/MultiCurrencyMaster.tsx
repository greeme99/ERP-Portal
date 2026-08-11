// COM-020 다국어및통화마스터 (Multi-Currency & Exchange Rate Master) — 전사 해외 영업·구매 실시간 환율 마스터
import { useState } from "react";
import { useStore, createStore, nextId } from "../../services/store";
import MassUpdateBar, { MassColumn } from "../../components/common/MassUpdateBar";

export interface CurrencyMasterItem {
  id: string;
  currencyCode: string; // 통화 코드 (예: USD, EUR, JPY, CNY)
  currencyName: string; // 통화 명칭 (미국 달러, 유로화, 일본 엔화)
  baseExchangeRate: number; // 매매기준율 (KRW)
  rateChangePct: number; // 전일 대비 변동률 (%)
  exchangeProviderName: string; // 환율 수집처 (서울외국환중개)
  lastSyncTimestamp: string;
  status: "정상 동기화 (Active)";
}

export const currencyMasterStore = createStore("com.currency_master", [
  { id: "CUR-01", currencyCode: "USD", currencyName: "미국 달러 (US Dollar)", baseExchangeRate: 1385.50, rateChangePct: 0.35, exchangeProviderName: "서울외국환중개 API", lastSyncTimestamp: "2026-08-06 17:00", status: "정상 동기화 (Active)" },
  { id: "CUR-02", currencyCode: "EUR", currencyName: "유럽 연합 유로 (Euro)", baseExchangeRate: 1498.20, rateChangePct: -0.12, exchangeProviderName: "서울외국환중개 API", lastSyncTimestamp: "2026-08-06 17:00", status: "정상 동기화 (Active)" },
  { id: "CUR-03", currencyCode: "JPY (100)", currencyName: "일본 엔화 (100엔)", baseExchangeRate: 915.40, rateChangePct: 0.08, exchangeProviderName: "서울외국환중개 API", lastSyncTimestamp: "2026-08-06 17:00", status: "정상 동기화 (Active)" },
]);

export default function MultiCurrencyMaster() {
  const items = useStore(currencyMasterStore) as CurrencyMasterItem[];
  const [currFilter, setCurrFilter] = useState("전체");

  const filtered = items.filter((i) => currFilter === "전체" || i.currencyCode.includes(currFilter));

  // 기준정보 일괄 다운로드/업로드 컬럼
  const massColumns: MassColumn[] = [
    { key: "currencyCode", label: "통화코드", required: true },
    { key: "currencyName", label: "통화명", required: true },
    { key: "baseExchangeRate", label: "매매기준율(KRW)", type: "number" },
    { key: "rateChangePct", label: "전일대비변동률(%)", type: "number" },
    { key: "exchangeProviderName", label: "환율수집처" },
    { key: "lastSyncTimestamp", label: "최종동기화" },
  ];

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">다국어및통화마스터 (COM-020)</h1>
          <span className="text-[11px] text-sub">해외 수출입 수주·구매 외화 전표용 실시간 기준 환율(Exchange Rate) 동기화 마스터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">USD 기준 환율 (매매기준율)</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">1,385.50 <span className="text-xs font-normal text-ink">원/USD</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">동기화 관리 외국 통화 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개 통화</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">서울외국환 중개 동기화 상태</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0% (정상)</div>
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
        <div className="flex gap-1">
          <MassUpdateBar
            title="통화환율"
            filename="공통_다중통화_환율마스터.csv"
            store={currencyMasterStore}
            rows={filtered}
            columns={massColumns}
            newRow={() => ({ id: nextId("CUR"), currencyCode: "", currencyName: "", baseExchangeRate: 0, rateChangePct: 0, exchangeProviderName: "", lastSyncTimestamp: "", status: "정상 동기화 (Active)" })}
          />
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">통화 코드</th>
              <th className="px-3 py-2">외국 통화명</th>
              <th className="px-3 py-2 text-right">매매기준율 (KRW)</th>
              <th className="px-3 py-2 text-right">전일 대비 변동률</th>
              <th className="px-3 py-2">환율 데이터 수집처</th>
              <th className="px-3 py-2">최근 동기화 일시</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.currencyCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.currencyName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.baseExchangeRate.toFixed(2)}원</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${i.rateChangePct >= 0 ? "text-red-500" : "text-blue-600"}`}>
                  {i.rateChangePct >= 0 ? `+${i.rateChangePct.toFixed(2)}%` : `${i.rateChangePct.toFixed(2)}%`}
                </td>
                <td className="px-3 py-2 text-sub font-medium">{i.exchangeProviderName}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.lastSyncTimestamp}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
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
