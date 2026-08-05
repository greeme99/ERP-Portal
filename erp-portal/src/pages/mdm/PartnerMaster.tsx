import MasterCrudPage from "../../components/common/MasterCrudPage";
import { partnerStore } from "../../data/mock/master";
import { nextId } from "../../services/store";

export default function PartnerMaster() {
  return (
    <MasterCrudPage
      moduleLabel="12. 기준정보 (Master Data)"
      title="거래처마스터"
      store={partnerStore}
      newRow={() => ({ id: nextId("PTN"), code: "", name: "", type: "고객", country: "KR", currency: "KRW", payTerm: "", status: "거래중" })}
      fields={[
        { key: "code", label: "거래처코드", required: true },
        { key: "name", label: "거래처명", required: true },
        {
          key: "type", label: "유형", type: "select", options: ["고객", "공급사"],
          render: (r) => (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.type === "고객" ? "bg-accent-soft text-accent" : "bg-amber-100 text-amber-700"}`}>{r.type}</span>
          ),
        },
        { key: "country", label: "국가", type: "select", options: ["KR", "US", "DE", "CN", "JP", "VN"] },
        { key: "currency", label: "통화", type: "select", options: ["KRW", "USD", "EUR", "CNY", "JPY"] },
        { key: "payTerm", label: "결제조건" },
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
