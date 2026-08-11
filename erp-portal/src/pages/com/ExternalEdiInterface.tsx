// COM-017 외부EDI인터페이스 (External EDI & Enterprise API Integration) — 금융 기관·국세청·협력사 EDI 연동 모니터링
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ExternalEdiItem {
  id: string;
  interfaceCode: string;
  interfaceName: string; // 인터페이스 시스템명 (예: 국세청 홈택스 전자세금계산서 EDI, 금융결제원 펌뱅킹, SCM 협력사 API)
  protocolType: "RESTful API (JSON)" | "국가 표준 EDIFACT" | "금융 SFTP 암호화";
  targetSystemName: string;
  dailyTransferredCount: number; // 일일 데이터 전송 건수
  successRatePct: number; // 전송 성공률 (%)
  lastTransferTime: string;
  status: "정상 연동 (Active)" | "전송 에러 대기열 발생";
}

export const externalEdiStore = createStore("com.external_edi", [
  { id: "EDI-01", interfaceCode: "IF-HOMETAX-01", interfaceName: "국세청 홈택스 전자세금계산서 자동 발행 EDI", protocolType: "RESTful API (JSON)", targetSystemName: "국세청 NTS 홈택스", dailyTransferredCount: 450, successRatePct: 100.0, lastTransferTime: "2026-08-06 17:30", status: "정상 연동 (Active)" },
  { id: "EDI-02", interfaceCode: "IF-FBANK-02", interfaceName: "신한/국민은행 펌뱅킹 수금/지급 자동 연동", protocolType: "금융 SFTP 암호화", targetSystemName: "금융결제원 KFTC", dailyTransferredCount: 120, successRatePct: 99.2, lastTransferTime: "2026-08-06 18:00", status: "정상 연동 (Active)" },
]);

export default function ExternalEdiInterface() {
  const items = useStore(externalEdiStore) as ExternalEdiItem[];
  const [protocolFilter, setProtocolFilter] = useState("전체");

  const filtered = items.filter((i) => protocolFilter === "전체" || i.protocolType.includes(protocolFilter));

  const totalTransfers = filtered.reduce((acc, i) => acc + i.dailyTransferredCount, 0);

  const excel = () =>
    downloadCsv(
      "시스템_외부EDI_인터페이스_연동_대장.csv",
      ["인터페이스코드", "인터페이스명", "프로토콜", "연동대상시스템", "일일전송건수", "성공률(%)", "최근전송일시", "상태"],
      filtered.map((i) => [
        i.interfaceCode,
        i.interfaceName,
        i.protocolType,
        i.targetSystemName,
        i.dailyTransferredCount,
        `${i.successRatePct}%`,
        i.lastTransferTime,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">외부EDI인터페이스 (COM-017)</h1>
          <span className="text-[11px] text-sub">국세청 홈택스 · 은행 펌뱅킹 · 협력사 SCM 대외 EDI 및 Enterprise REST API연동 상태 모니터링</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">일일 대외 EDI 데이터 전송 건수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{totalTransfers.toLocaleString()} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">대외 인터페이스 평균 전송 성공률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {(filtered.reduce((acc, i) => acc + i.successRatePct, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">운영 중인 대외 채널 수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개 시스템</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">프로토콜:</span>
          {["전체", "RESTful", "SFTP"].map((p) => (
            <button
              key={p}
              onClick={() => setProtocolFilter(p)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                protocolFilter === p
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 EDI인터페이스 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">인터페이스 코드</th>
              <th className="px-3 py-2">인터페이스 시스템명</th>
              <th className="px-3 py-2">연동 프로토콜</th>
              <th className="px-3 py-2">연동 대외 기관/시스템</th>
              <th className="px-3 py-2 text-right">일일 전송 건수</th>
              <th className="px-3 py-2 text-right">전송 성공률</th>
              <th className="px-3 py-2">최근 전송 일시</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.interfaceCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.interfaceName}</td>
                <td className="px-3 py-2 font-semibold text-purple-700 text-[11px]">{i.protocolType}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.targetSystemName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.dailyTransferredCount.toLocaleString()}건</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.successRatePct.toFixed(1)}%</td>
                <td className="px-3 py-2 font-mono text-sub">{i.lastTransferTime}</td>
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
