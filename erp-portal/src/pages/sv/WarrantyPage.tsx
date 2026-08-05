// SV-005 Warranty 관리 — 출하완료 제품 보증 등록·만료 관리
import { materialStore, customerStore } from "../../data/mock/master";
import { salesOrderStore, DocLine } from "../../data/mock/sales";
import { warrantyStore, addMonths, WARRANTY_STYLE, TODAY } from "../../data/mock/service";
import { useStore, nextId, downloadCsv } from "../../services/store";

export default function WarrantyPage() {
  const warranties = useStore(warrantyStore);
  const orders = useStore(salesOrderStore);
  const mats = useStore(materialStore);
  const customers = useStore(customerStore);

  const custName = (c: string) => customers.find((x) => x.code === c)?.name ?? c;
  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;

  // 출하완료 SO 중 보증 미등록 건
  const delivered = orders.filter((o) => o.status === "출하완료");
  const unregistered = delivered.filter((o) => !warranties.some((w) => w.ref === o.code));

  const sync = () => {
    if (unregistered.length === 0) return alert("보증 등록할 출하완료 건이 없습니다.");
    unregistered.forEach((o) => {
      (o.lines as DocLine[]).filter((l) => l.material.startsWith("FG-")).forEach((l) => {
        const code = nextId("W");
        const expiry = addMonths(o.orderDate, 12);
        warrantyStore.create({
          id: code, code, ref: o.code, material: l.material, customer: o.customer,
          shipDate: o.orderDate, months: 12, expiry, status: expiry >= TODAY ? "유효" : "만료",
        });
      });
    });
  };

  // 만료 상태 실시간 재계산
  const statusOf = (w: any) => (w.expiry >= TODAY ? "유효" : "만료");

  const excel = () =>
    downloadCsv("보증관리.csv", ["보증번호", "참조", "제품", "고객", "출하일", "보증개월", "만료일", "상태"],
      warranties.map((w) => [w.code, w.ref, w.material, custName(w.customer), w.shipDate, w.months, w.expiry, statusOf(w)]));

  const valid = warranties.filter((w) => statusOf(w) === "유효").length;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. 서비스 (Service)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">Warranty 관리 (SV-005)</h1>
          <span className="text-[11px] text-sub">출하완료 제품 보증 등록 · 만료 관리 (기본 12개월)</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3 text-[12px]">
        <span>보증 <b>{warranties.length}</b>건</span>
        <span className="text-emerald-600">유효 {valid}</span>
        <span className="text-red-500">만료 {warranties.length - valid}</span>
        {unregistered.length > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">미등록 출하 {unregistered.length}건</span>
        )}
        <div className="ml-auto flex gap-1">
          <button onClick={sync} className="px-3 py-1.5 rounded bg-blue-600 text-white text-[12px] font-semibold">↻ 출하 동기화</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">보증번호</th>
              <th className="px-3 py-2">참조 SO</th>
              <th className="px-3 py-2">제품</th>
              <th className="px-3 py-2">고객</th>
              <th className="px-3 py-2">출하일</th>
              <th className="px-3 py-2 text-center">개월</th>
              <th className="px-3 py-2">만료일</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {warranties.map((w) => (
              <tr key={w.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{w.code}</td>
                <td className="px-3 py-2 font-mono text-sub">{w.ref}</td>
                <td className="px-3 py-2">{w.material} — {matName(w.material)}</td>
                <td className="px-3 py-2">{custName(w.customer)}</td>
                <td className="px-3 py-2 text-sub">{w.shipDate}</td>
                <td className="px-3 py-2 text-center">{w.months}</td>
                <td className="px-3 py-2">{w.expiry}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${WARRANTY_STYLE[statusOf(w)] ?? ""}`}>{statusOf(w)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
