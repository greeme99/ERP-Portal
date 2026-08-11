// MDM-11 조직 마스터 — 본부/팀/파트 계층과 소속 인원 기준정보
import MasterCrudPage from "../../components/common/MasterCrudPage";
import { orgStore } from "../../data/mock/master";
import { nextId } from "../../services/store";

export default function OrgMaster() {
  return (
    <MasterCrudPage
      moduleLabel="12. 기준정보 (Master Data)"
      title="조직마스터"
      store={orgStore}
      searchKeys={["code", "name", "head"]}
      newRow={() => ({ id: nextId("ORG"), code: "", name: "", orgType: "팀", parentCode: "", company: "(주)헤르메스 전자", head: "", headcount: 0, status: "운영중" })}
      fields={[
        { key: "code", label: "조직코드", required: true },
        { key: "name", label: "조직명", required: true },
        { key: "orgType", label: "조직유형", type: "select", options: ["본부", "팀", "파트"] },
        { key: "parentCode", label: "상위조직" },
        { key: "company", label: "소속법인" },
        { key: "head", label: "조직장" },
        { key: "headcount", label: "인원수", type: "number", align: "right" },
        {
          key: "status", label: "상태", type: "select", options: ["운영중", "신설예정", "폐지"],
          render: (r) => (
            <span className={r.status === "운영중" ? "text-emerald-500 font-semibold" : "text-amber-500 font-semibold"}>{r.status}</span>
          ),
        },
      ]}
    />
  );
}
