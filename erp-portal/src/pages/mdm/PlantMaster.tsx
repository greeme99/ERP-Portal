// MDM-07 공장 마스터 — 생산 거점별 라인 수·일 생산능력 기준정보
import MasterCrudPage from "../../components/common/MasterCrudPage";
import { plantStore } from "../../data/mock/master";
import { nextId } from "../../services/store";

export default function PlantMaster() {
  return (
    <MasterCrudPage
      moduleLabel="12. 기준정보 (Master Data)"
      title="공장마스터"
      store={plantStore}
      searchKeys={["code", "name", "region"]}
      newRow={() => ({ id: nextId("P"), code: "", name: "", region: "", address: "", manager: "", lineCount: 0, dailyCapacity: 0, status: "가동중" })}
      fields={[
        { key: "code", label: "공장코드", required: true },
        { key: "name", label: "공장명", required: true },
        { key: "region", label: "지역" },
        { key: "address", label: "소재지" },
        { key: "manager", label: "공장장" },
        { key: "lineCount", label: "가동라인수", type: "number", align: "right" },
        { key: "dailyCapacity", label: "일생산능력(EA)", type: "number", align: "right" },
        {
          key: "status", label: "상태", type: "select", options: ["가동중", "정지", "폐쇄"],
          render: (r) => (
            <span className={r.status === "가동중" ? "text-emerald-500 font-semibold" : "text-red-500 font-semibold"}>{r.status}</span>
          ),
        },
      ]}
    />
  );
}
