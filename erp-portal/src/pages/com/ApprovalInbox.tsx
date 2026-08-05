// COM-004 전자결재 — PR/견적/ECO/S&OP 승인 대기 통합 결재함
import { Link } from "react-router-dom";
import { prStore, budgetStore } from "../../data/mock/procurement";
import { quotationStore, docTotal, DocLine } from "../../data/mock/sales";
import { ecoStore } from "../../data/mock/pdm";
import { sopStore } from "../../data/mock/scm";
import { useStore } from "../../services/store";

interface Item {
  key: string;
  type: string;
  code: string;
  title: string;
  requester: string;
  date: string;
  link: string;
  approve: () => void;
  reject?: () => void;
}

const TYPE_STYLE: Record<string, string> = {
  구매요청: "bg-amber-100 text-amber-700",
  견적: "bg-blue-100 text-blue-700",
  설계변경: "bg-purple-100 text-purple-700",
  "S&OP": "bg-emerald-100 text-emerald-700",
};

export default function ApprovalInbox() {
  const prs = useStore(prStore);
  const budgets = useStore(budgetStore);
  const quotes = useStore(quotationStore);
  const ecos = useStore(ecoStore);
  const sops = useStore(sopStore);

  const items: Item[] = [];

  // PR 승인대기
  prs.filter((p) => p.status === "승인대기").forEach((p) => {
    items.push({
      key: p.id, type: "구매요청", code: p.code, title: `${p.material} ${p.qty.toLocaleString()} (${p.amount.toLocaleString()}원)`,
      requester: p.dept, date: p.reqDate, link: "/m/mm/mm-04",
      approve: () => {
        prStore.update(p.id, { status: "승인" });
        const b = budgets.find((x) => x.dept === p.dept);
        if (b) budgetStore.update(b.id, { used: b.used + p.amount });
      },
      reject: () => prStore.update(p.id, { status: "반려" }),
    });
  });

  // 견적 작성 → 승인
  quotes.filter((q) => q.status === "작성").forEach((q) => {
    items.push({
      key: q.id, type: "견적", code: q.code, title: `${q.customer} ${docTotal(q.lines as DocLine[]).toLocaleString()}원`,
      requester: "영업", date: q.date, link: "/m/sd/sd-03",
      approve: () => quotationStore.update(q.id, { status: "승인" }),
    });
  });

  // ECO 요청 → 승인
  ecos.filter((e) => e.status === "요청").forEach((e) => {
    items.push({
      key: e.id, type: "설계변경", code: e.code, title: `${e.parent} ${e.changeType} (${e.child})`,
      requester: e.requester, date: e.date, link: "/m/plm/plm-03",
      approve: () => ecoStore.update(e.id, { status: "승인" }),
      reject: () => ecoStore.update(e.id, { status: "반려" }),
    });
  });

  // S&OP 검토중 → 합의완료
  sops.filter((s) => s.status === "검토중").forEach((s) => {
    items.push({
      key: s.id, type: "S&OP", code: s.id, title: `${s.month} 판매·운영계획 합의`,
      requester: "SCM", date: s.month, link: "/m/scm/scm-02",
      approve: () => sopStore.update(s.id, { status: "합의완료" }),
    });
  });

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">13. 공통/플랫폼 (Platform)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">전자결재 (COM-004)</h1>
          <span className="text-[11px] text-sub">모듈별 승인 대기 통합 결재함 · Workflow 허브</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 text-[12px]">
        <span>결재 대기 <b className={items.length > 0 ? "text-red-500" : "text-emerald-500"}>{items.length}</b>건</span>
        <span className="text-[11px] text-sub ml-3">구매요청·견적·설계변경(ECO)·S&OP 승인 요청을 한 곳에서 처리</span>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2">문서번호</th>
              <th className="px-3 py-2">내용</th>
              <th className="px-3 py-2">요청</th>
              <th className="px-3 py-2">일자</th>
              <th className="px-3 py-2">결재</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.key} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_STYLE[it.type] ?? ""}`}>{it.type}</span>
                </td>
                <td className="px-3 py-2 font-mono">
                  <Link to={it.link} className="hover:text-accent">{it.code}</Link>
                </td>
                <td className="px-3 py-2">{it.title}</td>
                <td className="px-3 py-2 text-sub">{it.requester}</td>
                <td className="px-3 py-2 text-sub">{it.date}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={it.approve} className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">✓ 승인</button>
                    {it.reject && (
                      <button onClick={it.reject} className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-semibold">✗ 반려</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="px-4 py-8 text-center text-emerald-500 text-[12px]">✓ 결재 대기 문서가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
