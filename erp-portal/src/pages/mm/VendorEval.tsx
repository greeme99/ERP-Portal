// MM-003 공급사 평가 — 품질·납기·가격·대응속도 가중 평가
import MasterCrudPage from "../../components/common/MasterCrudPage";
import { vendorEvalStore, evalTotal, evalGrade } from "../../data/mock/procurement";
import { nextId, Entity } from "../../services/store";

const GRADE_STYLE: Record<string, string> = {
  S: "bg-purple-100 text-purple-700",
  A: "bg-emerald-100 text-emerald-700",
  B: "bg-amber-100 text-amber-700",
  C: "bg-red-100 text-red-700",
};

const ScoreBar = ({ v }: { v: number }) => (
  <div className="flex items-center gap-1.5 min-w-[90px]">
    <div className="flex-1 h-1.5 bg-surface rounded">
      <div
        className={`h-1.5 rounded ${v >= 90 ? "bg-emerald-500" : v >= 75 ? "bg-blue-500" : "bg-red-500"}`}
        style={{ width: `${v}%` }}
      />
    </div>
    <span className="text-[11px] w-6 text-right">{v}</span>
  </div>
);

export default function VendorEval() {
  return (
    <MasterCrudPage
      moduleLabel="03. 구매관리 (Procurement)"
      title="공급사 평가 (MM-003)"
      store={vendorEvalStore}
      newRow={() => ({ id: nextId("VE"), code: "", name: "", quality: 80, delivery: 80, price: 80, response: 80 })}
      fields={[
        { key: "code", label: "공급사코드", required: true },
        { key: "name", label: "공급사명", required: true },
        { key: "quality", label: "품질(35%)", type: "number", render: (r: Entity) => <ScoreBar v={r.quality} /> },
        { key: "delivery", label: "납기(30%)", type: "number", render: (r: Entity) => <ScoreBar v={r.delivery} /> },
        { key: "price", label: "가격(20%)", type: "number", render: (r: Entity) => <ScoreBar v={r.price} /> },
        { key: "response", label: "대응(15%)", type: "number", render: (r: Entity) => <ScoreBar v={r.response} /> },
        {
          key: "total", label: "종합", hideInForm: true, align: "right",
          render: (r: Entity) => <b>{evalTotal(r as any)}</b>,
        },
        {
          key: "grade", label: "등급", hideInForm: true,
          render: (r: Entity) => {
            const g = evalGrade(evalTotal(r as any));
            return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_STYLE[g]}`}>{g}</span>;
          },
        },
      ]}
    />
  );
}
