// MM-015 구매 Dashboard — 발주·요청·예산·공급사 통합 현황
//
// 새 store 를 만들지 않는다. 구매 화면들이 이미 쓰는 store 를 그대로 집계한다.
import { Link } from "react-router-dom";
import { useStore } from "../../services/store";
import { budgetStore, poStore, prStore, vendorEvalStore } from "../../data/mock/procurement";
import { TODAY, fmtEok } from "../../services/insights";

const card = "bg-panel border rounded-lg p-3 hover:border-accent";
const pct = (n: number) => `${Math.round(n)}%`;

export default function PurchaseDashboard() {
  const pos = useStore(poStore);
  const prs = useStore(prStore);
  const budgets = useStore(budgetStore);
  const vendors = useStore(vendorEvalStore);

  const open = pos.filter((o) => o.status === "발주");
  const late = open.filter((o) => o.dueDate < TODAY);
  const poAmount = pos.reduce((s, o) => s + o.qty * o.price, 0);
  const waiting = prs.filter((p) => p.status === "승인대기");

  const budgetTotal = budgets.reduce((s, b) => s + b.budget, 0);
  const usedTotal = budgets.reduce((s, b) => s + b.used, 0);
  const usedPct = budgetTotal > 0 ? (usedTotal / budgetTotal) * 100 : 0;

  // 공급사 종합점수 — 4개 지표 단순 평균. 가중치는 아직 정해진 바 없다.
  // ponytail: 균등 가중, 가중치 정책이 생기면 vendorEvalStore 에 컬럼을 추가한다.
  const score = (v: (typeof vendors)[number]) => (v.quality + v.delivery + v.price + v.response) / 4;
  const ranked = [...vendors].sort((a, b) => score(b) - score(a));

  const CARDS = [
    { label: "진행 발주", value: open.length, link: "/m/mm/mm-05", bad: false },
    { label: "납기지연", value: late.length, link: "/m/mm/mm-05", bad: late.length > 0 },
    { label: "승인대기 PR", value: waiting.length, link: "/m/mm/mm-04", bad: waiting.length > 2 },
    { label: "발주 총액", value: fmtEok(poAmount), link: "/m/mm/mm-05", bad: false },
    { label: "예산 소진율", value: pct(usedPct), link: "/m/co/co-08", bad: usedPct > 90 },
    { label: "평가 공급사", value: vendors.length, link: "/m/mm/mm-02", bad: false },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] text-sub">03. 구매관리 (Materials Management)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">구매 Dashboard</h1>
          <span className="text-[11px] text-sub">발주·요청·예산·공급사 통합 현황</span>
        </div>
      </div>

      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
        {CARDS.map((c) => (
          <Link key={c.label} to={c.link} className={`${card} ${c.bad ? "border-red-300" : "border-line"}`}>
            <div className="text-[11px] text-sub">{c.label}</div>
            <div className={`text-xl font-bold mt-1 ${c.bad ? "text-red-500" : "text-emerald-500"}`}>{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* 부서별 예산 소진 */}
        <div className="bg-panel border border-line rounded-lg overflow-x-auto">
          <div className="px-4 py-2.5 border-b border-line font-semibold">💰 부서별 구매예산 소진</div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-sub text-left">
                <th className="px-3 py-2">부서</th>
                <th className="px-3 py-2 text-right">예산</th>
                <th className="px-3 py-2 text-right">집행</th>
                <th className="px-3 py-2 text-right">잔액</th>
                <th className="px-3 py-2 text-right">소진율</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => {
                const rate = b.budget > 0 ? (b.used / b.budget) * 100 : 0;
                return (
                  <tr key={b.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                    <td className="px-3 py-2">{b.dept}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtEok(b.budget)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtEok(b.used)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtEok(b.budget - b.used)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${rate > 90 ? "text-red-500" : rate > 75 ? "text-amber-500" : "text-emerald-500"}`}>
                      {pct(rate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 공급사 평가 순위 */}
        <div className="bg-panel border border-line rounded-lg overflow-x-auto">
          <div className="px-4 py-2.5 border-b border-line font-semibold">🏅 공급사 종합평가</div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-sub text-left">
                <th className="px-3 py-2">공급사</th>
                <th className="px-3 py-2 text-right">품질</th>
                <th className="px-3 py-2 text-right">납기</th>
                <th className="px-3 py-2 text-right">가격</th>
                <th className="px-3 py-2 text-right">대응</th>
                <th className="px-3 py-2 text-right">종합</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((v) => (
                <tr key={v.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2">{v.name}</td>
                  <td className="px-3 py-2 text-right font-mono">{v.quality}</td>
                  <td className={`px-3 py-2 text-right font-mono ${v.delivery < 80 ? "text-red-500" : ""}`}>{v.delivery}</td>
                  <td className="px-3 py-2 text-right font-mono">{v.price}</td>
                  <td className="px-3 py-2 text-right font-mono">{v.response}</td>
                  <td className={`px-3 py-2 text-right font-bold ${score(v) >= 90 ? "text-emerald-500" : score(v) < 80 ? "text-red-500" : ""}`}>
                    {score(v).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 납기지연 발주 */}
      <div className="bg-panel border border-line rounded-lg">
        <div className="px-4 py-2.5 border-b border-line font-semibold">🚨 납기지연 발주 ({late.length}건)</div>
        {late.length > 0 ? (
          <ul>
            {late.map((o) => (
              <li key={o.id} className="px-4 py-2.5 border-b border-line last:border-0 flex items-center gap-2 text-[12px]">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 whitespace-nowrap">지연</span>
                <Link to="/m/mm/mm-05" className="hover:text-accent">
                  {o.code} · {o.material} · 납기 {o.dueDate} · {fmtEok(o.qty * o.price)}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-6 text-center text-emerald-500 text-[12px]">✓ 납기지연 발주 없음</div>
        )}
      </div>
    </div>
  );
}
