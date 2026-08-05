// QM 품질 Mock — 수입검사, SPC 측정 데이터
import { createStore } from "../../services/store";

// ── 수입검사 (LOT 단위, AQL 샘플링) ──────────────
export const inspStore = createStore("quality.incoming-inspection", [
  { id: "IQ-26011", code: "IQ-26011", lot: "LOT-2606-004", material: "RM-3003", vendor: "V-2001", qty: 610, sample: 32, defects: 0, result: "합격", date: "2026-06-28" },
  { id: "IQ-26012", code: "IQ-26012", lot: "LOT-2606-002", material: "RM-3001", vendor: "V-1001", qty: 200000, sample: 200, defects: 1, result: "합격", date: "2026-06-24" },
  { id: "IQ-26013", code: "IQ-26013", lot: "LOT-2606-003", material: "RM-3002", vendor: "V-1002", qty: 5200, sample: 80, defects: 0, result: "대기", date: "-" },
]);

// AQL 간이 기준: 샘플 크기 = ceil(sqrt(N))*2 (상한 200), 허용 불량 = 샘플의 1%
export const sampleSize = (n: number) => Math.min(200, Math.ceil(Math.sqrt(n)) * 2);
export const acceptLimit = (sample: number) => Math.max(0, Math.floor(sample * 0.01));

// ── SPC 측정 시리즈 (관리도 + Cp/Cpk) ────────────
export interface SpcSeries {
  id: string;
  name: string;
  process: string;
  unit: string;
  target: number;
  usl: number;
  lsl: number;
  data: number[];
}

export const SPC_SERIES: SpcSeries[] = [
  {
    id: "heater-r", name: "히팅코일 저항", process: "SF-2001 히터 조립", unit: "Ω", target: 10, usl: 10.5, lsl: 9.5,
    data: [10.02, 9.98, 10.11, 9.94, 10.05, 10.21, 9.89, 10.08, 9.97, 10.13, 10.31, 10.02, 9.92, 10.06, 9.99, 10.44, 10.12, 9.95, 10.03, 9.9, 10.07, 10.18, 9.96, 10.01],
  },
  {
    id: "mlcc-cap", name: "MLCC 용량", process: "SF-2003 SMT 실장", unit: "uF", target: 10, usl: 10.8, lsl: 9.2,
    data: [10.1, 9.9, 10.3, 10.0, 9.8, 10.2, 10.5, 9.7, 10.1, 10.0, 9.6, 10.4, 10.2, 9.9, 10.7, 10.1, 9.8, 10.0, 10.3, 9.5, 10.2, 10.6, 9.9, 10.1],
  },
  {
    id: "motor-rpm", name: "모터 회전수", process: "SF-2002 모터 조립", unit: "kRPM", target: 105, usl: 110, lsl: 100,
    data: [104.8, 105.3, 106.1, 104.2, 105.8, 103.9, 105.1, 107.2, 104.6, 105.4, 106.8, 104.1, 105.9, 103.5, 105.2, 108.9, 104.9, 105.6, 103.8, 105.0, 106.3, 104.4, 105.7, 104.3],
  },
];

export function spcStats(s: SpcSeries) {
  const n = s.data.length;
  const mean = s.data.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(s.data.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const ucl = mean + 3 * std;
  const lcl = mean - 3 * std;
  const cp = (s.usl - s.lsl) / (6 * std);
  const cpk = Math.min(s.usl - mean, mean - s.lsl) / (3 * std);
  return { mean, std, ucl, lcl, cp, cpk };
}
