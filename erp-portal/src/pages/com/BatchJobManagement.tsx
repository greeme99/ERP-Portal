// COM-007 배치관리 — 배치 스케줄러(MRP 전개·감가상각·수불집계·DB백업) 실행 이력 및 주기(Cron) 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface BatchJob {
  id: string;
  jobCode: string;
  jobName: string;
  cronExpression: string; // Cron 주기 (예: 0 0 2 * * ?)
  lastRunTime: string;
  nextRunTime: string;
  durationSec: number; // 소요 시간 (초)
  status: "SUCCESS" | "FAILED" | "RUNNING";
  errorMessage?: string;
}

export const batchJobStore = createStore("com.batch_job", [
  { id: "BAT-01", jobCode: "JOB-MRP-NIGHTLY", jobName: "야간 자동 MRP 자재소요 소요량 전개 배치", cronExpression: "0 0 2 * * ?", lastRunTime: "2026-08-06 02:00:00", nextRunTime: "2026-08-07 02:00:00", durationSec: 145, status: "SUCCESS" },
  { id: "BAT-02", jobCode: "JOB-COST-ALLOC", jobName: "월말 제조간접비 실제원가 차이 배부 배치", cronExpression: "0 30 23 L * ?", lastRunTime: "2026-07-31 23:30:00", nextRunTime: "2026-08-31 23:30:00", durationSec: 320, status: "SUCCESS" },
  { id: "BAT-03", jobCode: "JOB-DB-BACKUP", jobName: "ERP 데이터베이스 전체 스냅샷 백업", cronExpression: "0 0 3 * * ?", lastRunTime: "2026-08-06 03:00:00", nextRunTime: "2026-08-07 03:00:00", durationSec: 512, status: "SUCCESS" },
  { id: "BAT-04", jobCode: "JOB-SYNC-STOCK", jobName: "WMS 창고 실재고 외부 시스템 실시간 동기화", cronExpression: "0 */15 * * * ?", lastRunTime: "2026-08-06 10:15:00", nextRunTime: "2026-08-06 10:30:00", durationSec: 8, status: "RUNNING" },
]);

export default function BatchJobManagement() {
  const jobs = useStore(batchJobStore) as BatchJob[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = jobs.filter((j) => statusFilter === "전체" || j.status === statusFilter);

  const failedCount = jobs.filter((j) => j.status === "FAILED").length;

  const runNow = (id: string) => {
    batchJobStore.update(id, { status: "RUNNING", lastRunTime: new Date().toLocaleString() });
    setTimeout(() => {
      batchJobStore.update(id, { status: "SUCCESS" });
    }, 1500);
  };

  const excel = () =>
    downloadCsv(
      "시스템_배치스케줄_대장.csv",
      ["배치코드", "배치작업명", "Cron주기", "최근실행일시", "다음실행일시", "소요시간(초)", "상태"],
      filtered.map((j) => [
        j.jobCode,
        j.jobName,
        j.cronExpression,
        j.lastRunTime,
        j.nextRunTime,
        j.durationSec,
        j.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">13. Common / Platform (공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">배치관리 (COM-007)</h1>
          <span className="text-[11px] text-sub">자동 배치 스케줄러 (MRP·배부·백업) 주기(Cron) 설정 및 수동 즉시 실행</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 등록 배치 작업</div>
          <div className="text-xl font-bold mt-1 font-mono">{jobs.length} <span className="text-xs font-normal">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">정상 실행 (SUCCESS)</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{jobs.filter((j) => j.status === "SUCCESS").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">오류 발생 (FAILED)</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{failedCount} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "SUCCESS", "RUNNING", "FAILED"].map((st) => (
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
          📥 배치스케줄 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">배치 코드 / 작업명</th>
              <th className="px-3 py-2">Cron 주기 표현식</th>
              <th className="px-3 py-2">최근 실행일시</th>
              <th className="px-3 py-2">다음 예정일시</th>
              <th className="px-3 py-2 text-right">소요시간</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">제어</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((j) => (
              <tr key={j.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{j.jobCode} — {j.jobName}</td>
                <td className="px-3 py-2 font-mono text-sub">{j.cronExpression}</td>
                <td className="px-3 py-2 font-mono text-sub">{j.lastRunTime}</td>
                <td className="px-3 py-2 font-mono text-sub">{j.nextRunTime}</td>
                <td className="px-3 py-2 text-right font-mono">{j.durationSec}초</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    j.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    j.status === "RUNNING" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {j.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => runNow(j.id)}
                    disabled={j.status === "RUNNING"}
                    className="px-2 py-1 rounded bg-surface border border-line text-[11px] hover:bg-accent-soft disabled:opacity-50"
                  >
                    ▶ 즉시 실행
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
