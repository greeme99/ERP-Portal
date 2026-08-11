// SD-002 가격정책 관리 — 제품별 기본단가·수량할인(MOQ)·채널별 수수료 및 프로모션 가격 체계
import { useState } from "react";
import { materialStore } from "../../data/mock/master";
import { useStore, downloadCsv } from "../../services/store";

interface PricingPolicy {
  id: string;
  materialCode: string;
  materialName: string;
  basePrice: number;
  minQty: number; // MOQ
  tierDiscountRate: number; // %
  channelDirectDiscount: number; // % (직판)
  channelAgencyDiscount: number; // % (대리점)
  status: "적용중" | "승인대기" | "만료";
}

export default function SalesPricing() {
  const mats = useStore(materialStore);
  const fgMats = mats.filter((m) => m.type === "완제품");

  const [policies, setPolicies] = useState<PricingPolicy[]>(() =>
    fgMats.map((m, idx) => ({
      id: `POL-${1000 + idx}`,
      materialCode: m.code,
      materialName: m.name,
      basePrice: m.price || 150000,
      minQty: (idx + 1) * 50,
      tierDiscountRate: 5,
      channelDirectDiscount: 0,
      channelAgencyDiscount: 10,
      status: "적용중",
    }))
  );

  const [filter, setFilter] = useState("전체");

  const handlePriceChange = (id: string, newPrice: number) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, basePrice: newPrice } : p))
    );
  };

  const filtered = policies.filter((p) => filter === "전체" || p.status === filter);

  const excel = () =>
    downloadCsv(
      "영업_가격정책표.csv",
      ["정책ID", "품목코드", "품목명", "기본단가(원)", "MOQ", "대량할인율(%)", "직판할인(%)", "대리점할인(%)", "상태"],
      filtered.map((p) => [
        p.id,
        p.materialCode,
        p.materialName,
        p.basePrice,
        p.minQty,
        p.tierDiscountRate,
        p.channelDirectDiscount,
        p.channelAgencyDiscount,
        p.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. Sales Management (영업관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">가격정책 관리 (SD-002)</h1>
          <span className="text-[11px] text-sub">제품별 기본 단가 · 수량 할인(MOQ) · 채널별 가격 매트릭스</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태 필터:</span>
          {["전체", "적용중", "승인대기", "만료"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filter === st
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 가격표 Excel 다운로드
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">정책 ID</th>
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2 text-right">기본 단가(원)</th>
              <th className="px-3 py-2 text-right">MOQ(최소주문)</th>
              <th className="px-3 py-2 text-right">대량할인율</th>
              <th className="px-3 py-2 text-right">직판 공급가</th>
              <th className="px-3 py-2 text-right">대리점 공급가</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const directPrice = Math.round(p.basePrice * (1 - p.channelDirectDiscount / 100));
              const agencyPrice = Math.round(p.basePrice * (1 - p.channelAgencyDiscount / 100));
              return (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-mono font-medium">{p.id}</td>
                  <td className="px-3 py-2">{p.materialCode} — {p.materialName}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={p.basePrice}
                      onChange={(e) => handlePriceChange(p.id, Number(e.target.value))}
                      className="w-24 px-1 py-0.5 rounded border border-line bg-surface text-[11px] text-right font-mono text-ink"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{p.minQty.toLocaleString()} EA</td>
                  <td className="px-3 py-2 text-right font-mono text-sub">{p.tierDiscountRate}%</td>
                  <td className="px-3 py-2 text-right font-mono">{directPrice.toLocaleString()}원</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">{agencyPrice.toLocaleString()}원</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      {p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
