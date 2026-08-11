// COM-023 데이터백업복구 (Database Backup & Disaster Recovery Schedule) — ERP 핵심 DB 스냅샷 백업 및 재해 복구 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface DataBackupItem {
  id: string;
  backupJobId: string;
  backupType: "매일 증분 백업 (Incremental)" | "주간 풀 백업 (Full Backup)";
  backupTargetDb: string; // 대상 DB (예: ERP Master PostgreSQL DB, SCM Oracle DB)
  backupStorageLocation: string; // 백업 저장소 (예: AWS S3 Seoul Region Vault, Naver Cloud Off-site)
  backupSizeBytesGb: number; // 백업 파일 용량 (GB)
  integrityVerificationStatus: "무결성 복구 검증 성공 (PASS)" | "백업 진행중";
  lastBackupTimestamp: string;
}

export const dataBackupStore = createStore("com.data_backup", [
  { id: "BAK-01", backupJobId: "BACKUP-2026-0806", backupType: "매일 증분 백업 (Incremental)", backupTargetDb: "ERP Main PostgreSQL 16 DB", backupStorageLocation: "AWS S3 Seoul Region Encrypted Vault", backupSizeBytesGb: 45.8, integrityVerificationStatus: "무결성 복구 검증 성공 (PASS)", lastBackupTimestamp: "2026-08-06 02:00" },
  { id: "BAK-02", backupJobId: "BACKUP-WEEKLY-31", backupType: "주간 풀 백업 (Full Backup)", backupTargetDb: "ERP Main PostgreSQL 16 DB", backupStorageLocation: "Naver Cloud Off-site Cold Storage", backupSizeBytesGb: 280.5, integrityVerificationStatus: "무결성 복구 검증 성공 (PASS)", lastBackupTimestamp: "2026-08-03 01:00" },
]);

export default function DataBackupRecovery() {
  const items = useStore(dataBackupStore) as DataBackupItem[];
  const [typeFilter, setTypeFilter] = useState("전체");

  const filtered = items.filter((i) => typeFilter === "전체" || i.backupType.includes(typeFilter));

  const totalBackupSizeGb = filtered.reduce((acc, i) => acc + i.backupSizeBytesGb, 0);

  const excel = () =>
    downloadCsv(
      "시스템_데이터_백업_복구_스케줄_대장.csv",
      ["백업작업ID", "백업유형", "대상DB", "백업저장소", "용량(GB)", "복구검증상태", "백업실행일시"],
      filtered.map((i) => [
        i.backupJobId,
        i.backupType,
        i.backupTargetDb,
        i.backupStorageLocation,
        i.backupSizeBytesGb,
        i.integrityVerificationStatus,
        i.lastBackupTimestamp,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">데이터백업복구 (COM-023)</h1>
          <span className="text-[11px] text-sub">ERP DB 자동 스냅샷 백업 스케줄링 · 이종 멀티 클라우드 보존 및 무결성 복구(Restore) 검증</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 안전 보존 백업 용량</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{totalBackupSizeGb.toFixed(1)} <span className="text-xs font-normal text-ink">GB</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">DB 무결성 복구 검증 성공률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0% (PASS)</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">이종 2중화 클라우드 백업 이행</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">유형:</span>
          {["전체", "증분", "풀 백업"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                typeFilter === t
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 백업복구 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">백업 작업 ID</th>
              <th className="px-3 py-2">백업 유형 구분</th>
              <th className="px-3 py-2">대상 DB 시스템</th>
              <th className="px-3 py-2">백업 저장소 위치</th>
              <th className="px-3 py-2 text-right">파일 용량 (GB)</th>
              <th className="px-3 py-2">무결성 복구 검증</th>
              <th className="px-3 py-2">최근 백업 실행 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.backupJobId}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.backupType}</td>
                <td className="px-3 py-2 font-semibold text-purple-700 text-[11px]">{i.backupTargetDb}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.backupStorageLocation}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.backupSizeBytesGb.toFixed(1)}GB</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.integrityVerificationStatus}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.lastBackupTimestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
