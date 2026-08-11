// FI-012 주주명부및배당관리 (Shareholder & Dividend Management) — 전사 주주 지분율 및 결산 배당금 지급 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ShareholderItem {
  id: string;
  shareholderCode: string;
  shareholderName: string; // 주주 성명/법인명 (예: 김최대 대표이사, 한국투자자산운용, 자사주)
  shareholderCategory: "최대주주 및 특수관계인" | "기관 투자자" | "소액 일반주주" | "자기주식 (자사주)";
  sharesCount: number; // 보유 주식 수 (주)
  ownershipRatioPct: number; // 지분율 (%)
  dividendPerShare: number; // 주당 배당금 (원/주)
  totalDividendAmount: number; // 총 지급 배당금 = SharesCount * DividendPerShare (KRW)
  status: "배당 확정" | "지급 완료";
}

export const shareholderStore = createStore("fi.shareholder", [
  { id: "SHR-01", shareholderCode: "SHR-001", shareholderName: "김대표 회장 및 특수관계인", shareholderCategory: "최대주주 및 특수관계인", sharesCount: 3500000, ownershipRatioPct: 35.0, dividendPerShare: 500, totalDividendAmount: 1750000000, status: "배당 확정" },
  { id: "SHR-02", shareholderCode: "SHR-002", shareholderName: "KB자산운용 밸류펀드", shareholderCategory: "기관 투자자", sharesCount: 1500000, ownershipRatioPct: 15.0, dividendPerShare: 500, totalDividendAmount: 750000000, status: "배당 확정" },
  { id: "SHR-03", shareholderCode: "SHR-003", shareholderName: "소액 일반주주 (4,250명)", shareholderCategory: "소액 일반주주", sharesCount: 4500000, ownershipRatioPct: 45.0, dividendPerShare: 500, totalDividendAmount: 2250000000, status: "배당 확정" },
  { id: "SHR-04", shareholderCode: "SHR-004", shareholderName: "회사 자기주식 (자사주)", shareholderCategory: "자기주식 (자사주)", sharesCount: 500000, ownershipRatioPct: 5.0, dividendPerShare: 0, totalDividendAmount: 0, status: "배당 확정" },
]);

export default function ShareholderManagement() {
  const items = useStore(shareholderStore) as ShareholderItem[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = items.filter((i) => catFilter === "전체" || i.shareholderCategory.includes(catFilter));

  const totalDividend = filtered.reduce((acc, i) => acc + i.totalDividendAmount, 0);

  const excel = () =>
    downloadCsv(
      "재무_주주명부_배당금_지급_대장.csv",
      ["주주코드", "주주명/법인명", "주주구분", "보유주식수(주)", "지분율(%)", "주당배당금(원)", "총배당금(원)", "상태"],
      filtered.map((i) => [
        i.shareholderCode,
        i.shareholderName,
        i.shareholderCategory,
        i.sharesCount,
        `${i.ownershipRatioPct.toFixed(1)}%`,
        i.dividendPerShare,
        i.totalDividendAmount,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. Financial Accounting (재무회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">주주명부및배당관리 (FI-012)</h1>
          <span className="text-[11px] text-sub">전사 주주명부 지분율 구조 · 연말 결산 주당 배당금 확정 및 집행 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 결산 확정 배당금</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalDividend / 100000000).toFixed(1)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">발행 총 주식 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {items.reduce((acc, i) => acc + i.sharesCount, 0).toLocaleString()} <span className="text-xs font-normal text-ink">주</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">결산 기준 주당 배당금</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">500 <span className="text-xs font-normal text-ink">원/주</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">구분:</span>
          {["전체", "최대주주", "기관", "소액"].map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                catFilter === c
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 주주명부 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">주주 코드</th>
              <th className="px-3 py-2">주주명 / 법인명</th>
              <th className="px-3 py-2">주주 분류</th>
              <th className="px-3 py-2 text-right">보유 주식 수</th>
              <th className="px-3 py-2 text-right">지분율 (%)</th>
              <th className="px-3 py-2 text-right">주당 배당금</th>
              <th className="px-3 py-2 text-right">총 배당금액</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.shareholderCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.shareholderName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.shareholderCategory}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.sharesCount.toLocaleString()}주</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.ownershipRatioPct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.dividendPerShare.toLocaleString()}원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
                  {i.totalDividendAmount > 0 ? `${(i.totalDividendAmount / 100000000).toFixed(2)}억원` : "0원"}
                </td>
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
