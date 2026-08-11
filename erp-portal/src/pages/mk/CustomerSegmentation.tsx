// MK-004 고객분석 (Customer Segmentation & LTV Analytics) — RFM 세그먼트·고객생애가치(LTV)·평균주문금액(AOV) 타겟팅 분석
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CustomerSegItem {
  id: string;
  segmentName: "VVIP 로열고객" | "우수 구매고객" | "신규 유입고객" | "이탈 위험고객";
  customerCount: number; // 고객 수
  avgOrderValue: number; // 평균 주문 금액 (AOV KRW)
  customerLtv: number; // 고객 생애 가치 (LTV KRW)
  reorderRatePct: number; // 재구매율 (%)
  targetCampaign: string; // 타겟 마케팅 캠페인
}

export const customerSegStore = createStore("mk.customer_segmentation", [
  { id: "SEG-01", segmentName: "VVIP 로열고객", customerCount: 15400, avgOrderValue: 850000, customerLtv: 2850000, reorderRatePct: 68.5, targetCampaign: "신제품 프리미엄 무선청소기 2세대 우선 체험단 초대" },
  { id: "SEG-02", segmentName: "우수 구매고객", customerCount: 42000, avgOrderValue: 450000, customerLtv: 1200000, reorderRatePct: 42.0, targetCampaign: "소소모품(배터리/필터) 20% 할인 쿠폰 지급" },
  { id: "SEG-03", segmentName: "이탈 위험고객", customerCount: 18500, avgOrderValue: 350000, customerLtv: 750000, reorderRatePct: 15.0, targetCampaign: "무상 AS 점검 쿠폰 및 리턴 윈백(Win-back) 이벤트" },
]);

export default function CustomerSegmentation() {
  const items = useStore(customerSegStore) as CustomerSegItem[];
  const [segFilter, setSegFilter] = useState("전체");

  const filtered = items.filter((i) => segFilter === "전체" || i.segmentName.includes(segFilter));

  const totalCust = filtered.reduce((acc, i) => acc + i.customerCount, 0);

  const excel = () =>
    downloadCsv(
      "마케팅_고객세그먼트_LTV_분석대장.csv",
      ["세그먼트명", "고객수", "평균주문금액(원)", "고객생애가치LTV(원)", "재구매율(%)", "타겟캠페인"],
      filtered.map((i) => [
        i.segmentName,
        i.customerCount,
        i.avgOrderValue,
        i.customerLtv,
        `${i.reorderRatePct}%`,
        i.targetCampaign,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">12. Marketing Management (마케팅)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">고객분석 (MK-004)</h1>
          <span className="text-[11px] text-sub">RFM 기반 고객 세그먼트 · 생애 가치(LTV) 및 평균 주문 금액(AOV) 마케팅 타겟팅</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 세그먼트 타겟 고객 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{totalCust.toLocaleString()} <span className="text-xs font-normal text-ink">명</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">VVIP 로열고객 평균 LTV</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">285 <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">전사 평균 재구매율 (Repeat Rate)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">41.8%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">세그먼트:</span>
          {["전체", "VVIP", "우수", "이탈"].map((s) => (
            <button
              key={s}
              onClick={() => setSegFilter(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                segFilter === s
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 세그먼트분석 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">고객 세그먼트명</th>
              <th className="px-3 py-2 text-right">세그먼트 고객 수</th>
              <th className="px-3 py-2 text-right">평균 주문 금액 (AOV)</th>
              <th className="px-3 py-2 text-right">고객 생애 가치 (LTV)</th>
              <th className="px-3 py-2 text-right">재구매율</th>
              <th className="px-3 py-2">맞춤 타겟 마케팅 캠페인</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-bold text-ink">{i.segmentName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.customerCount.toLocaleString()}명</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{(i.avgOrderValue / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.customerLtv / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.reorderRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-purple-700 text-[11px] font-medium">{i.targetCampaign}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
