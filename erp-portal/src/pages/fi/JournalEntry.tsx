// FI-001 전표관리 — 차대평형 검증, 전기, 물류 거래 자동 동기화
import { useState } from "react";
import { salesOrderStore, docTotal, DocLine } from "../../data/mock/sales";
import { poStore } from "../../data/mock/procurement";
import { journalStore, jvBalanced, ACCOUNTS, JLine } from "../../data/mock/finance";
import { useStore, nextId, downloadCsv } from "../../services/store";

const TODAY = "2026-07-03";

const STATUS_STYLE: Record<string, string> = {
  작성: "bg-amber-100 text-amber-700",
  전기: "bg-emerald-100 text-emerald-700",
};

export default function JournalEntry() {
  const jvs = useStore(journalStore);
  const sos = useStore(salesOrderStore);
  const pos = useStore(poStore);
  const [creating, setCreating] = useState(false);
  const [desc, setDesc] = useState("");
  const [lines, setLines] = useState<JLine[]>([
    { account: "보통예금", dr: 0, cr: 0 },
    { account: "제품매출", dr: 0, cr: 0 },
  ]);

  // 미전표 물류 거래
  const unbookedSo = sos.filter((o) => o.status === "출하완료" && !jvs.some((j) => j.ref === o.code));
  const unbookedPo = pos.filter((o) => o.status === "입고완료" && !jvs.some((j) => j.ref === o.code));

  const sync = () => {
    if (unbookedSo.length + unbookedPo.length === 0) return alert("동기화할 거래가 없습니다.");
    unbookedSo.forEach((o) => {
      const amt = docTotal(o.lines as DocLine[]);
      const code = nextId("JV");
      journalStore.create({
        id: code, code, date: TODAY, desc: `매출 인식 (${o.customer})`, ref: o.code, status: "작성",
        lines: [
          { account: "외상매출금", dr: amt, cr: 0 },
          { account: "제품매출", dr: 0, cr: amt },
        ] as JLine[],
      });
    });
    unbookedPo.forEach((o) => {
      const amt = o.qty * o.price;
      const code = nextId("JV");
      journalStore.create({
        id: code, code, date: TODAY, desc: `원재료 매입 (${o.vendor})`, ref: o.code, status: "작성",
        lines: [
          { account: "원재료", dr: amt, cr: 0 },
          { account: "외상매입금", dr: 0, cr: amt },
        ] as JLine[],
      });
    });
  };

  const setLine = (i: number, patch: Partial<JLine>) =>
    setLines((p) => p.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const bal = jvBalanced(lines);

  const save = () => {
    if (!desc.trim()) return alert("적요를 입력하세요.");
    if (!bal.ok) return alert(`차대 불일치: 차변 ${bal.dr.toLocaleString()} / 대변 ${bal.cr.toLocaleString()}`);
    const code = nextId("JV");
    journalStore.create({ id: code, code, date: TODAY, desc, ref: "-", status: "작성", lines });
    setCreating(false);
    setDesc("");
    setLines([{ account: "보통예금", dr: 0, cr: 0 }, { account: "제품매출", dr: 0, cr: 0 }]);
  };

  const post = (id: string) => journalStore.update(id, { status: "전기" });

  const excel = () =>
    downloadCsv("전표목록.csv", ["전표번호", "일자", "적요", "참조", "차변합계", "상태"],
      jvs.map((j) => [j.code, j.date, j.desc, j.ref, jvBalanced(j.lines).dr, j.status]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. 재무회계 (Financial)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">전표관리 (FI-001)</h1>
          <span className="text-[11px] text-sub">차대평형 검증 · 물류거래 자동 전표</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3">
        <span className="text-[11px] text-sub">{jvs.length}건</span>
        {unbookedSo.length + unbookedPo.length > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
            미전표 거래 {unbookedSo.length + unbookedPo.length}건 (출하 {unbookedSo.length} / 입고 {unbookedPo.length})
          </span>
        )}
        <div className="ml-auto flex gap-1">
          <button onClick={sync} className="px-3 py-1.5 rounded bg-blue-600 text-white text-[12px] font-semibold">↻ 거래 동기화</button>
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 수동 전표</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">전표번호</th>
              <th className="px-3 py-2">일자</th>
              <th className="px-3 py-2">적요</th>
              <th className="px-3 py-2">분개</th>
              <th className="px-3 py-2 text-right">금액(원)</th>
              <th className="px-3 py-2">참조</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {jvs.map((j) => (
              <tr key={j.id} className="border-b border-line last:border-0 hover:bg-accent-soft align-top">
                <td className="px-3 py-2 font-mono">{j.code}</td>
                <td className="px-3 py-2 text-sub">{j.date}</td>
                <td className="px-3 py-2">{j.desc}</td>
                <td className="px-3 py-2 text-[11px]">
                  {(j.lines as JLine[]).map((l, i) => (
                    <div key={i} className={l.dr > 0 ? "" : "pl-4 text-sub"}>
                      {l.dr > 0 ? `(차) ${l.account}` : `(대) ${l.account}`}
                    </div>
                  ))}
                </td>
                <td className="px-3 py-2 text-right">{jvBalanced(j.lines).dr.toLocaleString()}</td>
                <td className="px-3 py-2 font-mono text-sub">{j.ref}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[j.status] ?? ""}`}>{j.status}</span>
                </td>
                <td className="px-3 py-2">
                  {j.status === "작성" && (
                    <button onClick={() => post(j.id)} className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">✓ 전기</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[560px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">수동 전표 생성</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                적요
                <input value={desc} onChange={(e) => setDesc(e.target.value)}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
              </label>
              {lines.map((l, i) => (
                <div key={i} className="flex items-end gap-2">
                  <label className="text-[11px] text-sub flex-1">
                    계정과목
                    <select value={l.account} onChange={(e) => setLine(i, { account: e.target.value })}
                      className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                      {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] text-sub">
                    차변
                    <input type="number" value={l.dr} onChange={(e) => setLine(i, { dr: Number(e.target.value), cr: 0 })}
                      className="block w-32 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                  </label>
                  <label className="text-[11px] text-sub">
                    대변
                    <input type="number" value={l.cr} onChange={(e) => setLine(i, { cr: Number(e.target.value), dr: 0 })}
                      className="block w-32 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                  </label>
                  <button onClick={() => setLines((p) => p.filter((_, j) => j !== i))} className="px-2 py-1.5 text-red-500 text-[12px]">✕</button>
                </div>
              ))}
              <button onClick={() => setLines((p) => [...p, { account: "보통예금", dr: 0, cr: 0 }])}
                className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">＋ 분개 라인</button>
              <div className={`text-[12px] p-2 rounded font-semibold ${bal.ok ? "bg-accent-soft" : "bg-red-100 text-red-700"}`}>
                차변 {bal.dr.toLocaleString()} / 대변 {bal.cr.toLocaleString()} {bal.ok ? "✓ 평형" : "✗ 불일치"}
              </div>
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
