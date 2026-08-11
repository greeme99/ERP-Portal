// COM-009 로그관리 — 사용자 접속 로그·데이터 수정/삭제 감시 이력(Audit Trail) 및 보안 로그
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SystemLogItem {
  id: string;
  userCode: string;
  userName: string;
  ipAddress: string;
  actionType: "LOGIN" | "CREATE" | "UPDATE" | "DELETE" | "EXPORT";
  targetModule: string;
  description: string;
  level: "INFO" | "WARN" | "SECURITY";
  loggedAt: string;
}

export const auditLogStore = createStore("com.audit_log", [
  { id: "LOG-01", userCode: "USR-001", userName: "김관리 (시스템)", ipAddress: "192.168.1.10", actionType: "LOGIN", targetModule: "공통/플랫폼", description: "사용자 로그인 성공 (MFA 인증)", level: "INFO", loggedAt: "2026-08-06 08:30:12" },
  { id: "LOG-02", userCode: "USR-003", userName: "박구매 (구매팀)", ipAddress: "192.168.1.45", actionType: "CREATE", targetModule: "구매관리", description: "구매요청 PR-2026-004 신규 등록 (38,350,000원)", level: "INFO", loggedAt: "2026-08-06 09:12:05" },
  { id: "LOG-03", userCode: "USR-005", userName: "최재무 (회계팀)", ipAddress: "192.168.1.88", actionType: "UPDATE", targetModule: "재무회계", description: "2026-07 회계 월마감 상태 'Locked'으로 변경", level: "SECURITY", loggedAt: "2026-08-06 09:25:40" },
  { id: "LOG-04", userCode: "USR-002", userName: "이영업 (영업팀)", ipAddress: "192.168.1.22", actionType: "EXPORT", targetModule: "영업관리", description: "고객별 손익분석 Excel 내보내기 다운로드", level: "INFO", loggedAt: "2026-08-06 09:40:18" },
]);

export default function AuditLogs() {
  const logs = useStore(auditLogStore) as SystemLogItem[];
  const [levelFilter, setLevelFilter] = useState("전체");

  const filtered = logs.filter((l) => levelFilter === "전체" || l.level === levelFilter);

  const securityLogCount = logs.filter((l) => l.level === "SECURITY").length;

  const excel = () =>
    downloadCsv(
      "시스템_감사로그_대장.csv",
      ["로그ID", "사번", "사용자명", "IP주소", "액션구분", "대상모듈", "상세이력", "로그레벨", "기록일시"],
      filtered.map((l) => [
        l.id,
        l.userCode,
        l.userName,
        l.ipAddress,
        l.actionType,
        l.targetModule,
        l.description,
        l.level,
        l.loggedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">13. Common / Platform (공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">로그관리 (COM-009)</h1>
          <span className="text-[11px] text-sub">사용자 작업 이력 (Audit Trail) · 데이터 변경 감시 · 시스템 보안 로그</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 시스템 작업 로그</div>
          <div className="text-xl font-bold mt-1 font-mono">{logs.length} <span className="text-xs font-normal">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">보안 주요 로그 (SECURITY)</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{securityLogCount} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">오늘 접속 사용자 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{new Set(logs.map((l) => l.userCode)).size} <span className="text-xs font-normal text-ink">명</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">로그 레벨:</span>
          {["전체", "INFO", "WARN", "SECURITY"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                levelFilter === lvl
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 감사로그 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">사용자 / 사번</th>
              <th className="px-3 py-2">IP 주소</th>
              <th className="px-3 py-2">액션 구분</th>
              <th className="px-3 py-2">대상 모듈</th>
              <th className="px-3 py-2">상세 작업 이력</th>
              <th className="px-3 py-2">레벨</th>
              <th className="px-3 py-2">기록 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{l.userName} ({l.userCode})</td>
                <td className="px-3 py-2 font-mono text-sub">{l.ipAddress}</td>
                <td className="px-3 py-2 font-bold font-mono text-blue-600">{l.actionType}</td>
                <td className="px-3 py-2 text-sub">{l.targetModule}</td>
                <td className="px-3 py-2 text-ink font-medium">{l.description}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    l.level === "SECURITY" ? "bg-red-100 text-red-700 border border-red-200" :
                    l.level === "WARN" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {l.level}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{l.loggedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
