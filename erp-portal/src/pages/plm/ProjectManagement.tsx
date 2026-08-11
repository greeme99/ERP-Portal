// PLM-001 프로젝트 관리 (R&D Project & Gate Review) — 신제품 개발 R&D 프로젝트 단계별 Gate Review 및 개발 일정 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface RndProjectItem {
  id: string;
  projectCode: string;
  projectName: string;
  pmName: string; // 프로젝트 리더 (PM)
  gateStage: "Gate 1 (기획)" | "Gate 2 (설계)" | "Gate 3 (시작/검증)" | "Gate 4 (양산승인)";
  progressRatePct: number; // 종합 진행률 (%)
  targetSopDate: string; // 양산 목표일 (Start of Production)
  budgetAmount: number; // R&D 개발 예산 (KRW)
  status: "진행중" | "양산완료" | "지연";
}

export const rndProjectStore = createStore("plm.rnd_project", [
  { id: "PRJ-01", projectCode: "PRJ-2026-V2", projectName: "차세대 프리미엄 무선청소기 2세대 개발", pmName: "김연구 수석", gateStage: "Gate 3 (시작/검증)", progressRatePct: 75.0, targetSopDate: "2026-11-01", budgetAmount: 450000000, status: "진행중" },
  { id: "PRJ-02", projectCode: "PRJ-2026-RB", projectName: "AI 자율주행 로봇청소기 정밀 LIDAR 모듈 적용", pmName: "박센서 책임", gateStage: "Gate 2 (설계)", progressRatePct: 45.0, targetSopDate: "2027-02-15", budgetAmount: 620000000, status: "진행중" },
  { id: "PRJ-03", projectCode: "PRJ-2025-SF", projectName: "고효율 BLDC 모터 전자기판 컨트롤러", pmName: "최회계 선임", gateStage: "Gate 4 (양산승인)", progressRatePct: 100.0, targetSopDate: "2026-06-30", budgetAmount: 280000000, status: "양산완료" },
]);

export default function ProjectManagement() {
  const projects = useStore(rndProjectStore) as RndProjectItem[];
  const [gateFilter, setGateFilter] = useState("전체");

  const filtered = projects.filter((p) => gateFilter === "전체" || p.gateStage.includes(gateFilter));

  const totalBudget = filtered.reduce((acc, p) => acc + p.budgetAmount, 0);

  const excel = () =>
    downloadCsv(
      "연구개발_RND_프로젝트_대장.csv",
      ["프로젝트코드", "프로젝트명", "PM", "Gate단계", "진행률(%)", "양산목표일", "개발예산(원)", "상태"],
      filtered.map((p) => [
        p.projectCode,
        p.projectName,
        p.pmName,
        p.gateStage,
        `${p.progressRatePct}%`,
        p.targetSopDate,
        p.budgetAmount,
        p.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. Engineering Management (연구개발)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">프로젝트 관리 (PLM-001)</h1>
          <span className="text-[11px] text-sub">신제품 개발 R&D 프로젝트 Gate 1~4 단계별 검토 · 개발 진행률 및 양산(SOP) 일정</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 R&D 개발 프로젝트 예산</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalBudget / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">현재 진행중 프로젝트</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{projects.filter((p) => p.status === "진행중").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">양산 이관 완료 프로젝트</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{projects.filter((p) => p.status === "양산완료").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">Gate 단계:</span>
          {["전체", "Gate 1", "Gate 2", "Gate 3", "Gate 4"].map((gt) => (
            <button
              key={gt}
              onClick={() => setGateFilter(gt)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                gateFilter === gt
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {gt}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 프로젝트대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">프로젝트 코드 / 명</th>
              <th className="px-3 py-2">PM</th>
              <th className="px-3 py-2">Gate 단계</th>
              <th className="px-3 py-2 text-right">진행률</th>
              <th className="px-3 py-2">양산 목표일 (SOP)</th>
              <th className="px-3 py-2 text-right">개발 예산</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{p.projectCode} — {p.projectName}</td>
                <td className="px-3 py-2 text-sub font-medium">{p.pmName}</td>
                <td className="px-3 py-2 font-bold font-mono text-blue-600">{p.gateStage}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{p.progressRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 font-mono text-sub">{p.targetSopDate}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(p.budgetAmount / 100000000).toFixed(2)}억원</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status === "양산완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}>
                    {p.status}
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
