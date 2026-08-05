// PLM(PDM) Mock (Sprint 8) — 설계변경(ECO/ECR), 도면, 시제품
import { createStore } from "../../services/store";

// ── ECO/ECR 설계변경 ─────────────────────────────
// 상태: 요청(ECR) → 승인(ECO) → 적용(BOM 반영) / 반려
// changeType: 자재추가 / 자재삭제 / 수량변경 / 자재대체
export const ecoStore = createStore("pdm.eco", [
  {
    id: "ECO-26001", code: "ECO-26001", parent: "FG-1001", changeType: "수량변경",
    child: "RM-3006", newChild: "", qty: 2.5, reason: "케이스 두께 상향 (내열 보강)",
    requester: "연구소", date: "2026-06-27", status: "적용", effectiveDate: "2026-07-01",
  },
  {
    id: "ECO-26002", code: "ECO-26002", parent: "FG-1002", changeType: "자재대체",
    child: "RM-3005", newChild: "RM-3005", qty: 4, reason: "배터리셀 공급사 이원화 검토",
    requester: "연구소", date: "2026-07-01", status: "요청", effectiveDate: "",
  },
]);

export const CHANGE_TYPES = ["자재추가", "자재삭제", "수량변경", "자재대체"];

export const ECO_STATUS_STYLE: Record<string, string> = {
  요청: "bg-amber-100 text-amber-700",
  승인: "bg-blue-100 text-blue-700",
  적용: "bg-emerald-100 text-emerald-700",
  반려: "bg-red-100 text-red-700",
};

// ── 도면관리 ─────────────────────────────────────
export const drawingStore = createStore("pdm.drawing", [
  { id: "DWG-1001", code: "DWG-1001", material: "FG-1001", name: "에어프라이어 외형도", rev: "B", status: "승인", eco: "ECO-26001", date: "2026-07-01" },
  { id: "DWG-1002", code: "DWG-1002", material: "FG-1002", name: "스틱청소기 조립도", rev: "A", status: "승인", eco: "-", date: "2026-05-12" },
  { id: "DWG-2001", code: "DWG-2001", material: "SF-2003", name: "컨트롤 PCB 아트웍", rev: "C", status: "승인", eco: "-", date: "2026-06-03" },
  { id: "DWG-3001", code: "DWG-3001", material: "FG-1003", name: "전기포트 사출 금형도", rev: "A", status: "작성", eco: "-", date: "2026-07-02" },
]);

export const DWG_STATUS_STYLE: Record<string, string> = {
  작성: "bg-amber-100 text-amber-700",
  승인: "bg-emerald-100 text-emerald-700",
  폐기: "bg-slate-200 text-slate-500",
};

// Rev 다음 문자 (A→B→C...)
export const nextRev = (r: string) => String.fromCharCode((r || "@").charCodeAt(0) + 1);

// ── 시제품관리 ───────────────────────────────────
export const prototypeStore = createStore("pdm.prototype", [
  { id: "PT-26001", code: "PT-26001", material: "FG-1001", purpose: "내열 케이스 검증", qty: 5, buildDate: "2026-06-20", result: "합격", note: "80도 24h 이상 무변형" },
  { id: "PT-26002", code: "PT-26002", material: "FG-1002", purpose: "배터리 이원화 성능", qty: 3, buildDate: "2026-07-01", result: "진행", note: "" },
]);

export const PT_STATUS_STYLE: Record<string, string> = {
  진행: "bg-amber-100 text-amber-700",
  합격: "bg-emerald-100 text-emerald-700",
  불합격: "bg-red-100 text-red-700",
};
