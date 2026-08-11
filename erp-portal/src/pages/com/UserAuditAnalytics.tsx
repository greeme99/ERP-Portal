// COM-015 사용자데이터감사분석 (User Audit & Data Access Security Analytics) — ERP 사용자 모듈별 접속·데이터 접근 보안 이상 탐지 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface UserAuditItem {
  id: string;
  auditLogId: string;
  userAccount: string; // 사용자 계정 ID (예: admin_kim, user_sd_park)
  userName: string; // 사용자 성명
  accessedModule: string; // 접근 ERP 모듈 (예: FI 재무회계 / CO 관리회계 / SD 영업)
  actionType: "엑셀 다운로드 (Excel)" | "마스터 수정 (Update)" | "데이터 신규 등록";
  accessClientIp: string; // 접속 IP 주소
  securityRiskLevel: "정상 접근" | "대량 엑셀 다운로드 경보" | "권한 밖 이탈 시도";
  eventTimestamp: string;
}

export const userAuditStore = createStore("com.user_audit", [
  { id: "AUD-01", auditLogId: "LOG-2026-0801", userAccount: "co_analyst_kim", userName: "김회계 대리", accessedModule: "CO 관리회계 (ABC 원가)", actionType: "엑셀 다운로드 (Excel)", accessClientIp: "192.168.1.104", securityRiskLevel: "대량 엑셀 다운로드 경보", eventTimestamp: "2026-08-06 17:40" },
  { id: "AUD-02", auditLogId: "LOG-2026-0802", userAccount: "sd_sales_lee", userName: "이영업 과장", accessedModule: "SD 영업 (고객 단가 마스터)", actionType: "마스터 수정 (Update)", accessClientIp: "192.168.1.112", securityRiskLevel: "정상 접근", eventTimestamp: "2026-08-06 18:02" },
]);

export default function UserAuditAnalytics() {
  const items = useStore(userAuditStore) as UserAuditItem[];
  const [riskFilter, setRiskFilter] = useState("전체");

  const filtered = items.filter((i) => riskFilter === "전체" || i.securityRiskLevel.includes(riskFilter));

  const alertCount = items.filter((i) => !i.securityRiskLevel.includes("정상")).length;

  const excel = () =>
    downloadCsv(
      "시스템_사용자_데이터감사_로그_대장.csv",
      ["로그ID", "사용자계정", "성명", "접근모듈", "수행행위", "접속IP", "보안위험수준", "일시"],
      filtered.map((i) => [
        i.auditLogId,
        i.userAccount,
        i.userName,
        i.accessedModule,
        i.actionType,
        i.accessClientIp,
        i.securityRiskLevel,
        i.eventTimestamp,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">사용자데이터감사분석 (COM-015)</h1>
          <span className="text-[11px] text-sub">ERP 사용자 계정별 모듈 데이터 접근 행위 · 대량 다운로드 및 보안 위험 이상 탐지</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">오늘 총 데이터 접근 감사 로그</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">3,840 <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">보안 위험 경보 탐지 건수</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{alertCount} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">감사 로그 보존 이행률</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">위험:</span>
          {["전체", "정상", "경보"].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                riskFilter === r
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 사용자감사 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">감사 로그 ID</th>
              <th className="px-3 py-2">사용자 계정 / 성명</th>
              <th className="px-3 py-2">접근 ERP 모듈</th>
              <th className="px-3 py-2">수행 행위 구분의</th>
              <th className="px-3 py-2">접속 IP 주소</th>
              <th className="px-3 py-2">보안 위험 수준</th>
              <th className="px-3 py-2">이벤트 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.auditLogId}</td>
                <td className="px-3 py-2 font-medium">
                  <div className="font-mono text-ink font-bold">{i.userAccount}</div>
                  <div className="text-[11px] text-sub font-semibold">{i.userName}</div>
                </td>
                <td className="px-3 py-2 text-ink font-semibold text-[11px]">{i.accessedModule}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.actionType}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.accessClientIp}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.securityRiskLevel.includes("경보") ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {i.securityRiskLevel}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.eventTimestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
