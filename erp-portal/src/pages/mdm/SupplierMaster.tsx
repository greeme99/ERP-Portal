// MDM-04 공급사 마스터 — 조달 조건(리드타임·MOQ·품질등급) 기준정보
import MasterCrudPage from "../../components/common/MasterCrudPage";
import { supplierStore, partnerStore } from "../../data/mock/master";
import { Entity, nextId } from "../../services/store";

// MDM-03 거래처 마스터에 공급사로 등록된 코드만 조달 조건을 가질 수 있다.
// 거래처는 사업자 정보의 원본이고 여기는 조달 조건만 다루므로, 고아 데이터를 막는다.
const validateAgainstPartner = (row: Entity): string | null => {
  const code = String(row.code ?? "").trim();
  const partner = partnerStore.getAll().find((p) => String(p.code ?? "") === code);
  if (!partner) return `공급사코드 "${code}"가 거래처마스터(MDM-03)에 없습니다. 거래처를 먼저 등록하세요.`;
  if (partner.type !== "공급사") return `공급사코드 "${code}"는 거래처마스터에서 "${partner.type}"으로 등록되어 있습니다.`;
  return null;
};

export default function SupplierMaster() {
  return (
    <MasterCrudPage
      moduleLabel="12. 기준정보 (Master Data)"
      title="공급사마스터"
      store={supplierStore}
      validateRow={validateAgainstPartner}
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
