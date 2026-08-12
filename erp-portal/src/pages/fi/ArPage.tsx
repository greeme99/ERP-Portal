// FI-002 매출채권(AR) — 출하완료 SO 동기화, Aging, 수금 → 여신 차감
import { useState } from "react";
import { customerStore } from "../../data/mock/master";
import { salesOrderStore, docTotal, DocLine } from "../../data/mock/sales";
import { arStore } from "../../data/mock/finance";
import { useStore, nextId, downloadCsv, Entity } from "../../services/store";
import PrintableDocument, { PrintDoc } from "../../components/print/PrintableDocument";
import { splitVat, VAT_RATE } from "../../services/documentMath";

const TODAY = "2026-07-03";
const daysBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export default function ArPage() {
  const ars = useStore(arStore);
  const [printDoc, setPrintDoc] = useState<PrintDoc | null>(null);
  const sos = useStore(salesOrderStore);
  const customers = useStore(customerStore);

  const custName = (c: string) => customers.find((x) => x.code === c)?.name ?? c;
  const unbooked = sos.filter((o) => o.status === "출하완료" && !ars.some((a) => a.ref === o.code));

  const sync = () => {
    if (unbooked.length === 0) return alert("동기화할 출하완료 건이 없습니다.");
    unbooked.forEach((o) => {
      const code = nextId("AR");
      arStore.create({
        id: code, code, ref: o.code, customer: o.customer, amount: docTotal(o.lines as DocLine[]),
        invoiceDate: TODAY, dueDate: o.dueDate, status: "미수",
      });
    });
  };

  const collect = (ar: any) => {
    if (!confirm(`${ar.code} — ${ar.amount.toLocaleString()}원 수금 처리할까요?`)) return;
    arStore.update(ar.id, { status: "수금완료" });
    const cust = customers.find((c) => c.code === ar.customer);
    if (cust) customerStore.update(cust.id, { creditUsed: Math.max(0, cust.creditUsed - ar.amount) });
  };

  const open = ars.filter((a) => a.status === "미수");
  const totalOpen = open.reduce((s, a) => s + a.amount, 0);
  const overdue = open.filter((a) => a.dueDate < TODAY);

  // 매출전표 서식 — 차변 매출채권 / 대변 제품매출·부가세로 분개한다
  const buildVoucherDoc = (a: Entity): PrintDoc => {
    const { supply, vat, total } = splitVat(Number(a.amount));
    const late = a.status === "미수" && a.dueDate < TODAY;
    return {
      title: "매 출 전 표",
      docNo: String(a.code),
      issuedAt: String(a.invoiceDate ?? TODAY),
      counterpartyLabel: "거래처",
      counterparty: [
        { label: "고객코드", value: String(a.customer) },
        { label: "고객명", value: custName(String(a.customer)) },
        { label: "연계 수주", value: String(a.ref ?? "-") },
      ],
      meta: [
        { label: "발행일", value: String(a.invoiceDate ?? "-") },
        { label: "만기일", value: String(a.dueDate ?? "-") },
        { label: "회수상태", value: String(a.status ?? "-") },
        { label: "연체여부", value: late ? `연체 ${daysBetween(String(a.dueDate), TODAY)}일` : "정상" },
      ],
      columns: [
        { key: "account", label: "계정과목" },
        { key: "drcr", label: "차대", align: "center" },
        { key: "debit", label: "차변", align: "right" },
        { key: "credit", label: "대변", align: "right" },
        { key: "note", label: "적요" },
      ],
      rows: [
        { account: "1130 매출채권", drcr: "차변", debit: total, credit: "", note: `${custName(String(a.customer))} 외상매출` },
        { account: "4010 제품매출", drcr: "대변", debit: "", credit: supply, note: "제품 매출액" },
        { account: "2550 부가세예수금", drcr: "대변", debit: "", credit: vat, note: `부가세 ${VAT_RATE * 100}%` },
      ],
      totals: [
        { label: "차변 합계", value: `${total.toLocaleString()} 원` },
        { label: "대변 합계", value: `${(supply + vat).toLocaleString()} 원` },
        { label: "차대 평형", value: total === supply + vat ? "일치" : "불일치" },
      ],
      note: ["· 본 전표는 매출채권 발생 시점의 분개를 표시합니다.", "· 수금 시 별도 입금전표가 발행됩니다."].join(String.fromCharCode(10)),
      signatures: ["작성", "검토", "승인"],
    };
  };

  const excel = () =>
    downloadCsv("매출채권.csv", ["채권번호", "참조", "고객", "금액", "청구일", "만기일", "경과일", "상태"],
      ars.map((a) => [a.code, a.ref, custName(a.customer), a.amount, a.invoiceDate, a.dueDate,
        a.status === "미수" && a.dueDate < TODAY ? daysBetween(a.dueDate, TODAY) : 0, a.status]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. 재무회계 (Financial)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">매출채권 AR (FI-002)</h1>
          <span className="text-[11px] text-sub">Aging 관리 · 수금 시 여신 자동 차감</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">미수 채권</div>
          <div className="text-xl font-bold mt-1">{(totalOpen / 100000000).toFixed(1)}억</div>
          <div className="text-[10px] text-sub mt-0.5">{open.length}건</div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">연체 채권</div>
          <div className={`text-xl font-bold mt-1 ${overdue.length > 0 ? "text-red-500" : "text-emerald-500"}`}>
            {(overdue.reduce((s, a) => s + a.amount, 0) / 100000000).toFixed(1)}억
          </div>
          <div className="text-[10px] text-sub mt-0.5">{overdue.length}건</div>
        </div>
        <div className="bg-panel border border-line rounded-lg p-3">
          <div className="text-[11px] text-sub">미동기화 출하</div>
          <div className="text-xl font-bold mt-1">{unbooked.length}건</div>
          <button onClick={sync} className="mt-1 px-2 py-0.5 rounded bg-accent text-white text-[10px] font-semibold">↻ 동기화</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line flex items-center">
          <span className="font-semibold">채권 목록</span>
          <button onClick={excel} className="ml-auto px-3 py-1 rounded border border-line text-[11px] hover:bg-accent-soft">📥 Excel</button>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">채권번호</th>
              <th className="px-3 py-2">참조</th>
              <th className="px-3 py-2">고객</th>
              <th className="px-3 py-2 text-right">금액(원)</th>
              <th className="px-3 py-2">만기일</th>
              <th className="px-3 py-2">Aging</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {ars.map((a) => {
              const late = a.status === "미수" && a.dueDate < TODAY;
              const days = late ? daysBetween(a.dueDate, TODAY) : 0;
              return (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-mono">{a.code}</td>
                  <td className="px-3 py-2 font-mono text-sub">{a.ref}</td>
                  <td className="px-3 py-2">{custName(a.customer)}</td>
                  <td className="px-3 py-2 text-right">{a.amount.toLocaleString()}</td>
                  <td className="px-3 py-2 text-sub">{a.dueDate}</td>
                  <td className={`px-3 py-2 font-semibold ${late ? (days > 30 ? "text-red-500" : "text-amber-500") : "text-emerald-500"}`}>
                    {a.status === "수금완료" ? "-" : late ? `연체 ${days}일` : "정상"}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === "미수" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {a.status === "미수" && (
                        <button onClick={() => collect(a)} className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">💰 수금</button>
                      )}
                      <button
                        onClick={() => setPrintDoc(buildVoucherDoc(a))}
                        title="매출전표를 인쇄합니다. 인쇄 대화상자에서 PDF로 저장할 수 있습니다."
                        className="px-2 py-0.5 rounded border border-line text-[10px] font-semibold hover:bg-accent-soft"
                      >
                        🖨 전표
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PrintableDocument doc={printDoc} onDone={() => setPrintDoc(null)} />
    </div>
  );
}
