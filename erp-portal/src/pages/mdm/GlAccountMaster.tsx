// MDM-09 계정과목 마스터 — 전표 차대 판정 기준이 되는 GL 계정 체계
import MasterCrudPage from "../../components/common/MasterCrudPage";
import { glAccountStore } from "../../data/mock/master";
import { nextId } from "../../services/store";

export default function GlAccountMaster() {
  return (
    <MasterCrudPage
      moduleLabel="12. 기준정보 (Master Data)"
      title="계정과목마스터"
      store={glAccountStore}
      searchKeys={["code", "name", "category"]}
      newRow={() => ({ id: nextId("GL"), code: "", name: "", category: "자산", drcr: "차변", parentCode: "", useYn: "Y" })}
      fields={[
        { key: "code", label: "계정코드", required: true },
        { key: "name", label: "계정명", required: true },
        { key: "category", label: "계정분류", type: "select", options: ["자산", "부채", "자본", "수익", "비용"] },
        { key: "drcr", label: "차대구분", type: "select", options: ["차변", "대변"] },
        { key: "parentCode", label: "상위계정" },
        {
          key: "useYn", label: "사용여부", type: "select", options: ["Y", "N"],
          render: (r) => (
            <span className={r.useYn === "Y" ? "text-emerald-500 font-semibold" : "text-red-500 font-semibold"}>{r.useYn}</span>
          ),
        },
      ]}
    />
  );
}
