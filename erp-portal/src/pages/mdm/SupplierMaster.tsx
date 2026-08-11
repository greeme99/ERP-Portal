// MDM-04 공급사 마스터 — 조달 조건(리드타임·MOQ·품질등급) 기준정보
import MasterCrudPage from "../../components/common/MasterCrudPage";
import { supplierStore } from "../../data/mock/master";
import { nextId } from "../../services/store";

export default function SupplierMaster() {
  return (
    <MasterCrudPage
      moduleLabel="12. 기준정보 (Master Data)"
      title="공급사마스터"
      store={supplierStore}
      searchKeys={["code", "name", "itemGroup"]}
      newRow={() => ({ id: nextId("V"), code: "", name: "", itemGroup: "", country: "KR", currency: "KRW", payTerm: "", leadTimeWeeks: 1, moq: 0, qualityGrade: "B", status: "거래중" })}
      fields={[
        { key: "code", label: "공급사코드", required: true },
        { key: "name", label: "공급사명", required: true },
        { key: "itemGroup", label: "공급품목군" },
        { key: "country", label: "국가", type: "select", options: ["KR", "CN", "VN", "US", "DE", "JP"] },
        { key: "currency", label: "통화", type: "select", options: ["KRW", "USD", "EUR", "JPY", "CNY"] },
        { key: "payTerm", label: "결제조건" },
        { key: "leadTimeWeeks", label: "리드타임(주)", type: "number", align: "right" },
        { key: "moq", label: "MOQ", type: "number", align: "right" },
        {
          key: "qualityGrade", label: "품질등급", type: "select", options: ["A", "B", "C"],
          render: (r) => (
            <span className={r.qualityGrade === "A" ? "text-emerald-500 font-semibold" : r.qualityGrade === "C" ? "text-red-500 font-semibold" : "font-semibold"}>{r.qualityGrade}</span>
          ),
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
