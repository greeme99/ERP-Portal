// COM-025 데이터보존연한정책 (Data Retention Policy & Archive Management) — 전사 ERP 전표·마스터 데이터 보존 연한 정책 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface DataRetentionItem {
  id: string;
  policyCode: string;
  targetDomainModule: string; // 대상 ERP 도메인 모듈 (예: FI/CO 회계전표, SD 영업수주, QM 품질검사)
  legalBasisLaw: string; // 법적 의무 근거 법률 (예: 상법 제33조, 국세기본법, 품질경영가이드)
  retentionYears: number; // 보존 연한 (년, 99=영구보존)
  archiveStorageType: "온라인 핫 스토리지" | "콜드 아카이빙 스토리지";
  complianceStatus: "규정 준수 (Compliant)";
}

export const retentionStore = createStore("com.retention", [
  { id: "RET-01", policyCode: "POL-FI-01", targetDomainModule: "FI 재무회계 전표 및 장부/재무제표", legalBasisLaw: "국세기본법 제85조의3 & 상법", retentionYears: 10, archiveStorageType: "온라인 핫 스토리지", complianceStatus: "규정 준수 (Compliant)" },
  { id: "RET-02", policyCode: "POL-QM-02", targetDomainModule: "QM 품질 검사 성적서 & 불량 8D 리포트", legalBasisLaw: "제조물책임법(PL법) & ISO 9001", retentionYears: 10, archiveStorageType: "콜드 아카이빙 스토리지", complianceStatus: "규정 준수 (Compliant)" },
  { id: "RET-03", policyCode: "POL-MDM-03", targetDomainModule: "MDM 자재/BOM 마스터 이력", legalBasisLaw: "내부회계관리제도 지침", retentionYears: 99, archiveStorageType: "온라인 핫 스토리지", complianceStatus: "규정 준수 (Compliant)" },
]);

export default function DataRetentionPolicy() {
  const items = useStore(retentionStore) as DataRetentionItem[];
  const [domainFilter, setDomainFilter] = useState("전체");

  const filtered = items.filter((i) => domainFilter === "전체" || i.targetDomainModule.includes(domainFilter));

  const excel = () =>
    downloadCsv(
      "시스템_데이터_보존연한_정책_대장.csv",
      ["정책코드", "대상모듈", "근거법률", "보존연한(년)", "스토리지유형", "준수상태"],
      filtered.map((i) => [
        i.policyCode,
        i.targetDomainModule,
        i.legalBasisLaw,
        i.retentionYears === 99 ? "영구보존" : `${i.retentionYears}년`,
        i.archiveStorageType,
        i.complianceStatus,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">데이터보존연한정책 (COM-025)</h1>
          <span className="text-[11px] text-sub">상법 · 국세기본법 및 제조물책임법(PL) 준수 ERP 도메인 전표 데이터 법정 보존 연한 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">법정 보존 정책 적용 모듈 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">개 모듈</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">법적 컴플라이언스 이행률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0% (Compliant)</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">콜드 아카이빙 스토리지 전환률</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">모듈:</span>
          {["전체", "FI", "QM", "MDM"].map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                domainFilter === d
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 보존정책 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">정책 코드</th>
              <th className="px-3 py-2">대상 ERP 도메인 모듈</th>
              <th className="px-3 py-2">법적 의무 근거 법률</th>
              <th className="px-3 py-2 text-right">법정 보존 연한</th>
              <th className="px-3 py-2">보존 스토리지 유형</th>
              <th className="px-3 py-2">컴플라이언스 준수</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.policyCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.targetDomainModule}</td>
                <td className="px-3 py-2 text-sub font-medium text-[11px]">{i.legalBasisLaw}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">
                  {i.retentionYears === 99 ? "영구 보존" : `${i.retentionYears}년`}
                </td>
                <td className="px-3 py-2 font-semibold text-emerald-600 text-[11px]">{i.archiveStorageType}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.complianceStatus}
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
