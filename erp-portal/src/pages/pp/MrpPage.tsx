// PP-002 MRP — MPS 기반 BOM 전개, 부족자재 산출, PR/WO 연계
import { materialStore, bomStore } from "../../data/mock/master";
import { mpsStore, woStore, explodeBom } from "../../data/mock/production";
import { prStore } from "../../data/mock/procurement";
import { useStore, nextId } from "../../services/store";

const TODAY = "2026-07-03";

export default function MrpPage() {
  const plans = useStore(mpsStore);
  const boms = useStore(bomStore);
  const mats = useStore(materialStore);
  const prs = useStore(prStore);
  const wos = useStore(woStore);

  // MPS 전량 BOM 전개
  const req: Record<string, number> = {};
  plans.forEach((p) => explodeBom(p.material, p.plan, boms, req));

  const rows = Object.entries(req).map(([code, qty]) => {
    const mat = mats.find((m) => m.code === code);
    const stock = mat?.stock ?? 0;
    const safety = mat?.safety ?? 0;
    const shortage = Math.max(0, qty + safety - stock);
    return { code, name: mat?.name ?? "", type: mat?.type ?? "", uom: mat?.uom ?? "", req: qty, stock, safety, shortage };
  }).sort((a, b) => b.shortage - a.shortage);

  const hasPr = (code: string) => prs.some((p) => p.material === code && (p.status === "승인대기" || p.status === "승인"));
  const hasWo = (code: string) => wos.some((w) => w.material === code && w.status !== "완료");

  const createPr = (r: typeof rows[0]) => {
    const mat = mats.find((m) => m.code === r.code);
    const code = nextId("PR");
    prStore.create({
      id: code, code, dept: "생산팀", material: r.code, qty: Math.ceil(r.shortage),
      amount: Math.ceil(r.shortage) * (mat?.price ?? 0), reqDate: TODAY,
      dueDate: "2026-07-25", status: "승인대기",
    });
    alert(`${code} 생성 완료 (구매요청 화면에서 승인 처리)`);
  };

  const createWo = (r: typeof rows[0]) => {
    const code = nextId("WO");
    woStore.create({
      id: code, code, material: r.code, qty: Math.ceil(r.shortage),
      startDate: TODAY, dueDate: "2026-07-20", status: "계획", good: 0, defect: 0,
    });
    alert(`${code} 작업지시 생성 완료`);
  };

  const shortCount = rows.filter((r) => r.shortage > 0).length;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. 생산관리 (Production)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">MRP 자재소요계획 (PP-002)</h1>
          <span className="text-[11px] text-sub">MPS {plans.reduce((s, p) => s + p.plan, 0).toLocaleString()} EA 기준 BOM 전개</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3 text-[12px]">
        <span>전개 자재 <b>{rows.length}</b>종</span>
        <span className={shortCount > 0 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>
          부족 {shortCount}종
        </span>
        <span className="text-[11px] text-sub ml-auto">부족량 = 총소요 + 안전재고 − 현재고 | 원자재→PR, 반제품→작업지시</span>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">자재</th>
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2 text-right">총소요</th>
              <th className="px-3 py-2 text-right">현재고</th>
              <th className="px-3 py-2 text-right">안전재고</th>
              <th className="px-3 py-2 text-right">부족량</th>
              <th className="px-3 py-2">조치</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2">{r.code} — {r.name}</td>
                <td className="px-3 py-2 text-sub">{r.type}</td>
                <td className="px-3 py-2 text-right">{Math.ceil(r.req).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.stock.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-sub">{r.safety.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right font-bold ${r.shortage > 0 ? "text-red-500" : "text-emerald-500"}`}>
                  {r.shortage > 0 ? Math.ceil(r.shortage).toLocaleString() : "충족 ✓"}
                </td>
                <td className="px-3 py-2">
                  {r.shortage > 0 && (r.type === "원자재" || r.type === "부자재") && (
                    hasPr(r.code)
                      ? <span className="text-[11px] text-sub">PR 진행중</span>
                      : <button onClick={() => createPr(r)} className="px-2 py-0.5 rounded bg-accent text-white text-[10px] font-semibold">🛒 PR 생성</button>
                  )}
                  {r.shortage > 0 && r.type === "반제품" && (
                    hasWo(r.code)
                      ? <span className="text-[11px] text-sub">WO 진행중</span>
                      : <button onClick={() => createWo(r)} className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-semibold">🏭 작업지시</button>
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
