// FI-003 매입채무(AP) — 입고완료 PO 동기화, 지급 처리
import { partnerStore } from "../../data/mock/master";
import { poStore } from "../../data/mock/procurement";
import { apStore } from "../../data/mock/finance";
import { useStore, nextId, downloadCsv } from "../../services/store";

const TODAY = "2026-07-03";

export default function ApPage() {
  const aps = useStore(apStore);
  const pos = useStore(poStore);
  const partners = useStore(partnerStore);

  const vendorName = (v: string) => partners.find((p) => p.code === v)?.name ?? v;
  const unbooked = pos.filter((o) => o.status === "입고완료" && !aps.some((a) => a.ref === o.code));

  const sync = () => {
    if (unbooked.length === 0) return alert("동기화할 입고완료 건이 없습니다.");
    unbooked.forEach((o) => {
      const code = nextId("AP");
      apStore.create({
        id: code, code, ref: o.code, vendor: o.vendor, amount: o.qty * o.price,
        invoiceDate: TODAY, dueDate: "2026-08-31", status: "미지급",
      });
    });
  };

  const pay = (ap: any) => {
    if (!confirm(`${ap.code} — ${vendorName(ap.vendor)}에 ${ap.amount.toLocaleString()}원 지급 처리할까요?`)) return;
    apStore.update(ap.id, { status: "지급완료" });
  };

  const open = aps.filter((a) => a.status === "미지급");
  const totalOpen = open.reduce((s, a) => s + a.amount, 0);

  const excel = () =>
    downloadCsv("매입채무.csv", ["채무번호", "참조", "공급사", "금액", "만기일", "상태"],
      aps.map((a) => [a.code, a.ref, vendorName(a.vendor), a.amount, a.dueDate, a.status]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. 재무회계 (Financial)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">매입채무 AP (FI-003)</h1>
          <span className="text-[11px] text-sub">입고완료 PO 연계 · 지급 관리</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3 text-[12px]">
        <span>미지급 <b>{(totalOpen / 100000000).toFixed(2)}억</b> ({open.length}건)</span>
        {unbooked.length > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">미동기화 입고 {unbooked.length}건</span>
        )}
        <div className="ml-auto flex gap-1">
          <button onClick={sync} className="px-3 py-1.5 rounded bg-blue-600 text-white text-[12px] font-semibold">↻ 동기화</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">채무번호</th>
              <th className="px-3 py-2">참조</th>
              <th className="px-3 py-2">공급사</th>
              <th className="px-3 py-2 text-right">금액(원)</th>
              <th className="px-3 py-2">지급기일</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {aps.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{a.code}</td>
                <td className="px-3 py-2 font-mono text-sub">{a.ref}</td>
                <td className="px-3 py-2">{vendorName(a.vendor)}</td>
                <td className="px-3 py-2 text-right">{a.amount.toLocaleString()}</td>
                <td className={`px-3 py-2 ${a.status === "미지급" && a.dueDate < TODAY ? "text-red-500 font-bold" : "text-sub"}`}>{a.dueDate}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === "미지급" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {a.status === "미지급" && (
                    <button onClick={() => pay(a)} className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-semibold">💸 지급</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
