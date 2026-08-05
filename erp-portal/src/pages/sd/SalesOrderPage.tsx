// SD-003 수주관리 — ATP 재고체크, 출하예약, 수주변경
import { useState } from "react";
import { customerStore, materialStore } from "../../data/mock/master";
import { salesOrderStore, docTotal, atpQty, DocLine } from "../../data/mock/sales";
import { useStore, nextId, downloadCsv } from "../../services/store";

const STATUS_STYLE: Record<string, string> = {
  등록: "bg-amber-100 text-amber-700",
  출하예약: "bg-blue-100 text-blue-700",
  출하완료: "bg-emerald-100 text-emerald-700",
  취소: "bg-red-100 text-red-700",
};

export default function SalesOrderPage() {
  const orders = useStore(salesOrderStore);
  const customers = useStore(customerStore);
  const mats = useStore(materialStore).filter((m) => m.type === "완제품");
  const [sel, setSel] = useState<string | null>(orders[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ customer: string; dueDate: string; lines: DocLine[] }>({
    customer: "", dueDate: "2026-08-01", lines: [],
  });

  const order = orders.find((o) => o.id === sel);
  const custName = (code: string) => customers.find((c) => c.code === code)?.name ?? code;
  const mat = (code: string) => mats.find((m) => m.code === code);

  // ATP: 현재고 - 타 수주 미출하 할당량
  const atp = (materialCode: string, excludeId?: string) => {
    const m = mat(materialCode);
    return m ? atpQty(materialCode, m.stock, orders, excludeId) : 0;
  };

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { material: mats[0]?.code ?? "", qty: 100, price: mats[0]?.price ?? 0 }] }));
  const setLine = (i: number, patch: Partial<DocLine>) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  const save = () => {
    if (!form.customer) return alert("고객을 선택하세요.");
    if (form.lines.length === 0) return alert("품목 라인을 추가하세요.");
    // 신용한도 체크 (SD-001 연계)
    const cust = customers.find((c) => c.code === form.customer);
    const total = docTotal(form.lines);
    if (cust && cust.creditUsed + total > cust.creditLimit) {
      if (!confirm(`⚠️ 신용한도 초과: 한도 ${Number(cust.creditLimit).toLocaleString()}원, 사용 ${Number(cust.creditUsed).toLocaleString()}원, 신규 ${total.toLocaleString()}원.\n그래도 등록할까요? (여신 승인 필요)`)) return;
    }
    // ATP 부족 경고
    const shortage = form.lines.filter((l) => atp(l.material) < l.qty);
    if (shortage.length > 0) {
      if (!confirm(`⚠️ ATP 부족 품목 ${shortage.length}건: ${shortage.map((l) => l.material).join(", ")}.\n납기 재협의 또는 생산계획 반영이 필요합니다. 등록할까요?`)) return;
    }
    const code = nextId("SO");
    salesOrderStore.create({
      id: code, code, customer: form.customer,
      orderDate: new Date().toISOString().slice(0, 10),
      dueDate: form.dueDate, status: "등록", lines: form.lines,
    });
    setCreating(false);
    setForm({ customer: "", dueDate: "2026-08-01", lines: [] });
    setSel(code);
  };

  const reserve = () => order && salesOrderStore.update(order.id, { status: "출하예약" });
  const cancel = () => order && confirm("수주를 취소할까요?") && salesOrderStore.update(order.id, { status: "취소" });
  const excel = () =>
    downloadCsv("수주목록.csv", ["수주번호", "고객", "수주일", "납기일", "상태", "금액"],
      orders.map((o) => [o.code, custName(o.customer), o.orderDate, o.dueDate, o.status, docTotal(o.lines)]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. 영업관리 (Sales)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">수주관리 (SD-003)</h1>
          <span className="text-[11px] text-sub">ATP 재고체크 · 신용한도 연계 · 출하예약</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-2">
        <span className="text-[11px] text-sub">{orders.length}건</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => { setCreating(true); addLine(); }} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 수주 등록</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* 목록 */}
        <div className="bg-panel border border-line rounded-lg overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-sub text-left">
                <th className="px-3 py-2">수주번호</th>
                <th className="px-3 py-2">고객</th>
                <th className="px-3 py-2">납기일</th>
                <th className="px-3 py-2 text-right">금액(원)</th>
                <th className="px-3 py-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => setSel(o.id)}
                  className={`border-b border-line last:border-0 cursor-pointer hover:bg-accent-soft ${sel === o.id ? "bg-accent-soft" : ""}`}>
                  <td className="px-3 py-2 font-mono">{o.code}</td>
                  <td className="px-3 py-2">{custName(o.customer)}</td>
                  <td className="px-3 py-2 text-sub">{o.dueDate}</td>
                  <td className="px-3 py-2 text-right">{docTotal(o.lines).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[o.status] ?? ""}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 상세 + ATP */}
        <div className="bg-panel border border-line rounded-lg">
          {order ? (
            <>
              <div className="px-4 py-2.5 border-b border-line flex items-center gap-2">
                <span className="font-semibold">{order.code} 상세</span>
                <span className="text-[11px] text-sub">수주일 {order.orderDate}</span>
                <div className="ml-auto flex gap-1">
                  {order.status === "등록" && (
                    <>
                      <button onClick={reserve} className="px-3 py-1 rounded bg-blue-600 text-white text-[11px] font-semibold">🚚 출하예약</button>
                      <button onClick={cancel} className="px-3 py-1 rounded border border-line text-[11px] text-red-500 hover:bg-accent-soft">취소</button>
                    </>
                  )}
                </div>
              </div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-line text-sub text-left">
                    <th className="px-3 py-2">품목</th>
                    <th className="px-3 py-2 text-right">수주량</th>
                    <th className="px-3 py-2 text-right">ATP</th>
                    <th className="px-3 py-2 text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.lines as DocLine[]).map((l, i) => {
                    const available = atp(l.material, order.id);
                    const ok = available >= l.qty;
                    return (
                      <tr key={i} className="border-b border-line last:border-0">
                        <td className="px-3 py-2">{l.material} — {mat(l.material)?.name ?? ""}</td>
                        <td className="px-3 py-2 text-right">{l.qty.toLocaleString()}</td>
                        <td className={`px-3 py-2 text-right font-semibold ${ok ? "text-emerald-500" : "text-red-500"}`}>
                          {available.toLocaleString()} {ok ? "✓" : "✗ 부족"}
                        </td>
                        <td className="px-3 py-2 text-right">{(l.qty * l.price).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2.5 border-t border-line text-right font-bold">
                합계 {docTotal(order.lines).toLocaleString()}원
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-sub text-[12px]">수주를 선택하세요.</div>
          )}
        </div>
      </div>

      {/* 등록 모달 */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[660px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">수주 등록</div>
            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <label className="text-[11px] text-sub">
                  고객 *
                  <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}
                    className="block w-64 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                    <option value="">선택</option>
                    {customers.filter((c) => c.status === "거래중").map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name} (등급 {c.grade})</option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] text-sub">
                  납기일
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="block mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
              </div>
              {form.lines.map((l, i) => {
                const available = atp(l.material);
                const ok = available >= l.qty;
                return (
                  <div key={i} className="flex items-end gap-2">
                    <label className="text-[11px] text-sub flex-1">
                      품목
                      <select value={l.material}
                        onChange={(e) => {
                          const m = mat(e.target.value);
                          setLine(i, { material: e.target.value, price: m?.price ?? 0 });
                        }}
                        className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                        {mats.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
                      </select>
                    </label>
                    <label className="text-[11px] text-sub">
                      수량
                      <input type="number" value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })}
                        className="block w-24 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                    </label>
                    <label className="text-[11px] text-sub">
                      단가
                      <input type="number" value={l.price} onChange={(e) => setLine(i, { price: Number(e.target.value) })}
                        className="block w-28 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                    </label>
                    <span className={`text-[11px] font-semibold pb-2 w-28 ${ok ? "text-emerald-500" : "text-red-500"}`}>
                      ATP {available.toLocaleString()} {ok ? "✓" : "✗"}
                    </span>
                    <button onClick={() => setForm((f) => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }))}
                      className="px-2 py-1.5 text-red-500 text-[12px]">✕</button>
                  </div>
                );
              })}
              <button onClick={addLine} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">＋ 라인 추가</button>
              <div className="text-right font-bold">합계 {docTotal(form.lines).toLocaleString()}원</div>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
