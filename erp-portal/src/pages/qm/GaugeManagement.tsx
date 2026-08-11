// QM-010 계측기/검사구 관리 (Gauge & Calibration Management) — 생산/품질 검측장비 주기적 검교정(Calibration) 및 합부 판정
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface GaugeItem {
  id: string;
  gaugeCode: string;
  gaugeName: string;
  modelNo: string;
  location: string; // 사용 장소 (예: A라인 검사실, SMT 수입검사대)
  calibCycleMonths: number; // 검교정 주기 (개월)
  lastCalibDate: string; // 최근 검교정일
  nextCalibDate: string; // 차기 검교정 예정일
  calibOrg: string; // 교정 기관 (예: 한국계량측정협회 KASTO)
  status: "정상" | "검교정필요" | "불합격";
}

export const gaugeStore = createStore("qm.gauge", [
  { id: "GAU-01", gaugeCode: "EQ-CAL-001", gaugeName: "디지털 버니어 캘리퍼스 150mm", modelNo: "MIT-500-181", location: "A라인 수입검사대", calibCycleMonths: 12, lastCalibDate: "2025-08-15", nextCalibDate: "2026-08-15", calibOrg: "한국표준과학연구원", status: "정상" },
  { id: "GAU-02", gaugeCode: "EQ-OSC-002", gaugeName: "4채널 오실로스코프 200MHz", modelNo: "TEK-TBS2000B", location: "전자기판 R&D 시험실", calibCycleMonths: 12, lastCalibDate: "2025-07-10", nextCalibDate: "2026-07-10", calibOrg: "KASTO 교정센터", status: "검교정필요" },
  { id: "GAU-03", gaugeCode: "EQ-THM-003", gaugeName: "정밀 3차원 측정기 (CMM)", modelNo: "ZEISS-CONTURA", location: "완제품 OQC 검사실", calibCycleMonths: 6, lastCalibDate: "2026-02-20", nextCalibDate: "2026-08-20", calibOrg: "자체 정밀교정실", status: "정상" },
]);

export default function GaugeManagement() {
  const gauges = useStore(gaugeStore) as GaugeItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = gauges.filter((g) => statusFilter === "전체" || g.status === statusFilter);

  const neededCalibCount = gauges.filter((g) => g.status === "검교정필요").length;

  const excel = () =>
    downloadCsv(
      "품질_계측기_검교정_관리대장.csv",
      ["계측기코드", "계측기명", "모델번호", "보관장소", "교정주기(월)", "최종교정일", "차기예정일", "교정기관", "상태"],
      filtered.map((g) => [
        g.gaugeCode,
        g.gaugeName,
        g.modelNo,
        g.location,
        g.calibCycleMonths,
        g.lastCalibDate,
        g.nextCalibDate,
        g.calibOrg,
        g.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. Quality Management (품질관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">계측기/검사구 관리 (QM-010)</h1>
          <span className="text-[11px] text-sub">생산/품질 정밀 측정장비 주기적 검교정(Calibration) 이력 및 소면 검정</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 등록 정밀 계측기</div>
          <div className="text-xl font-bold mt-1 font-mono">{gauges.length} <span className="text-xs font-normal">대</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">정상 사용 가능 장비</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{gauges.filter((g) => g.status === "정상").length} <span className="text-xs font-normal text-ink">대</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">검교정 도래 / 필요 장비</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{neededCalibCount} <span className="text-xs font-normal text-ink">대</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "정상", "검교정필요"].map((st) => (
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
          📥 계측기대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">장비 코드 / 명</th>
              <th className="px-3 py-2">모델 번호</th>
              <th className="px-3 py-2">사용 장소</th>
              <th className="px-3 py-2 text-right">교정 주기</th>
              <th className="px-3 py-2">최종 교정일</th>
              <th className="px-3 py-2">차기 예정일</th>
              <th className="px-3 py-2">교정 기관</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{g.gaugeCode} — {g.gaugeName}</td>
                <td className="px-3 py-2 font-mono text-sub">{g.modelNo}</td>
                <td className="px-3 py-2 text-sub font-medium">{g.location}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{g.calibCycleMonths}개월</td>
                <td className="px-3 py-2 font-mono text-sub">{g.lastCalibDate}</td>
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{g.nextCalibDate}</td>
                <td className="px-3 py-2 text-sub">{g.calibOrg}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    g.status === "정상" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {g.status}
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
