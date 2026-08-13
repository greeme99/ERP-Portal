// PLM-003 ECO/ECR 설계변경 — 요청→승인→BOM 반영(Rev↑) / 반려
import { useState } from "react";
import { materialStore, bomStore } from "../../data/mock/master";
import { ecoStore, drawingStore, nextRev, CHANGE_TYPES, ECO_STATUS_STYLE } from "../../data/mock/pdm";
import { useStore, nextId, downloadCsv } from "../../services/store";
import { nextDocCode } from "../../services/docNumber";

const TODAY = "2026-07-03";

export default function EcoManagement() {
  const ecos = useStore(ecoStore);
  const boms = useStore(bomStore);
  const mats = useStore(materialStore);
  const drawings = useStore(drawingStore);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ parent: "", changeType: "수량변경", child: "", newChild: "", qty: 1, reason: "" });

  const parents = mats.filter((m) => m.type === "완제품" || m.type === "반제품");
  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;

  // 적용된 ECO 수 = 해당 품목의 Rev (A + n)
  const revOf = (parent: string) => {
    const n = ecos.filter((e) => e.parent === parent && e.status === "적용").length;
    return String.fromCharCode(65 + n); // 0→A, 1→B ...
  };

  const setStatus = (id: string, status: string) => ecoStore.update(id, { status });

  const approve = (e: any) => ecoStore.update(e.id, { status: "승인" });
  const reject = (e: any) => ecoStore.update(e.id, { status: "반려" });

  // 승인 → 적용: BOM 실제 반영 + 연계 도면 Rev↑
  const apply = (e: any) => {
    const applyMsg = `${e.code}를 BOM에 반영할까요?\n대상: ${e.parent} / ${e.changeType} / ${e.child}`;
    if (!confirm(applyMsg)) return;
    const line = boms.find((b) => b.parent === e.parent && b.child === e.child);
    if (e.changeType === "자재추가") {
      if (line) return alert("이미 존재하는 구성품입니다.");
      bomStore.create({ id: nextId("B"), parent: e.parent, child: e.child, qty: e.qty, uom: mats.find((m) => m.code === e.child)?.uom ?? "EA" });
    } else if (e.changeType === "자재삭제") {
      if (!line) return alert("대상 구성품이 BOM에 없습니다.");
      bomStore.remove([line.id]);
    } else if (e.changeType === "수량변경") {
      if (!line) return alert("대상 구성품이 BOM에 없습니다.");
      bomStore.update(line.id, { qty: e.qty });
    } else if (e.changeType === "자재대체") {
      if (!line) return alert("대상 구성품이 BOM에 없습니다.");
      if (!e.newChild) return alert("대체 품목이 지정되지 않았습니다.");
      bomStore.remove([line.id]);
      bomStore.create({ id: nextId("B"), parent: e.parent, child: e.newChild, qty: e.qty, uom: mats.find((m) => m.code === e.newChild)?.uom ?? "EA" });
    }
    ecoStore.update(e.id, { status: "적용", effectiveDate: TODAY });
    // 연계 도면 Rev 자동 개정
    const dwg = drawings.find((d) => d.material === e.parent && d.status === "승인");
    if (dwg) drawingStore.update(dwg.id, { rev: nextRev(dwg.rev), eco: e.code, date: TODAY });
    alert(`✅ ${e.code} 적용 완료 — ${e.parent} BOM 반영, 도면 Rev 개정`);
  };

  const save = async () => {
    if (!form.parent) return alert("대상 상위품목을 선택하세요.");
    if (!form.child) return alert("대상 구성품을 선택하세요.");
    if (form.changeType === "자재대체" && !form.newChild) return alert("대체 품목을 선택하세요.");
    const code = await nextDocCode("ECO", ecoStore.getAll().map((x) => String(x.code)));
    ecoStore.create({
      id: code, code, parent: form.parent, changeType: form.changeType, child: form.child,
      newChild: form.newChild, qty: form.qty, reason: form.reason, requester: "연구소",
      date: TODAY, status: "요청", effectiveDate: "",
    });
    setCreating(false);
    setForm({ parent: "", changeType: "수량변경", child: "", newChild: "", qty: 1, reason: "" });
  };

  const excel = () =>
    downloadCsv("설계변경.csv", ["ECO번호", "대상품목", "변경유형", "구성품", "수량", "사유", "상태", "발효일"],
      ecos.map((e) => [e.code, e.parent, e.changeType, e.child, e.qty, e.reason, e.status, e.effectiveDate]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. 연구개발 (Engineering / PLM)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">ECO / ECR 설계변경 (PLM-003)</h1>
          <span className="text-[11px] text-sub">요청→승인→BOM 반영 · Rev 자동 개정</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-2">
        <span className="text-[11px] text-sub">{ecos.length}건</span>
        {ecos.some((e) => e.status === "승인") && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
            적용 대기 {ecos.filter((e) => e.status === "승인").length}건
          </span>
        )}
        <div className="ml-auto flex gap-1">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 변경요청(ECR)</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">ECO번호</th>
              <th className="px-3 py-2">대상품목 (Rev)</th>
              <th className="px-3 py-2">변경유형</th>
              <th className="px-3 py-2">구성품</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2">사유</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody>
            {ecos.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0 hover:bg-accent-soft align-top">
                <td className="px-3 py-2 font-mono">{e.code}</td>
                <td className="px-3 py-2">{e.parent}<span className="ml-1 px-1.5 py-0.5 rounded bg-accent-soft text-accent text-[10px] font-bold">Rev {revOf(e.parent)}</span></td>
                <td className="px-3 py-2">{e.changeType}</td>
                <td className="px-3 py-2">
                  {e.child}{e.changeType === "자재대체" && e.newChild && <span className="text-sub"> → {e.newChild}</span>}
                </td>
                <td className="px-3 py-2 text-right">{e.qty}</td>
                <td className="px-3 py-2 max-w-[180px] text-sub">{e.reason}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ECO_STATUS_STYLE[e.status] ?? ""}`}>{e.status}</span>
                </td>
                <td className="px-3 py-2">
                  {e.status === "요청" && (
                    <div className="flex gap-1">
                      <button onClick={() => approve(e)} className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-semibold">승인</button>
                      <button onClick={() => reject(e)} className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-semibold">반려</button>
                    </div>
                  )}
                  {e.status === "승인" && (
                    <button onClick={() => apply(e)} className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">▶ BOM 반영</button>
                  )}
                  {e.status === "적용" && <span className="text-[11px] text-sub">{e.effectiveDate}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">설계변경 요청 (ECR)</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                대상 상위품목
                <select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value, child: "" })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {parents.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="text-[11px] text-sub flex-1">
                  변경유형
                  <select value={form.changeType} onChange={(e) => setForm({ ...form, changeType: e.target.value })}
                    className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                    {CHANGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-sub">
                  수량
                  <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                    className="block w-24 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
              </div>
              <label className="text-[11px] text-sub block">
                구성품 {form.changeType === "자재추가" ? "(추가할 품목)" : "(대상 품목)"}
                <select value={form.child} onChange={(e) => setForm({ ...form, child: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {mats.filter((m) => m.code !== form.parent).map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
                </select>
              </label>
              {form.changeType === "자재대체" && (
                <label className="text-[11px] text-sub block">
                  대체 품목 (새 구성품)
                  <select value={form.newChild} onChange={(e) => setForm({ ...form, newChild: e.target.value })}
                    className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                    <option value="">선택</option>
                    {mats.filter((m) => m.code !== form.parent).map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
                  </select>
                </label>
              )}
              <label className="text-[11px] text-sub block">
                변경 사유
                <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
              </label>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 상신</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
