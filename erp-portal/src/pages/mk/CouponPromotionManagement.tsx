// MK-012 쿠폰프로모션관리 (Coupon & Promotion Discount Management) — 디지털 쿠폰 발행 및 프로모션 할인율 집계 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CouponItem {
  id: string;
  couponCode: string;
  couponName: string; // 쿠폰 명칭 (예: 신제품 AI-V12 출시 10% 얼리버드 할인, VIP 5만원 감사 쿠폰)
  discountType: "정율 할인 (%)" | "정액 할인 (원)";
  discountValue: number; // 10% 또는 50,000원
  issuedCount: number; // 발행 수량
  usedCount: number; // 사용 수량
  usageRatePct: number; // 쿠폰 사용률 (%)
  revenueContribution: number; // 쿠폰 적용 유도 매출액 (KRW)
  status: "발행 중 (Active)" | "발행 종료";
}

export const couponStore = createStore("mk.coupon", [
  { id: "CPN-01", couponCode: "CPN-2026-V12", couponName: "신제품 AI-V12 출시 10% 얼리버드 쿠폰", discountType: "정율 할인 (%)", discountValue: 10, issuedCount: 5000, usedCount: 1850, usageRatePct: 37.0, revenueContribution: 1480000000, status: "발행 중 (Active)" },
  { id: "CPN-02", couponCode: "CPN-2026-VIP", couponName: "가전 재구매 VIP 고객 5만원 정액 할인", discountType: "정액 할인 (원)", discountValue: 50000, issuedCount: 2000, usedCount: 940, usageRatePct: 47.0, revenueContribution: 650000000, status: "발행 중 (Active)" },
]);

export default function CouponPromotionManagement() {
  const items = useStore(couponStore) as CouponItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status.includes(statusFilter));

  const totalRev = filtered.reduce((acc, i) => acc + i.revenueContribution, 0);

  const excel = () =>
    downloadCsv(
      "마케팅_쿠폰프로모션_발행_대장.csv",
      ["쿠폰코드", "쿠폰명", "할인구분", "할인값", "발행수량", "사용수량", "사용률(%)", "매출기여액", "상태"],
      filtered.map((i) => [
        i.couponCode,
        i.couponName,
        i.discountType,
        i.discountValue,
        i.issuedCount,
        i.usedCount,
        `${i.usageRatePct}%`,
        i.revenueContribution,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">12. Marketing Management (마케팅)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">쿠폰프로모션관리 (MK-012)</h1>
          <span className="text-[11px] text-sub">신제품 프로모션 얼리버드 및 VIP 고객 대상 프로모션 쿠폰 발행 · 회수 사용률 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">쿠폰 유도 총 발생 매출액</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalRev / 100000000).toFixed(1)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 쿠폰 회수 사용률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.usageRatePct, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">총 사용 완료 쿠폰 수량</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {filtered.reduce((acc, i) => acc + i.usedCount, 0).toLocaleString()} <span className="text-xs font-normal text-ink">장</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "발행 중"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === s
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 쿠폰프로모션 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">쿠폰 코드</th>
              <th className="px-3 py-2">쿠폰 명칭</th>
              <th className="px-3 py-2">할인 구분</th>
              <th className="px-3 py-2 text-right">발행 수량</th>
              <th className="px-3 py-2 text-right">사용 수량</th>
              <th className="px-3 py-2 text-right">회수 사용률</th>
              <th className="px-3 py-2 text-right">유도 매출액</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.couponCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.couponName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.discountType} ({i.discountValue.toLocaleString()}{i.discountType.includes("%") ? "%" : "원"})</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.issuedCount.toLocaleString()}장</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.usedCount.toLocaleString()}장</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.usageRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(i.revenueContribution / 100000000).toFixed(1)}억원</td>
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
