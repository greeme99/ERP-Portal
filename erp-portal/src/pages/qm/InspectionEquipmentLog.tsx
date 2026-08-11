// QM-013 검사장비유지보수 (Inspection Equipment Maintenance Log) — 품질 측정 시험장비 정기 교정·점검 이력 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface EquipmentLogItem {
  id: string;
  equipmentCode: string;
  equipmentName: string; // 검사 장비명 (예: 정밀 3차원 측정기 CMM-01, 기밀 측정기 LEAK-02)
  calibrationCycleMonths: number; // 정기 교정 주기 (개월)
  lastCalibrationDate: string; // 최근 교정 완료일
  nextCalibrationDueDate: string; // 차기 교정 예정일
  inspectorName: string; // 담당 품질 엔지니어
  status: "정상 사용" | "교정 예정" | "점검중 (사용중지)";
}

export const equipLogStore = createStore("qm.equipment_log", [
  { id: "EQP-01", equipmentCode: "MEAS-3D-01", equipmentName: "고정밀 3차원 접촉식 측정기 CMM-01", calibrationCycleMonths: 12, lastCalibrationDate: "2025-09-15", nextCalibrationDueDate: "2026-09-15", inspectorName: "강품질 책임", status: "정상 사용" },
  { id: "EQP-02", equipmentCode: "MEAS-LEAK-02", equipmentName: "청소기 모터 하우징 기밀 시험기 LEAK-02", calibrationCycleMonths: 6, lastCalibrationDate: "2026-02-10", nextCalibrationDueDate: "2026-08-10", inspectorName: "김측정 과장", status: "교정 예정" },
  { id: "EQP-03", equipmentCode: "MEAS-TENSILE-01", equipmentName: "인장 만능 재료 시험기 UTM-01", calibrationCycleMonths: 12, lastCalibrationDate: "2025-11-20", nextCalibrationDueDate: "2026-11-20", inspectorName: "윤검사 대리", status: "정상 사용" },
]);

export default function InspectionEquipmentLog() {
  const items = useStore(equipLogStore) as EquipmentLogItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.status === statusFilter);

  const dueCount = items.filter((i) => i.status === "교정 예정").length;

  const excel = () =>
    downloadCsv(
      "품질_검사장비_교정_유지보수_대장.csv",
      ["장비코드", "검사장비명", "교정주기(개월)", "최근교정일", "차기교정예정일", "담당엔지니어", "상태"],
      filtered.map((i) => [
        i.equipmentCode,
        i.equipmentName,
        i.calibrationCycleMonths,
        i.lastCalibrationDate,
        i.nextCalibrationDueDate,
        i.inspectorName,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. Quality Management (품질관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">검사장비유지보수 (QM-013)</h1>
          <span className="text-[11px] text-sub">품질 시험 정밀 계측 검사장비 정기 교정(Calibration) 이력 및 점검 상태 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">관리 정밀 검사장비 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">대</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">당월 교정 만료 예정 장비</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{dueCount} <span className="text-xs font-normal text-ink">대</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">교정 이행 준수율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "정상 사용", "교정 예정"].map((st) => (
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
          📥 검사장비유지보수 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">장비 코드</th>
              <th className="px-3 py-2">검사 장비명</th>
              <th className="px-3 py-2 text-right">정기 교정 주기</th>
              <th className="px-3 py-2">최근 교정 완료일</th>
              <th className="px-3 py-2">차기 교정 예정일</th>
              <th className="px-3 py-2">담당 엔지니어</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.equipmentCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.equipmentName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.calibrationCycleMonths}개월</td>
                <td className="px-3 py-2 font-mono text-sub">{i.lastCalibrationDate}</td>
                <td className="px-3 py-2 font-mono font-bold text-amber-600">{i.nextCalibrationDueDate}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.inspectorName}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.status === "교정 예정" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
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
