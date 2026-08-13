// MM-002 구매발주(PO) — 승인 PR 연계, 공급사 배정, 납기 관리
import { useState } from "react";
import { materialStore, partnerStore } from "../../data/mock/master";
import { prStore, poStore } from "../../data/mock/procurement";
import { useStore, nextId, downloadCsv, Entity } from "../../services/store";
import { nextDocCode } from "../../services/docNumber";
import PrintableDocument, { PrintDoc } from "../../components/print/PrintableDocument";
import { addVat, VAT_RATE } from "../../services/documentMath";

const TODAY = "2026-07-03";

const STATUS_STYLE: Record<string, string> = {
  발주: "bg-blue-100 text-blue-700",
  입고완료: "bg-emerald-100 text-emerald-700",
  취소: "bg-red-100 text-red-700",
};

export default function PurchaseOrder() {
  const pos = useStore(poStore);
  const prs = useStore(prStore);
  const vendors = useStore(partnerStore).filter((p) => p.type === "공급사");
  const mats = useStore(materialStore);
  const [creating, setCreating] = useState(false);
  const [printDoc, setPrintDoc] = useState<PrintDoc | null>(null);
  const [form, setForm] = useState({ pr: "", vendor: "", material: "", qty: 1000, price: 0, dueDate: "2026-07-31" });

  // PO 미생성 승인 PR
  const openPrs = prs.filter((p) => p.status === "승인" && !pos.some((o) => o.pr === p.code));

  const pickPr = (code: string) => {
    const pr = prs.find((p) => p.code === code);
    if (!pr) return setForm({ ...form, pr: "" });
    const mat = mats.find((m) => m.code === pr.material);
    setForm({ ...form, pr: code, material: pr.material, qty: pr.qty, price: mat?.price ?? 0, dueDate: pr.dueDate });
  };

  const save = async () => {
    if (!form.vendor) return alert("공급사를 배정하세요.");
    if (!form.material) return alert("품목을 선택하세요.");
    const code = await nextDocCode("PO", pos.map((x) => String(x.code)));
    poStore.create({
      id: code, code, pr: form.pr || "-", vendor: form.vendor, material: form.material,
      qty: form.qty, price: form.price, orderDate: TODAY, dueDate: form.dueDate, status: "발주",
    });
    setCreating(false);
    setForm({ pr: "", vendor: "", material: "", qty: 1000, price: 0, dueDate: "2026-07-31" });
  };

  const isLate = (o: any) => o.status === "발주" && o.dueDate < TODAY;

  const excel = () =>
    downloadCsv("구매발주.csv", ["PO번호", "PR참조", "공급사", "품목", "수량", "단가", "발주일", "납기일", "상태"],
      pos.map((o) => [o.code, o.pr, o.vendor, o.material, o.qty, o.price, o.orderDate, o.dueDate, o.status]));

  // 구매발주서 서식 — 부가세 10% 별도 표기
  const buildPoDoc = (o: Entity): PrintDoc => {
    const vendor = vendors.find((v) => v.code === o.vendor);
    const mat = mats.find((m) => m.code === o.material);
    const { supply, vat, total } = addVat(o.qty * o.price);
    return {
      title: "구 매 발 주 서",
      docNo: String(o.code),
      issuedAt: String(o.orderDate ?? TODAY),
      counterpartyLabel: "수신 (공급사)",
      counterparty: [
        { label: "공급사코드", value: String(o.vendor) },
        { label: "공급사명", value: String(vendor?.name ?? o.vendor) },
        { label: "결제조건", value: String(vendor?.payTerm ?? "-") },
        { label: "통화", value: String(vendor?.currency ?? "KRW") },
      ],
      meta: [
        { label: "발주일", value: String(o.orderDate ?? "-") },
        { label: "납기일", value: String(o.dueDate ?? "-") },
        { label: "연계 PR", value: String(o.pr ?? "-") },
        { label: "진행상태", value: String(o.status ?? "-") },
      ],
      columns: [
        { key: "no", label: "No", align: "center" },
        { key: "code", label: "품목코드" },
        { key: "name", label: "품목명" },
        { key: "uom", label: "단위", align: "center" },
        { key: "qty", label: "수량", align: "right" },
        { key: "price", label: "단가", align: "right" },
        { key: "amount", label: "공급가액", align: "right" },
      ],
      rows: [
        {
          no: 1,
          code: String(o.material),
          name: String(mat?.name ?? "-"),
          uom: String(mat?.uom ?? "EA"),
          qty: o.qty,
          price: o.price,
          amount: supply,
        },
      ],
      totals: [
        { label: "공급가액", value: `${supply.toLocaleString()} 원` },
        { label: `부가세 (${VAT_RATE * 100}%)`, value: `${vat.toLocaleString()} 원` },
        { label: "합계금액", value: `${total.toLocaleString()} 원` },
      ],
      note: [
        "· 납기 준수를 요청드리며, 납기 변경이 필요한 경우 사전 통보 바랍니다.",
        "· 입고 시 본 발주번호를 거래명세서에 기재해 주십시오.",
      ].join("\n"),
      signatures: ["담당", "검토", "승인"],
    };
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">03. 구매관리 (Procurement)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">구매발주 PO (MM-002)</h1>
          <span className="text-[11px] text-sub">승인 PR 연계 · 공급사 배정 · 납기 관리</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3">
        <span className="text-[11px] text-sub">{pos.length}건</span>
        {openPrs.length > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">
            발주 대기 PR {openPrs.length}건
          </span>
        )}
        {pos.some(isLate) && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
            납기 지연 {pos.filter(isLate).length}건
          </span>
        )}
        <div className="ml-auto flex gap-1">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 발주 생성</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">PO번호</th>
              <th className="px-3 py-2">PR참조</th>
              <th className="px-3 py-2">공급사</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2 text-right">금액(원)</th>
              <th className="px-3 py-2">납기일</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">서식</th>
            </tr>
          </thead>
          <tbody>
            {pos.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{o.code}</td>
                <td className="px-3 py-2 font-mono text-sub">{o.pr}</td>
                <td className="px-3 py-2">{vendors.find((v) => v.code === o.vendor)?.name ?? o.vendor}</td>
                <td className="px-3 py-2">{o.material}</td>
                <td className="px-3 py-2 text-right">{o.qty.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{(o.qty * o.price).toLocaleString()}</td>
                <td className={`px-3 py-2 ${isLate(o) ? "text-red-500 font-bold" : "text-sub"}`}>
                  {o.dueDate}{isLate(o) && " ⚠️지연"}
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[o.status] ?? ""}`}>{o.status}</span>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setPrintDoc(buildPoDoc(o))}
                    title="구매발주서를 인쇄합니다. 인쇄 대화상자에서 PDF로 저장할 수 있습니다."
                    className="px-2 py-0.5 rounded border border-line text-[10px] font-semibold hover:bg-accent-soft"
                  >
                    🖨 발주서
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[460px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">발주 생성</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                승인 PR 참조 (선택)
                <select value={form.pr} onChange={(e) => pickPr(e.target.value)}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">직접 발주</option>
                  {openPrs.map((p) => (
                    <option key={p.code} value={p.code}>{p.code} — {p.material} {p.qty.toLocaleString()}개 ({p.dept})</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] text-sub block">
                공급사 배정 *
                <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {vendors.map((v) => <option key={v.code} value={v.code}>{v.code} — {v.name}</option>)}
                </select>
              </label>
              <label className="text-[11px] text-sub block">
                품목
                <select value={form.material} disabled={!!form.pr}
                  onChange={(e) => {
                    const m = mats.find((x) => x.code === e.target.value);
                    setForm({ ...form, material: e.target.value, price: m?.price ?? 0 });
                  }}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink disabled:opacity-60">
                  <option value="">선택</option>
                  {mats.filter((m) => m.type === "원자재" || m.type === "부자재").map((m) => (
                    <option key={m.code} value={m.code}>{m.code} — {m.name}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="text-[11px] text-sub">
                  수량
                  <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                    className="block w-24 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
                <label className="text-[11px] text-sub">
                  단가(원)
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="block w-28 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
                <label className="text-[11px] text-sub">
                  납기일
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="block mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
              </div>
              <div className="text-right font-bold text-[12px]">발주금액 {(form.qty * form.price).toLocaleString()}원</div>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 발주</button>
            </div>
          </div>
        </div>
      )}
      <PrintableDocument doc={printDoc} onDone={() => setPrintDoc(null)} />
    </div>
  );
}
