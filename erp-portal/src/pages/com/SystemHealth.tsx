// COM-010 시스템 모니터링 — 서버 CPU/메모리 사용률·DB 커넥션·API 응답속도 및 인프라 헬스 체크
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ServerNodeHealth {
  id: string;
  serverName: string;
  ipAddress: string;
  cpuUsagePct: number; // CPU 사용률 (%)
  memUsagePct: number; // 메모리 사용률 (%)
  activeDbConn: number; // DB 연결 수
  avgLatencyMs: number; // API 응답 지연 (ms)
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  checkedAt: string;
}

export const systemHealthStore = createStore("com.system_health", [
  { id: "NODE-01", serverName: "ERP App Server 01 (Primary)", ipAddress: "10.0.1.10", cpuUsagePct: 28.5, memUsagePct: 45.2, activeDbConn: 32, avgLatencyMs: 42, status: "HEALTHY", checkedAt: "2026-08-06 10:28:00" },
  { id: "NODE-02", serverName: "ERP App Server 02 (Secondary)", ipAddress: "10.0.1.11", cpuUsagePct: 31.0, memUsagePct: 48.0, activeDbConn: 28, avgLatencyMs: 45, status: "HEALTHY", checkedAt: "2026-08-06 10:28:00" },
  { id: "NODE-03", serverName: "PostgreSQL Primary DB Node", ipAddress: "10.0.2.20", cpuUsagePct: 42.8, memUsagePct: 68.5, activeDbConn: 60, avgLatencyMs: 12, status: "HEALTHY", checkedAt: "2026-08-06 10:28:00" },
  { id: "NODE-04", serverName: "Redis In-Memory Cache Node", ipAddress: "10.0.2.30", cpuUsagePct: 15.2, memUsagePct: 82.0, activeDbConn: 120, avgLatencyMs: 3, status: "WARNING", checkedAt: "2026-08-06 10:28:00" },
]);

export default function SystemHealth() {
  const nodes = useStore(systemHealthStore) as ServerNodeHealth[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = nodes.filter((n) => statusFilter === "전체" || n.status === statusFilter);

  const avgCpu = (nodes.reduce((acc, n) => acc + n.cpuUsagePct, 0) / nodes.length).toFixed(1);
  const avgMem = (nodes.reduce((acc, n) => acc + n.memUsagePct, 0) / nodes.length).toFixed(1);

  const excel = () =>
    downloadCsv(
      "시스템_모니터링_헬스체크.csv",
      ["서버명", "IP주소", "CPU사용률(%)", "메모리사용률(%)", "DB커넥션수", "API지연(ms)", "상태", "점검일시"],
      filtered.map((n) => [
        n.serverName,
        n.ipAddress,
        `${n.cpuUsagePct}%`,
        `${n.memUsagePct}%`,
        n.activeDbConn,
        `${n.avgLatencyMs}ms`,
        n.status,
        n.checkedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">13. Common / Platform (공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">시스템 모니터링 (COM-010)</h1>
          <span className="text-[11px] text-sub">서버 자원(CPU/RAM) · DB 커넥션 · API 응답속도 실시간 헬스 체크</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">평균 CPU 사용률</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{avgCpu}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 RAM 메모리 사용률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgMem}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">인프라 노드 상태</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {nodes.filter((n) => n.status === "HEALTHY").length} / {nodes.length} <span className="text-xs font-normal text-ink">정상</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "HEALTHY", "WARNING", "CRITICAL"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === st
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 시스템헬스 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">서버 노드명</th>
              <th className="px-3 py-2">IP 주소</th>
              <th className="px-3 py-2 text-right">CPU 사용률</th>
              <th className="px-3 py-2 text-right">메모리 사용률</th>
              <th className="px-3 py-2 text-right">DB 커넥션 수</th>
              <th className="px-3 py-2 text-right">API Latency</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">점검 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n) => (
              <tr key={n.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{n.serverName}</td>
                <td className="px-3 py-2 font-mono text-sub">{n.ipAddress}</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{n.cpuUsagePct.toFixed(1)}%</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${n.memUsagePct >= 80 ? "text-amber-600" : ""}`}>{n.memUsagePct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{n.activeDbConn}개</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{n.avgLatencyMs}ms</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    n.status === "HEALTHY" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    n.status === "WARNING" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {n.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{n.checkedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
