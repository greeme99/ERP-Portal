// SD-003 수주관리 — ATP 재고체크, 출하예약, 수주변경
import { useState } from "react";
import { customerStore, materialStore } from "../../data/mock/master";
import { salesOrderStore, docTotal, atpQty, DocLine } from "../../data/mock/sales";
import { useStore, nextId, downloadCsv, Entity } from "../../services/store";
import { nextDocCode } from "../../services/docNumber";
import PrintableDocument, { PrintDoc } from "../../components/print/PrintableDocument";
import { addVat, VAT_RATE } from "../../services/documentMath";
import { useModuleAuthz } from "../../services/authz";
import { runUserExits } from "../../services/userExit";

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
  const [printDoc, setPrintDoc] = useState<PrintDoc | null>(null);
  const authz = useModuleAuthz();
  const [form, setForm] = useState<{ customer: string; dueDate: string; lines: DocLine[] }>({
    customer: "", dueDate: "2026-08-01", lines: [],
  });

  const order = orders.find((o) => o.id === sel);

  // 거래명세서 서식 — 수주 라인을 그대로 명세 항목으로 옮긴다
  const buildStatementDoc = (o: Entity): PrintDoc => {
    const lines = (o.lines ?? []) as DocLine[];
    const { supply, vat, total } = addVat(lines.reduce((s, l) => s + l.qty * l.price, 0));
    const cust = customers.find((c) => c.code === o.customer);
    return {
      title: "거 래 명 세 서",
      docNo: String(o.code),
      issuedAt: String(o.orderDate ?? "-"),
      counterpartyLabel: "공급받는자",
      counterparty: [
        { label: "고객코드", value: String(o.customer) },
        { label: "고객명", value: String(cust?.name ?? o.customer) },
        { label: "결제조건", value: String(cust?.payTerm ?? "-") },
        { label: "통화", value: String(cust?.currency ?? "KRW") },
      ],
      meta: [
        { label: "수주일", value: String(o.orderDate ?? "-") },
        { label: "납기일", value: String(o.dueDate ?? "-") },
        { label: "진행상태", value: String(o.status ?? "-") },
        { label: "품목 수", value: `${lines.length} 건` },
      ],
      columns: [
        { key: "no", label: "No", align: "center" },
        { key: "code", label: "품목코드" },
        { key: "name", label: "품목명" },
        { key: "qty", label: "수량", align: "right" },
        { key: "price", label: "단가", align: "right" },
        { key: "amount", label: "공급가액", align: "right" },
      ],
      rows: lines.map((l, i) => ({
        no: i + 1,
        code: l.material,
        name: mat(l.material)?.name ?? "-",
        qty: l.qty,
        price: l.price,
        amount: l.qty * l.price,
      })),
      totals: [
        { label: "공급가액", value: `${supply.toLocaleString()} 원` },
        { label: `부가세 (${VAT_RATE * 100}%)`, value: `${vat.toLocaleString()} 원` },
        { label: "합계금액", value: `${total.toLocaleString()} 원` },
      ],
      note: ["· 상기와 같이 거래 내역을 명세합니다.", "· 이의가 있는 경우 수령 후 7일 내 통보 바랍니다."].join(String.fromCharCode(10)),
      signatures: ["담당", "인수자"],
    };
  };
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

  const save = async () => {
    if (!form.customer) return alert("고객을 선택하세요.");
    if (form.lines.length === 0) return alert("품목 라인을 추가하세요.");
    // 여신한도 검사는 User Exit 으로 옮겼다 (표준 로직에서 고객 규칙을 분리).
    // 재무(fi) 조회 권한이 없는 사용자에게는 Exit 이 바이패스된다.
    const cust = customers.find((c) => c.code === form.customer);
    const total = docTotal(form.lines);
    const exits = runUserExits(
      "sd.order.beforeSave",
      {
        user: authz.user,
        document: { customer: form.customer, total, lineCount: form.lines.length },
        extra: { creditLimit: Number(cust?.creditLimit) || 0, creditUsed: Number(cust?.creditUsed) || 0 },
      },
      authz.can
    );
    if (!exits.ok) return alert(`User Exit 검증 실패 — 저장을 중단했습니다.\n\n${exits.messages.join("\n")}`);
    if (exits.messages.length > 0 && !confirm(`${exits.messages.join("\n")}\n\n계속 등록할까요?`)) return;
    if (exits.bypassed.length > 0) {
      console.warn("[User Exit] 권한 미충족으로 바이패스:", exits.bypassed);
    }
    // ATP 부족 경고
    const shortage = form.lines.filter((l) => atp(l.material) < l.qty);
    if (shortage.length > 0) {
      if (!confirm(`⚠️ ATP 부족 품목 ${shortage.length}건: ${shortage.map((l) => l.material).join(", ")}.\n납기 재협의 또는 생산계획 반영이 필요합니다. 등록할까요?`)) return;
    }
    const code = await nextDocCode("SO", orders.map((x) => String(x.code)));
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
          <button
            onClick={() => { setCreating(true); addLine(); }}
            disabled={!authz.canEditHere}
            title={authz.canEditHere ? "" : "영업 모듈 편집 권한이 없습니다."}
            className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ＋ 수주 등록
          </button>
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
                  <button
                    onClick={() => setPrintDoc(buildStatementDoc(order))}
                    title="거래명세서를 인쇄합니다. 인쇄 대화상자에서 PDF로 저장할 수 있습니다."
                    className="px-3 py-1 rounded border border-line text-[11px] font-semibold hover:bg-accent-soft"
                  >
                    🖨 거래명세서
                  </button>
                  {order.status === "등록" && (
                    <>
                      <button
                        onClick={reserve}
                        disabled={!authz.canApproveHere}
                        title={authz.canApproveHere ? "" : "출하예약은 승인 권한이 필요합니다."}
                        className="px-3 py-1 rounded bg-blue-600 text-white text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        🚚 출하예약
                      </button>
                      <button
                        onClick={cancel}
                        disabled={!authz.canApproveHere}
                        title={authz.canApproveHere ? "" : "수주 취소는 승인 권한이 필요합니다."}
                        className="px-3 py-1 rounded border border-line text-[11px] text-red-500 hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        취소
                      </button>
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
      <PrintableDocument doc={printDoc} onDone={() => setPrintDoc(null)} />
    </div>
  );
}
