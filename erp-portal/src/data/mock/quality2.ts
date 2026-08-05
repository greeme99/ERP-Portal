// QM 확장 Mock (Sprint 7) — 공정검사, 부적합/8D, CAPA
import { createStore } from "../../services/store";

// ── 공정검사 (QM-003) — 작업지시 공정 단계 검사 ──
export const procInspStore = createStore("quality.process-inspection", [
  { id: "PQ-26021", code: "PQ-26021", wo: "WO-26070", material: "FG-1003", process: "조립", sample: 50, defects: 1, result: "합격", date: "2026-06-30" },
]);

// ── 부적합 관리 / 8D (QM-008) ────────────────────
// D1~D8 단계: 팀구성→문제정의→봉쇄→근본원인→시정조치→검증→예방→종결
export const D_STEPS = ["D1 팀구성", "D2 문제정의", "D3 봉쇄조치", "D4 근본원인", "D5 시정조치", "D6 효과검증", "D7 재발방지", "D8 종결"];

export const ncStore = createStore("quality.nonconformance", [
  {
    id: "NC-26001", code: "NC-26001", source: "수입검사", ref: "-", material: "RM-3003", vendor: "V-2001",
    qty: 12, defectType: "치수불량", severity: "중", dStep: 3, capa: "", status: "진행", date: "2026-06-20",
    desc: "BLDC 모터 코어 외경 규격 초과 (Ø+0.08)",
  },
]);

export const NC_STATUS_STYLE: Record<string, string> = {
  진행: "bg-amber-100 text-amber-700",
  종결: "bg-emerald-100 text-emerald-700",
};

export const SEVERITY_STYLE: Record<string, string> = {
  경: "bg-slate-100 text-slate-600",
  중: "bg-amber-100 text-amber-700",
  중대: "bg-red-100 text-red-700",
};

// ── CAPA (QM-011) — 시정·예방조치 ────────────────
export const capaStore = createStore("quality.capa", [
  {
    id: "CAPA-26001", code: "CAPA-26001", nc: "NC-26001", type: "시정조치", owner: "품질팀",
    action: "공급사 SPC 관리 강화 요청 + 입고 전수검사 전환", dueDate: "2026-07-15", status: "진행", effectiveness: "-",
  },
]);

export const CAPA_STATUS_STYLE: Record<string, string> = {
  진행: "bg-amber-100 text-amber-700",
  완료: "bg-emerald-100 text-emerald-700",
  지연: "bg-red-100 text-red-700",
};
