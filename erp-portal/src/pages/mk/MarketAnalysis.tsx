// MK-006 시장분석 — 제품군별 시장규모·점유율·성장률·경쟁사
import { marketStore, share } from "../../data/mock/analytics";
import { useStore, downloadCsv } from "../../services/store";

export default function MarketAnalysis() {
  const markets = useStore(marketStore);

  const totalMarket = markets.reduce((s, m) => s + m.marketSize, 0);
  const totalOur = markets.reduce((s, m) => s + m.ourSales, 0);
  const avgShare = share(totalOur, totalMarket);
  const maxSize = Math.max(...markets.map((m) => m.marketSize), 1);

  const excel = () =>
    downloadCsv("시장분석.csv", ["제품군", "시장규모(억)", "자사매출(억)", "점유율%", "성장률%", "1위경쟁사", "경쟁사점유율%"],
      markets.map((m) => [m.category, m.marketSize, m.ourSales, share(m.ourSales, m.marketSize).toFixed(1), m.growth, m.topRival, m.rivalShare]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. 마케팅 (Marketing)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">시장분석 (MK-006)</h1>
          <span className="text-[11px] text-sub">제품군별 시장규모·점유율·성장률·경쟁 구도 (국내, 연간)</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">총 시장규모</div><div className="text-xl font-bold mt-1">{totalMarket.toLocaleString()}억</div></div>
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">자사 매출</div><div className="text-xl font-bold mt-1">{totalOur.toLocaleString()}억</div></div>
        <div className="bg-panel border border-line rounded-lg p-3"><div className="text-[11px] text-sub">평균 점유율</div><div className="text-xl font-bold mt-1 text-accent">{avgShare.toFixed(1)}%</div></div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line flex items-center">
          <span className="font-semibold">제품군별 시장 현황</span>
          <button onClick={excel} className="ml-auto px-3 py-1 rounded border border-line text-[11px] hover:bg-accent-soft">📥 Excel</button>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">제품군</th>
              <th className="px-3 py-2 w-48">시장규모(억)</th>
              <th className="px-3 py-2 text-right">자사매출</th>
              <th className="px-3 py-2 text-right">자사 점유율</th>
              <th className="px-3 py-2 text-right">성장률</th>
              <th className="px-3 py-2">1위 경쟁사</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => {
              const sh = share(m.ourSales, m.marketSize);
              return (
                <tr key={m.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-semibold">{m.category}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-surface rounded relative overflow-hidden">
                        <div className="h-3 bg-accent-soft rounded" style={{ width: `${(m.marketSize / maxSize) * 100}%` }} />
                        <div className="h-3 bg-accent rounded absolute top-0 left-0" style={{ width: `${(m.ourSales / maxSize) * 100}%` }} title="자사" />
                      </div>
                      <span className="text-[11px] text-sub w-12 text-right">{m.marketSize.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">{m.ourSales.toLocaleString()}</td>
                  <td className={`px-3 py-2 text-right font-bold ${sh >= 20 ? "text-emerald-500" : sh >= 10 ? "text-amber-500" : "text-red-500"}`}>{sh.toFixed(1)}%</td>
                  <td className={`px-3 py-2 text-right font-semibold ${m.growth >= 8 ? "text-emerald-500" : "text-sub"}`}>▲ {m.growth}%</td>
                  <td className="px-3 py-2 text-sub">{m.topRival} <span className="text-[11px]">({m.rivalShare}%)</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line">
          막대: 연한색=시장규모, 진한색=자사매출 · 점유율 20%+ 우량(녹색), 10% 미만 열위(적색)
        </div>
      </div>
    </div>
  );
}
