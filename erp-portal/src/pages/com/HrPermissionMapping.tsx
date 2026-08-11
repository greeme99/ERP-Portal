// COM-021 인사조직권한매핑 (HR Organization & Access Control Mapping) — 인사 발령 연동 부서·직급별 ERP 권한 매핑 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface HrPermissionItem {
  id: string;
  deptCode: string;
  deptName: string; // 부서명 (예: 생산관리팀, 관리회계팀, AS 서비스1팀)
  positionRoleName: string; // 직급/직책 (예: 팀장/부서장, 담당자/선임)
  assignedModuleRole: string; // 매핑된 ERP 모듈 권한 (예: PP 생산 전체 전결, CO 활동원가 조회)
  autoSyncStatus: "인사 발령 연동 완료" | "직급 변동 승인 대기";
  employeeCount: number; // 해당 부서/직급 적용 인원 수
}

export const hrPermStore = createStore("com.hr_perm", [
  { id: "HRP-01", deptCode: "DEPT-PP-01", deptName: "생산관리팀", positionRoleName: "생산관리팀장 (부서장)", assignedModuleRole: "PP 생산/자재 전결 권한 + MRP 승인", autoSyncStatus: "인사 발령 연동 완료", employeeCount: 1 },
  { id: "HRP-02", deptCode: "DEPT-CO-01", deptName: "관리회계팀", positionRoleName: "원가계산 담당자 (선임)", assignedModuleRole: "CO 활동기준원가 & COPA 수익성 전체", autoSyncStatus: "인사 발령 연동 완료", employeeCount: 4 },
]);

export default function HrPermissionMapping() {
  const items = useStore(hrPermStore) as HrPermissionItem[];
  const [deptFilter, setDeptFilter] = useState("전체");

  const filtered = items.filter((i) => deptFilter === "전체" || i.deptName.includes(deptFilter));

  const totalEmployees = filtered.reduce((acc, i) => acc + i.employeeCount, 0);

  const excel = () =>
    downloadCsv(
      "시스템_인사조직_권한매핑_대장.csv",
      ["부서코드", "부서명", "직급직책", "매핑ERP권한", "인사연동상태", "적용인원수"],
      filtered.map((i) => [
        i.deptCode,
        i.deptName,
        i.positionRoleName,
        i.assignedModuleRole,
        i.autoSyncStatus,
        i.employeeCount,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">인사조직권한매핑 (COM-021)</h1>
          <span className="text-[11px] text-sub">전사 인사 시스템 발령 연동 부서 · 직급/직책별 ERP 접근 권한 및 결재 전결선 동기화</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">인사 발령 자동 연동 부서 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">개 부서</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">권한 매핑 적용 임직원 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{totalEmployees} <span className="text-xs font-normal text-ink">명</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">퇴사자 계정 자동 잠금 이행률</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">부서:</span>
          {["전체", "생산관리", "관리회계"].map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                deptFilter === d
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 권한매핑 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">부서 코드</th>
              <th className="px-3 py-2">부서명</th>
              <th className="px-3 py-2">직급 / 직책</th>
              <th className="px-3 py-2">매핑된 ERP 모듈 권한</th>
              <th className="px-3 py-2">인사 연동 상태</th>
              <th className="px-3 py-2 text-right">적용 인원 수</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.deptCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.deptName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.positionRoleName}</td>
                <td className="px-3 py-2 font-bold text-emerald-600 text-[11px]">{i.assignedModuleRole}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.autoSyncStatus}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.employeeCount}명</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
