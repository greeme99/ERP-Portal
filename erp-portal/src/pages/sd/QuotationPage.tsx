// SD-002 견적관리 — 생성/승인/이력
import { useState } from "react";
import { customerStore, materialStore } from "../../data/mock/master";
import { quotationStore, docTotal, DocLine } from "../../data/mock/sales";
import { Entity, useStore, nextId, downloadCsv } from "../../services/store";
import { nextDocCode } from "../../services/docNumber";

const STATUS_STYLE: Record<string, string> = {
  작성: "bg-amber-100 text-amber-700",
  승인: "bg-emerald-100 text-emerald-700",
  만료: "bg-red-100 text-red-700",
};

export default function QuotationPage() {
  const docs = useStore(quotationStore);
  const customers = useStore(customerStore);
  const mats = useStore(materialStore).filter((m) => m.type === "완제품");
  const [sel, setSel] = useState<string | null>(docs[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ customer: string; lines: DocLine[] }>({ customer: "", lines: [] });

  const doc = docs.find((d) => d.id === sel);
  const custName = (code: string) => customers.find((c) => c.code === code)?.name ?? code;
  const matName = (code: string) => mats.find((m) => m.code === code)?.name ?? code;

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { material: mats[0]?.code ?? "", qty: 100, price: mats[0]?.price ?? 0 }] }));
  const setLine = (i: number, patch: Partial<DocLine>) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  const save = async () => {
    if (!form.customer) return alert("고객을 선택하세요.");
    if (form.lines.length === 0) return alert("품목 라인을 추가하세요.");
    const code = await nextDocCode("QT", docs.map((x) => String(x.code)));
    const today = new Date().toISOString().slice(0, 10);
    quotationStore.create({
      id: code, code, customer: form.customer, date: today,
      validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: "작성", lines: form.lines,
    });
    setCreating(false);
    setForm({ customer: "", lines: [] });
    setSel(code);
  };

  const approve = () => doc && quotationStore.update(doc.id, { status: "승인" });
  const excel = () =>
    downloadCsv("견적목록.csv", ["견적번호", "고객", "견적일", "유효기간", "상태", "금액"],
      docs.map((d) => [d.code, custName(d.customer), d.date, d.validTo, d.status, docTotal(d.lines)]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">01. 영업관리 (Sales)</div>
        <h1 className="text-lg font-bold">견적관리 (SD-002)</h1>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-2">
        <span className="text-[11px] text-sub">{docs.length}건</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => { setCreating(true); addLine(); }} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 견적 생성</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* 목록 */}
        <div className="bg-panel border border-line rounded-lg overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-sub text-left">
                <th className="px-3 py-2">견적번호</th>
                <th className="px-3 py-2">고객</th>
                <th className="px-3 py-2">견적일</th>
                <th className="px-3 py-2 text-right">금액(원)</th>
                <th className="px-3 py-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} onClick={() => setSel(d.id)}
                  className={`border-b border-line last:border-0 cursor-pointer hover:bg-accent-soft ${sel === d.id ? "bg-accent-soft" : ""}`}>
                  <td className="px-3 py-2 font-mono">{d.code}</td>
                  <td className="px-3 py-2">{custName(d.customer)}</td>
                  <td className="px-3 py-2 text-sub">{d.date}</td>
                  <td className="px-3 py-2 text-right">{docTotal(d.lines).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[d.status] ?? ""}`}>{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 상세 */}
        <div className="bg-panel border border-line rounded-lg">
          {doc ? (
            <>
              <div className="px-4 py-2.5 border-b border-line flex items-center gap-2">
                <span className="font-semibold">{doc.code} 상세</span>
                <span className="text-[11px] text-sub">유효기간 ~{doc.validTo}</span>
                <div className="ml-auto flex gap-1">
                  {doc.status === "작성" && (
                    <button onClick={approve} className="px-3 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold">✓ 승인</button>
                  )}
                  <button onClick={() => alert("PDF 출력 (프로토타입)")} className="px-3 py-1 rounded border border-line text-[11px] hover:bg-accent-soft">🖨 PDF</button>
                </div>
              </div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-line text-sub text-left">
                    <th className="px-3 py-2">품목</th>
                    <th className="px-3 py-2 text-right">수량</th>
                    <th className="px-3 py-2 text-right">단가</th>
                    <th className="px-3 py-2 text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {(doc.lines as DocLine[]).map((l, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="px-3 py-2">{l.material} — {matName(l.material)}</td>
                      <td className="px-3 py-2 text-right">{l.qty.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{l.price.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{(l.qty * l.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2.5 border-t border-line text-right font-bold">
                합계 {docTotal(doc.lines).toLocaleString()}원
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-sub text-[12px]">견적을 선택하세요.</div>
          )}
        </div>
      </div>

      {/* 생성 모달 */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[620px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">견적 생성</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                고객 *
                <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}
                  className="block w-64 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {customers.filter((c) => c.status === "거래중").map((c) => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </label>
              {form.lines.map((l, i) => (
                <div key={i} className="flex items-end gap-2">
                  <label className="text-[11px] text-sub flex-1">
                    품목
                    <select value={l.material}
                      onChange={(e) => {
                        const m = mats.find((x) => x.code === e.target.value);
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
                  <button onClick={() => setForm((f) => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }))}
                    className="px-2 py-1.5 text-red-500 text-[12px]">✕</button>
                </div>
              ))}
              <button onClick={addLine} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">＋ 라인 추가</button>
              <div className="text-right font-bold">합계 {docTotal(form.lines).toLocaleString()}원</div>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
