// FI-013 IFRS회계감사 (IFRS & External Financial Audit Management) — 국제회계기준 IFRS 공시 및 외부회계감사 지침 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface IfrsAuditItem {
  id: string;
  auditYear: string;
  auditFirmName: string; // 외부 감사 회계법인 (예: 삼일회계법인, 삼정KPMG)
  ifrsStandardCode: string; // IFRS 관련 기준서 (예: IFRS 15 고객과의 계약에서 생기는 수익, IFRS 16 리스)
  keyAuditMatter: string; // 핵심 감사 사항 KAM
  auditOpinion: "적정 (Unmodified)" | "한정 (Qualified)";
  auditReportDate: string;
  leadAuditorName: string;
}

export const ifrsAuditStore = createStore("fi.ifrs_audit", [
  { id: "AUD-01", auditYear: "2025년 결산", auditFirmName: "삼일회계법인", ifrsStandardCode: "K-IFRS 1115호 (IFRS 15 수익인식)", keyAuditMatter: "소형가전 무선청소기 대리점 적립 마일리지 및 반품충당부채 수익인식 시점 적정성", auditOpinion: "적정 (Unmodified)", auditReportDate: "2026-03-15", leadAuditorName: "정삼일 공인회계사" },
  { id: "AUD-02", auditYear: "2025년 결산", auditFirmName: "삼일회계법인", ifrsStandardCode: "K-IFRS 1116호 (IFRS 16 리스)", keyAuditMatter: "전국 AS 서비스센터 및 지점 직영 매장 임차 리스자산 사용권 가치 및 리스부채 평가", auditOpinion: "적정 (Unmodified)", auditReportDate: "2026-03-15", leadAuditorName: "정삼일 공인회계사" },
]);

export default function IfrsAuditManagement() {
  const items = useStore(ifrsAuditStore) as IfrsAuditItem[];
  const [yearFilter, setYearFilter] = useState("전체");

  const filtered = items.filter((i) => yearFilter === "전체" || i.auditYear.includes(yearFilter));

  const excel = () =>
    downloadCsv(
      "재무_IFRS_외부회계감사_대장.csv",
      ["감사연도", "감사회계법인", "IFRS기준서", "핵심감사사항KAM", "감사의견", "보고서발행일", "주인증회계사"],
      filtered.map((i) => [
        i.auditYear,
        i.auditFirmName,
        i.ifrsStandardCode,
        i.keyAuditMatter,
        i.auditOpinion,
        i.auditReportDate,
        i.leadAuditorName,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. Financial Accounting (재무회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">IFRS회계감사 (FI-013)</h1>
          <span className="text-[11px] text-sub">K-IFRS 국제회계기준 공시 항목 · 외부 감사 회계법인 핵심감사사항(KAM) 및 감사의견</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">최근 외부 회계감사 의견</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">적정 (Unmodified)</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">외부 지정 감사 회계법인</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">삼일회계법인</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">핵심 감사사항 (KAM) 관리 수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">감사연도:</span>
          {["전체", "2025년"].map((y) => (
            <button
              key={y}
              onClick={() => setYearFilter(y)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                yearFilter === y
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 IFRS감사 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">감사 연도</th>
              <th className="px-3 py-2">감사 회계법인</th>
              <th className="px-3 py-2">K-IFRS 기준서 코드</th>
              <th className="px-3 py-2">핵심 감사사항 (KAM) 요약</th>
              <th className="px-3 py-2">감사 의견</th>
              <th className="px-3 py-2">보고서 발행일</th>
              <th className="px-3 py-2">주인증 회계사</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.auditYear}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.auditFirmName}</td>
                <td className="px-3 py-2 text-purple-700 font-bold text-[11px]">{i.ifrsStandardCode}</td>
                <td className="px-3 py-2 text-sub text-[11px] font-medium">{i.keyAuditMatter}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.auditOpinion}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.auditReportDate}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.leadAuditorName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
