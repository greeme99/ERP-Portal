// GlobalComplianceLegal.tsx (Global Regulatory Compliance & Certification Control) — 글로벌 컴플라이언스 및 규제 인증 마스터 관제
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ComplianceCertItem {
  id: string;
  certCode: string;
  certName: string; // 인증/규제명 (예: 유럽 CE 안전인증, 미국 FCC 전자파 인증, 한국 KC 안전확인, ISO 9001 품질경영)
  targetProductGroup: string; // 적용 제품군 (예: 프리미엄 로봇청소기, 무선 청소기, 소형 가전)
  issuingAuthorityName: string; // 발급 기관 (예: TÜV SÜD, UL Solutions, KTL)
  expirationDueDate: string; // 만료 예정일
  complianceAuditStatus: "인증 유지 (Valid)" | "갱신 심사 진행중" | "갱신 서류 제출 대기";
}

export const certStore = createStore("dashboard.cert", [
  { id: "CRT-01", certCode: "CERT-CE-2026", certName: "유럽연합 CE 안전 및 적합성 (CE Mark)", targetProductGroup: "스마트 로봇청소기 (FG-1001)", issuingAuthorityName: "TÜV SÜD Germany", expirationDueDate: "2027-12-31", complianceAuditStatus: "인증 유지 (Valid)" },
  { id: "CRT-02", certCode: "CERT-FCC-2026", certName: "미국 FCC 무선통신 인증", targetProductGroup: "스마트 로봇청소기 (FG-1001)", issuingAuthorityName: "UL Solutions USA", expirationDueDate: "2028-06-30", complianceAuditStatus: "인증 유지 (Valid)" },
  { id: "CRT-03", certCode: "CERT-KC-2026", certName: "대한민국 KC 자율안전확인", targetProductGroup: "소형가전 전체 제품군", issuingAuthorityName: "한국산업기술시험원 (KTL)", expirationDueDate: "2026-11-15", complianceAuditStatus: "갱신 심사 진행중" },
]);

export default function GlobalComplianceLegal() {
  const items = useStore(certStore) as ComplianceCertItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.complianceAuditStatus.includes(statusFilter));

  const excel = () =>
    downloadCsv(
      "글로벌_규제_인증_컴플라이언스_대장.csv",
      ["인증코드", "인증명", "적용제품군", "발급기관", "만료예정일", "심수상태"],
      filtered.map((i) => [
        i.certCode,
        i.certName,
        i.targetProductGroup,
        i.issuingAuthorityName,
        i.expirationDueDate,
        i.complianceAuditStatus,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">00. Executive & AI Command (규제/인증 관제)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">글로벌 규제 준수 & 인증 마스터 관제</h1>
          <span className="text-[11px] text-sub">CE · FCC · KC · ISO 글로벌 품질/환경/안전 인증 실시간 수명 주기 및 갱신 심사 관제 센터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">유효 보유 글로벌 인증 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">개 인증</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">글로벌 규제 컴플라이언스 준수율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">갱신 심사 진행 중 인증</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">1 <span className="text-xs font-normal text-ink">건 (KC 인증)</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "인증 유지", "갱신 심사"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === s
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 규제인증 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">인증 코드</th>
              <th className="px-3 py-2">글로벌 규제 / 인증명</th>
              <th className="px-3 py-2">적용 제품군</th>
              <th className="px-3 py-2">발급 인증 기관</th>
              <th className="px-3 py-2 font-mono">만료 예정일</th>
              <th className="px-3 py-2">심사 유지 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.certCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.certName}</td>
                <td className="px-3 py-2 font-bold text-emerald-600 text-[11px]">{i.targetProductGroup}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.issuingAuthorityName}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.expirationDueDate}</td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      i.complianceAuditStatus.includes("Valid")
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-purple-100 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {i.complianceAuditStatus}
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
