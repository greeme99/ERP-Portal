// ManufacturingRealtimeControl.tsx (Realtime IoT Factory Control & OEE Monitoring) — 스마트 공장 실시간 IoT 생산 관제 센터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface FactoryLineStatusItem {
  id: string;
  factoryName: string; // 공장명 (예: 평택 제1 스마트공장, 광주 제2 공장)
  lineCodeName: string; // 라인명 (예: Line 1 SMT 자장 공정, Line 2 최종 조립 라인)
  currentRunningFg: string; // 생산 진행 품목 (예: 로봇청소기 헤파필터 모듈, 무선청소기 BLDC 모터)
  overallEquipmentEfficiencyOee: number; // 설비종합효율 (OEE %)
  operatingSpeedUnitsPerHour: number; // 시간당 생산속도 (UPH)
  sensorTemperatureCelsius: number; // 모터/설비 센서 온도 (°C)
  vibrationHealthStatus: "정상 가동 (Optimal)" | "진동 센서 미세 측정" | "설비 정비 필요";
  lineStatus: "생산 가동중 (Active)" | "비가동 정비";
}

export const factoryControlStore = createStore("dashboard.factory_control", [
  { id: "LINE-01", factoryName: "평택 제1 스마트공장", lineCodeName: "Line 1 SMT 자동화 라인", currentRunningFg: "로봇청소기 메인 PCB 어셈블리 (SF-2001)", overallEquipmentEfficiencyOee: 92.4, operatingSpeedUnitsPerHour: 180, sensorTemperatureCelsius: 42.5, vibrationHealthStatus: "정상 가동 (Optimal)", lineStatus: "생산 가동중 (Active)" },
  { id: "LINE-02", factoryName: "평택 제1 스마트공장", lineCodeName: "Line 2 셀 조립 포장 라인", currentRunningFg: "스마트 로봇청소기 프리미엄 (FG-1001)", overallEquipmentEfficiencyOee: 88.6, operatingSpeedUnitsPerHour: 120, sensorTemperatureCelsius: 38.0, vibrationHealthStatus: "정상 가동 (Optimal)", lineStatus: "생산 가동중 (Active)" },
  { id: "LINE-03", factoryName: "광주 제2 생산공장", lineCodeName: "Line 3 모터 가공 수입 라인", currentRunningFg: "초고속 BLDC 모터 키트 (RM-3004)", overallEquipmentEfficiencyOee: 94.1, operatingSpeedUnitsPerHour: 240, sensorTemperatureCelsius: 45.2, vibrationHealthStatus: "정상 가동 (Optimal)", lineStatus: "생산 가동중 (Active)" },
]);

export default function ManufacturingRealtimeControl() {
  const items = useStore(factoryControlStore) as FactoryLineStatusItem[];
  const [factoryFilter, setFactoryFilter] = useState("전체");

  const filtered = items.filter((i) => factoryFilter === "전체" || i.factoryName.includes(factoryFilter));

  const excel = () =>
    downloadCsv(
      "스마트공장_실시간_IoT_생산관제_대장.csv",
      ["공장명", "생산라인명", "생산진행품목", "설비효율OEE(%)", "생산속도(UPH)", "센서온도(°C)", "진동상태", "가동상태"],
      filtered.map((i) => [
        i.factoryName,
        i.lineCodeName,
        i.currentRunningFg,
        `${i.overallEquipmentEfficiencyOee}%`,
        i.operatingSpeedUnitsPerHour,
        `${i.sensorTemperatureCelsius}°C`,
        i.vibrationHealthStatus,
        i.lineStatus,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">00. Executive & AI Command (실시간 관제)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">스마트공장 실시간 IoT 생산 관제 센터</h1>
          <span className="text-[11px] text-sub">평택 · 광주 생산 라인 IoT 센서 모니터링 · 설비종합효율(OEE) 및 UPH 실시간관제</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">전사 평균 설비종합효율 (OEE)</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">
            {(filtered.reduce((acc, i) => acc + i.overallEquipmentEfficiencyOee, 0) / (filtered.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">실시간 모니터링 라인 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개 라인</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">IoT 센서 건강 상태 (Optimal)</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">공장:</span>
          {["전체", "평택", "광주"].map((f) => (
            <button
              key={f}
              onClick={() => setFactoryFilter(f)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                factoryFilter === f
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 IoT관제 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">공장명</th>
              <th className="px-3 py-2">생산 라인명</th>
              <th className="px-3 py-2">현재 실시간 투입 품목</th>
              <th className="px-3 py-2 text-right">설비종합효율 (OEE)</th>
              <th className="px-3 py-2 text-right">생산 속도 (UPH)</th>
              <th className="px-3 py-2 text-right">센서 온도 (°C)</th>
              <th className="px-3 py-2">진동 및 건강 상태</th>
              <th className="px-3 py-2">가동 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-bold text-blue-600 text-[11px]">{i.factoryName}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.lineCodeName}</td>
                <td className="px-3 py-2 font-semibold text-emerald-600 text-[11px]">{i.currentRunningFg}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.overallEquipmentEfficiencyOee.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{i.operatingSpeedUnitsPerHour} UPH</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.sensorTemperatureCelsius.toFixed(1)}°C</td>
                <td className="px-3 py-2 font-medium text-ink text-[11px]">{i.vibrationHealthStatus}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.lineStatus}
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
