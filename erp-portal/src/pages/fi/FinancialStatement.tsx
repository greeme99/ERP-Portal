// FI-008 결산관리 — 손익계산서(P&L) + 재무상태 요약 (전표·KPI 연동)
import { arStore, apStore, journalStore, OPENING_CASH, OPEX_ACCOUNTS, JLine } from "../../data/mock/finance";
import { computeKpis } from "../../services/insights";
import { useStore, downloadCsv } from "../../services/store";

const eok = (v: number) => `${(v / 100000000).toFixed(2)}억`;

export default function FinancialStatement() {
  // store 구독 → 변경 시 재계산
  const journals = useStore(journalStore);
  const ars = useStore(arStore);
  const aps = useStore(apStore);

  const k = computeKpis();
  const revenue = k.revenue;
  const cogs = k.cogs;
  const grossProfit = revenue - cogs;

  // 판관비 = 운영비 계정 전기 전표
  const opex = journals
    .filter((j) => j.status === "전기")
    .flatMap((j) => j.lines as JLine[])
    .filter((l) => OPEX_ACCOUNTS.includes(l.account))
    .reduce((s, l) => s + l.dr, 0);
  const operatingProfit = grossProfit - opex;
  const opMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : null;

  // 재무상태 요약
  const arOpen = ars.filter((a) => a.status === "미수").reduce((s, a) => s + a.amount, 0);
  const apOpen = aps.filter((a) => a.status === "미지급").reduce((s, a) => s + a.amount, 0);
  const cash = OPENING_CASH
    + ars.filter((a) => a.status === "수금완료").reduce((s, a) => s + a.amount, 0)
    - aps.filter((a) => a.status === "지급완료").reduce((s, a) => s + a.amount, 0)
    - opex;
  const assets = cash + arOpen + k.invValue;
  const liabilities = apOpen;
  const equity = assets - liabilities;

  const pl = [
    { label: "매출액", value: revenue, bold: true },
    { label: "(−) 매출원가", value: -cogs },
    { label: "매출총이익", value: grossProfit, bold: true, sub: true },
    { label: "(−) 판매관리비", value: -opex },
    { label: "영업이익", value: operatingProfit, bold: true, sub: true, hl: true },
  ];

  const bs = [
    { label: "현금성자산", value: cash },
    { label: "매출채권", value: arOpen },
    { label: "재고자산", value: k.invValue },
    { label: "자산 합계", value: assets, bold: true },
    { label: "매입채무(부채)", value: liabilities },
    { label: "자본(순자산)", value: equity, bold: true, hl: true },
  ];

  const excel = () =>
    downloadCsv("손익계산서.csv", ["항목", "금액(원)"],
      [...pl.map((r) => [r.label, r.value]), ["", ""], ...bs.map((r) => [r.label, r.value])]);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. 재무회계 (Financial)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">결산관리 — 손익계산서 (FI-008)</h1>
          <span className="text-[11px] text-sub">출하·전표·재고 실시간 집계 (2026-07 누적)</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {/* 손익계산서 */}
        <div className="bg-panel border border-line rounded-lg">
          <div className="px-4 py-2.5 border-b border-line font-semibold flex items-center">
            손익계산서 (P&L)
            <span className={`ml-auto text-[12px] ${opMargin === null ? "text-sub" : opMargin >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              영업이익률 {opMargin !== null ? `${opMargin.toFixed(1)}%` : "-"}
            </span>
          </div>
          <table className="w-full text-[12px]">
            <tbody>
              {pl.map((r) => (
                <tr key={r.label} className={`border-b border-line last:border-0 ${r.hl ? "bg-accent-soft" : ""}`}>
                  <td className={`px-4 py-2 ${r.sub ? "font-semibold" : r.bold ? "font-semibold" : "pl-8 text-sub"}`}>{r.label}</td>
                  <td className={`px-4 py-2 text-right ${r.bold ? "font-bold" : ""} ${r.value < 0 ? "text-red-500" : ""}`}>
                    {r.value.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 재무상태 요약 */}
        <div className="bg-panel border border-line rounded-lg">
          <div className="px-4 py-2.5 border-b border-line font-semibold">재무상태 요약</div>
          <table className="w-full text-[12px]">
            <tbody>
              {bs.map((r) => (
                <tr key={r.label} className={`border-b border-line last:border-0 ${r.hl ? "bg-accent-soft" : ""}`}>
                  <td className={`px-4 py-2 ${r.bold ? "font-semibold" : "pl-8 text-sub"}`}>{r.label}</td>
                  <td className={`px-4 py-2 text-right ${r.bold ? "font-bold" : ""}`}>{r.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center text-[11px] text-sub">
        <span>매출총이익 {eok(grossProfit)} · 영업이익 {eok(operatingProfit)} · 자본 {eok(equity)}</span>
        <button onClick={excel} className="ml-auto px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
      </div>
    </div>
  );
}
