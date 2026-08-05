// COM-001 사용자관리 — CRUD (역할·상태)
import MasterCrudPage from "../../components/common/MasterCrudPage";
import { userStore, ROLES } from "../../data/mock/platform";
import { nextId, Entity } from "../../services/store";

export default function UserManagement() {
  return (
    <MasterCrudPage
      moduleLabel="13. 공통/플랫폼 (Platform)"
      title="사용자관리 (COM-001)"
      store={userStore}
      searchKeys={["code", "name", "dept", "email"]}
      newRow={() => ({ id: nextId("U"), code: "", name: "", dept: "", role: "영업", email: "", status: "활성" })}
      fields={[
        { key: "code", label: "사번", required: true },
        { key: "name", label: "이름", required: true },
        { key: "dept", label: "부서" },
        { key: "role", label: "역할", type: "select", options: ROLES },
        { key: "email", label: "이메일" },
        {
          key: "status", label: "상태", type: "select", options: ["활성", "비활성"],
          render: (r: Entity) => (
            <span className={r.status === "활성" ? "text-emerald-500 font-semibold" : "text-red-500 font-semibold"}>{r.status}</span>
          ),
        },
      ]}
    />
  );
}
