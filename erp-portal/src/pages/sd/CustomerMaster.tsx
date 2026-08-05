// SD-001 고객마스터 — 등급·신용한도 관리
import MasterCrudPage from "../../components/common/MasterCrudPage";
import { customerStore } from "../../data/mock/master";
import { nextId } from "../../services/store";

const GRADE_STYLE: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-700",
  B: "bg-amber-100 text-amber-700",
  C: "bg-red-100 text-red-700",
};

export default function CustomerMaster() {
  return (
    <MasterCrudPage
      moduleLabel="01. 영업관리 (Sales)"
      title="고객마스터 (SD-001)"
      store={customerStore}
      newRow={() => ({ id: nextId("CUST"), code: "", name: "", country: "KR", currency: "KRW", payTerm: "", grade: "B", creditLimit: 0, creditUsed: 0, status: "거래중" })}
      fields={[
        { key: "code", label: "고객코드", required: true },
        { key: "name", label: "고객명", required: true },
        { key: "country", label: "국가", type: "select", options: ["KR", "US", "DE", "CN", "JP", "VN"] },
        { key: "currency", label: "통화", type: "select", options: ["KRW", "USD", "EUR", "CNY", "JPY"] },
        { key: "payTerm", label: "결제조건" },
        {
          key: "grade", label: "등급", type: "select", options: ["A", "B", "C"],
          render: (r) => (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_STYLE[r.grade] ?? ""}`}>{r.grade}</span>
          ),
        },
        { key: "creditLimit", label: "신용한도(원)", type: "number", align: "right" },
        {
          key: "creditUsed", label: "여신사용률", type: "number", align: "right", hideInForm: false,
          render: (r) => {
            const pct = r.creditLimit > 0 ? Math.round((r.creditUsed / r.creditLimit) * 100) : 0;
            const color = pct >= 90 ? "text-red-500" : pct >= 70 ? "text-amber-500" : "text-emerald-500";
            return <span className={`font-semibold ${color}`}>{pct}%</span>;
          },
        },
        {
          key: "status", label: "상태", type: "select", options: ["거래중", "거래중지"],
          render: (r) => (
            <span className={r.status === "거래중" ? "text-emerald-500 font-semibold" : "text-red-500 font-semibold"}>{r.status}</span>
          ),
        },
      ]}
    />
  );
}
