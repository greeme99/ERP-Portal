// MDM-08 설비 마스터 — 작업장 배속 설비의 정격 CAPA·예방보전 주기 기준정보
import MasterCrudPage from "../../components/common/MasterCrudPage";
import { equipmentStore } from "../../data/mock/master";
import { nextId } from "../../services/store";

export default function EquipmentMaster() {
  return (
    <MasterCrudPage
      moduleLabel="12. 기준정보 (Master Data)"
      title="설비마스터"
      store={equipmentStore}
      searchKeys={["code", "name", "plant", "workCenter"]}
      newRow={() => ({ id: nextId("EQ"), code: "", name: "", type: "조립설비", plant: "", workCenter: "", acquiredAt: "", ratedCapacity: 0, pmCycleDays: 30, status: "정상" })}
      fields={[
        { key: "code", label: "설비코드", required: true },
        { key: "name", label: "설비명", required: true },
        { key: "type", label: "설비유형", type: "select", options: ["사출기", "SMT", "조립설비", "검사설비", "포장설비"] },
        { key: "plant", label: "소속공장" },
        { key: "workCenter", label: "작업장코드" },
        { key: "acquiredAt", label: "도입일", type: "date" },
        { key: "ratedCapacity", label: "정격CAPA(EA/일)", type: "number", align: "right" },
        { key: "pmCycleDays", label: "보전주기(일)", type: "number", align: "right" },
        {
          key: "status", label: "상태", type: "select", options: ["정상", "점검중", "고장", "폐기"],
          render: (r) => (
            <span className={r.status === "정상" ? "text-emerald-500 font-semibold" : r.status === "고장" ? "text-red-500 font-semibold" : "text-amber-500 font-semibold"}>{r.status}</span>
          ),
        },
      ]}
    />
  );
}
