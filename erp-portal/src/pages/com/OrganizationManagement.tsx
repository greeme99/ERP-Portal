// COM-003 조직관리 (User Group & Org Structure) — 전사 본부·팀 부서 조직도·상위 부서 계층 및 부서장 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface OrgDepartmentItem {
  id: string;
  deptCode: string;
  deptName: string;
  parentDeptName: string; // 상위 부서/본부명
  deptHeadName: string; // 부서장 성명
  headcount: number; // 부서 인원 수
  location: string;
  status: "정상 운영" | "신설";
}

export const orgStore = createStore("com.org_mgmt", [
  { id: "ORG-01", deptCode: "DEPT-100", deptName: "소형가전 R&D 연구소", parentDeptName: "기술개발본부", deptHeadName: "김연구 수석", headcount: 28, location: "본사 R&D센터 3층", status: "정상 운영" },
  { id: "ORG-02", deptCode: "DEPT-200", deptName: "구매자재팀", parentDeptName: "생산관리본부", deptHeadName: "이구매 팀장", headcount: 12, location: "제1공장 본관 2층", status: "정상 운영" },
  { id: "ORG-03", deptCode: "DEPT-300", deptName: "국내영업 1팀", parentDeptName: "영업마케팅본부", deptHeadName: "이영업 팀장", headcount: 18, location: "본사 5층", status: "정상 운영" },
  { id: "ORG-04", deptCode: "DEPT-400", deptName: "품질보증팀", parentDeptName: "품질경영실", deptHeadName: "박품질 팀장", headcount: 15, location: "제1공장 품질동 1층", status: "정상 운영" },
]);

export default function OrganizationManagement() {
  const items = useStore(orgStore) as OrgDepartmentItem[];
  const [parentFilter, setParentFilter] = useState("전체");

  const filtered = items.filter((i) => parentFilter === "전체" || i.parentDeptName.includes(parentFilter));

  const totalHeadcount = filtered.reduce((acc, i) => acc + i.headcount, 0);

  const excel = () =>
    downloadCsv(
      "시스템_전사_부서_조직도_대장.csv",
      ["부서코드", "부서명", "상위본부명", "부서장", "인원수", "위치", "상태"],
      filtered.map((i) => [
        i.deptCode,
        i.deptName,
        i.parentDeptName,
        i.deptHeadName,
        i.headcount,
        i.location,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">조직관리 (COM-003)</h1>
          <span className="text-[11px] text-sub">전사 사업본부 · 부서 조직 계층 구조 · 부서장 및 부서별 구성원 현황</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 총 임직원 수 (Headcount)</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{totalHeadcount} <span className="text-xs font-normal text-ink">명</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">등록 조직 부서 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개 부서</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">부서장 발령 비율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">본부:</span>
          {["전체", "기술개발", "생산관리", "영업마케팅"].map((p) => (
            <button
              key={p}
              onClick={() => setParentFilter(p)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                parentFilter === p
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 조직도 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">부서 코드 / 부서명</th>
              <th className="px-3 py-2">상위 사업본부명</th>
              <th className="px-3 py-2">부서장 성명</th>
              <th className="px-3 py-2 text-right">소속 인원 수</th>
              <th className="px-3 py-2">부서 위치</th>
              <th className="px-3 py-2">운영 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{i.deptCode} — {i.deptName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.parentDeptName}</td>
                <td className="px-3 py-2 text-ink font-semibold">{i.deptHeadName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.headcount}명</td>
                <td className="px-3 py-2 text-sub">{i.location}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
