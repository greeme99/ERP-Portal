// COM-018 개인정보분리보관 (Data Privacy & PII Protection Management) — 전사 개인정보 암호화·마스킹 및 분리 보관 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface DataPrivacyItem {
  id: string;
  piiTargetField: string; // 개인정보 대상 필드 (예: 고객 휴대폰번호, 고객 계좌번호, 대표자 주민번호)
  encryptionAlgorithm: string; // 적용 암호화 알고리즘 (예: AES-256-GCM, ARIA-256)
  maskingFormatPattern: string; // UI 출력 마스킹 패턴 (예: 010-****-1234, 123-****-5678)
  retentionPeriodYears: number; // 법정 보유 및 분리 보관 주기 (년)
  autoDestructionYn: "Y" | "N"; // 만료 시 자동 파기 여부
  securityComplianceStatus: "컴플라이언스 준수 (Compliant)" | "분리 보관 이관 대기";
}

export const privacyStore = createStore("com.privacy", [
  { id: "PII-01", piiTargetField: "고객 마스터 휴대폰번호 / 주소", encryptionAlgorithm: "AES-256-GCM DB 단방향/양방향 암호화", maskingFormatPattern: "010-****-5678", retentionPeriodYears: 5, autoDestructionYn: "Y", securityComplianceStatus: "컴플라이언스 준수 (Compliant)" },
  { id: "PII-02", piiTargetField: "고객 수금/환불 계좌번호", encryptionAlgorithm: "ARIA-256 하드웨어 KCMVP 암호화", maskingFormatPattern: "3333-**-******", retentionPeriodYears: 5, autoDestructionYn: "Y", securityComplianceStatus: "컴플라이언스 준수 (Compliant)" },
]);

export default function DataPrivacyManagement() {
  const items = useStore(privacyStore) as DataPrivacyItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.securityComplianceStatus.includes(statusFilter));

  const excel = () =>
    downloadCsv(
      "시스템_개인정보_분리보관_암호화_대장.csv",
      ["대상필드", "암호화알고리즘", "마스킹패턴", "보유주기(년)", "자동파기여부", "컴플라이언스상태"],
      filtered.map((i) => [
        i.piiTargetField,
        i.encryptionAlgorithm,
        i.maskingFormatPattern,
        i.retentionPeriodYears,
        i.autoDestructionYn,
        i.securityComplianceStatus,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">개인정보분리보관 (COM-018)</h1>
          <span className="text-[11px] text-sub">개인정보보호법 컴플라이언스 준수 · PII 데이터 DB 암호화, 마스킹 및 분리 보관 파기 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">개인정보 보호법 컴플라이언스 이행률</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">100.0%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">암호화 적용 대상 필드 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개 필드</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">자동 파기 설정 비중</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "컴플라이언스 준수"].map((s) => (
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
          📥 개인정보보호 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">개인정보 보호 대상 필드</th>
              <th className="px-3 py-2">적용 DB 암호화 알고리즘</th>
              <th className="px-3 py-2">UI 출력 마스킹 패턴</th>
              <th className="px-3 py-2 text-right">법정 보유주기</th>
              <th className="px-3 py-2">자동 파기 여부</th>
              <th className="px-3 py-2">보안 컴플라이언스 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-bold text-blue-600 text-[11px]">{i.piiTargetField}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.encryptionAlgorithm}</td>
                <td className="px-3 py-2 font-mono text-purple-600 font-bold">{i.maskingFormatPattern}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.retentionPeriodYears}년</td>
                <td className="px-3 py-2 font-bold font-mono text-emerald-600">{i.autoDestructionYn}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.securityComplianceStatus}
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
