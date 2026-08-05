import MasterCrudPage from "../../components/common/MasterCrudPage";
import { warehouseStore } from "../../data/mock/master";
import { nextId } from "../../services/store";

export default function WarehouseMaster() {
  return (
    <MasterCrudPage
      moduleLabel="12. 기준정보 (Master Data)"
      title="창고마스터"
      store={warehouseStore}
      newRow={() => ({ id: nextId("WH"), code: "", name: "", plant: "수원공장", type: "완제품", status: "사용" })}
      fields={[
        { key: "code", label: "창고코드", required: true },
        { key: "name", label: "창고명", required: true },
        { key: "plant", label: "공장/거점", type: "select", options: ["수원공장", "이천물류", "해외법인"] },
        { key: "type", label: "창고유형", type: "select", options: ["완제품", "반제품", "원자재", "부자재", "반품"] },
        {
          key: "status", label: "상태", type: "select", options: ["사용", "중지"],
          render: (r) => (
            <span className={r.status === "사용" ? "text-emerald-500 font-semibold" : "text-red-500 font-semibold"}>{r.status}</span>
          ),
        },
      ]}
    />
  );
}
