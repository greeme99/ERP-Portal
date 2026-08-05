// FI-005 자금관리 — 현금흐름(입출금), 잔액, 자금예측
import { partnerStore, customerStore } from "../../data/mock/master";
import { arStore, apStore, journalStore, OPENING_CASH, OPEX_ACCOUNTS, JLine } from "../../data/mock/finance";
import { useStore, downloadCsv } from "../../services/store";

const TODAY = "2026-07-03";
const eok = (v: number) => `${(v / 100000000).toFixed(2)}억`;

export default function CashManagement() {
  const ars = useStore(arStore);
  const aps = useStore(apStore);
  const journals = useStore(journalStore);
  const customers = useStore(customerStore);
  const partners = useStore(partnerStore);

  const custName = (c: string) => customers.find((x) => x.code === c)?.name ?? c;
  const vendName = (v: string) => partners.find((p) => p.code === v)?.name ?? v;

  // 실현 현금흐름
  const inflow = ars.filter((a) => a.status === "수금완료").reduce((s, a) => s + a.amount, 0);
  const apOut = aps.filter((a) => a.status === "지급완료").reduce((s, a) => s + a.amount, 0);
  const opexOut = journals
    .filter((j) => j.status === "전기")
    .flatMap((j) => j.lines as JLine[])
    .filter((l) => OPEX_ACCOUNTS.includes(l.account))
    .reduce((s, l) => s + l.dr, 0);
  const outflow = apOut + opexOut;
  const balance = OPENING_CASH + inflow - outflow;

  // 자금 예측 (미실현)
  const expectedIn = ars.filter((a) => a.status === "미수").reduce((s, a) => s + a.amount, 0);
  const expectedOut = aps.filter((a) => a.status === "미지급").reduce((s, a) => s + a.amount, 0);
  const projected = balance + expectedIn - expectedOut;

  const cards = [
    { label: "기초잔액", value: eok(OPENING_CASH), color: "" },
    { label: "입금(수금)", value: `+${eok(inflow)}`, color: "text-emerald-500" },
    { label: "출금(지급+운영비)", value: `-${eok(outflow)}`, color: "text-red-500" },
    { label: "현재잔액", value: eok(balance), color: balance < 0 ? "text-red-500" : "" },
  ];

  const rows = [
    ...ars.filter((a) => a.status === "미수").map((a) => ({ kind: "입금예정", party: custName(a.customer), amount: a.amount, due: a.dueDate, ref: a.code })),
    ...aps.filter((a) => a.status === "미지급").map((a) => ({ kind: "출금예정", party: vendName(a.vendor), amount: -a.amount, due: a.dueDate, ref: a.code })),
  ].sort((x, y) => (x.due < y.due ? -1 : 1));

  const excel = () =>
    downloadCsv("자금예측.csv", ["구분", "거래처", "금액", "기일", "참조"],
      rows.map((r) => [r.kind, r.party, r.amount, r.due, r.ref]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. 재무회계 (Financial)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">자금관리 (FI-005)</h1>
          <span className="text-[11px] text-sub">현금흐름 · 잔액 · 자금예측 (AR수금·AP지급·운영비 연동)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-panel border border-line rounded-lg p-3">
            <div className="text-[11px] text-sub">{c.label}</div>
            <div className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-panel border border-line rounded-lg p-4">
        <div className="flex items-center justify-between text-[12px] mb-2">
          <span className="font-semibold">자금 예측</span>
          <span className="text-sub">현재 {eok(balance)} + 예정입금 {eok(expectedIn)} − 예정출금 {eok(expectedOut)} =
            <b className={`ml-1 ${projected < 0 ? "text-red-500" : "text-emerald-600"}`}>예상잔액 {eok(projected)}</b>
          </span>
        </div>
        {projected < 0 && <div className="text-[11px] text-red-500 mb-1">⚠️ 예상잔액 마이너스 — 차입 또는 수금 촉진 필요</div>}
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line flex items-center">
          <span className="font-semibold">예정 현금흐름 (기일순)</span>
          <button onClick={excel} className="ml-auto px-3 py-1 rounded border border-line text-[11px] hover:bg-accent-soft">📥 Excel</button>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">구분</th>
              <th className="px-3 py-2">거래처</th>
              <th className="px-3 py-2 text-right">금액(원)</th>
              <th className="px-3 py-2">기일</th>
              <th className="px-3 py-2">참조</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.amount >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{r.kind}</span>
                </td>
                <td className="px-3 py-2">{r.party}</td>
                <td className={`px-3 py-2 text-right font-semibold ${r.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {r.amount >= 0 ? "+" : ""}{r.amount.toLocaleString()}
                </td>
                <td className={`px-3 py-2 ${r.due < TODAY ? "text-red-500 font-bold" : "text-sub"}`}>{r.due}</td>
                <td className="px-3 py-2 font-mono text-sub">{r.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="px-4 py-5 text-center text-sub text-[12px]">예정 현금흐름이 없습니다.</div>}
      </div>
    </div>
  );
}
