// COM-005 권한그룹마스터 (Role Master Management) — 전사 사용자 역할(Role) 및 메뉴별 읽기/쓰기 접근 권한 마스터
import { useState } from "react";
import { useStore, createStore, nextId } from "../../services/store";
import MassUpdateBar, { MassColumn } from "../../components/common/MassUpdateBar";

export interface RoleMasterItem {
  id: string;
  roleCode: string;
  roleName: string;
  moduleScope: string; // 접근 가능 모듈 (예: 전사 모듈, 구매자재+생산실행, 재무회계+관리회계)
  permissionLevel: "전권 관리자 (Full Access)" | "조회 및 승인 (Write/Approve)" | "조회 전용 (Read-Only)";
  assignedUserCount: number; // 할당된 사용자 수
  description: string;
}

export const roleMasterStore = createStore("com.role_master", [
  { id: "ROL-01", roleCode: "ROLE_ADMIN", roleName: "시스템 최고 관리자", moduleScope: "전사 12개 모듈 전체 (MDM/SD/MM/LE/PP/QM/SCM/FI/CO/PLM/SV/COM)", permissionLevel: "전권 관리자 (Full Access)", assignedUserCount: 3, description: "ERP 포털 및 시스템 환경설정 전체 제어" },
  { id: "ROL-02", roleCode: "ROLE_PURCHASE", roleName: "구매자재 담당자", moduleScope: "MM 구매자재, LE 물류실행, MDM 기준정보", permissionLevel: "조회 및 승인 (Write/Approve)", assignedUserCount: 12, description: "구매요청 PR, 발주 PO 및 자재 입고 정산 권한" },
  { id: "ROL-03", roleCode: "ROLE_PROD_MGR", roleName: "생산관리 팀장", moduleScope: "PP 생산계획, QM 품질관리, SCM 공급망관리", permissionLevel: "조회 및 승인 (Write/Approve)", assignedUserCount: 8, description: "작업지시 WO, 공정실행 및 품질 부적합 CAPA 권한" },
]);

export default function RoleMasterManagement() {
  const items = useStore(roleMasterStore) as RoleMasterItem[];
  const [levelFilter, setLevelFilter] = useState("전체");

  const filtered = items.filter((i) => levelFilter === "전체" || i.permissionLevel.includes(levelFilter));

  const totalUsers = filtered.reduce((acc, i) => acc + i.assignedUserCount, 0);

  // 기준정보 일괄 다운로드/업로드 컬럼
  const massColumns: MassColumn[] = [
    { key: "roleCode", label: "역할코드", required: true },
    { key: "roleName", label: "역할명", required: true },
    { key: "moduleScope", label: "접근모듈" },
    { key: "permissionLevel", label: "권한수준", type: "select", options: ["전권 관리자 (Full Access)", "조회 및 승인 (Write/Approve)", "조회 전용 (Read-Only)"] },
    { key: "assignedUserCount", label: "할당사용자수", type: "number" },
    { key: "description", label: "설명" },
  ];

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">권한그룹마스터 (COM-005)</h1>
          <span className="text-[11px] text-sub">전사 사용자 역할(Role) 정의 · 접근 가능 모듈 및 메뉴별 읽기/쓰기 권한 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 권한 매핑 사용자 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{totalUsers} <span className="text-xs font-normal text-ink">명</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">등록 역할 (Role) 개수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개 역할</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">보안 권한 준수율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">권한레벨:</span>
          {["전체", "전권 관리자", "조회 및 승인"].map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                levelFilter === l
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <MassUpdateBar
            title="권한그룹"
            filename="공통_역할권한_마스터.csv"
            store={roleMasterStore}
            rows={filtered}
            columns={massColumns}
            newRow={() => ({ id: nextId("RL"), roleCode: "", roleName: "", moduleScope: "", permissionLevel: "조회 전용 (Read-Only)", assignedUserCount: 0, description: "" })}
          />
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">역할 코드 / 역할명</th>
              <th className="px-3 py-2">접근 가능 모듈 범위</th>
              <th className="px-3 py-2">권한 레벨</th>
              <th className="px-3 py-2 text-right">할당 사용자 수</th>
              <th className="px-3 py-2">비고 설명</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">
                  <div className="font-bold font-mono text-blue-600">{i.roleCode}</div>
                  <div className="text-[11px] text-ink font-semibold">{i.roleName}</div>
                </td>
                <td className="px-3 py-2 text-sub font-medium text-[11px]">{i.moduleScope}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.permissionLevel.includes("Full Access") ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {i.permissionLevel}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.assignedUserCount}명</td>
                <td className="px-3 py-2 text-sub text-[11px]">{i.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
