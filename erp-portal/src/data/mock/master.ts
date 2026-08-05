// 전자부품·소형가전 도메인 마스터 Mock 데이터
// Sprint 7 원가 현실화: 자재단가 재조정 + labor(가공비) 필드 — 목표 매출총이익률 35~40%
import { createStore } from "../../services/store";

// ── 품목마스터 (price: 잎=구매단가/FG=판매정가, labor: 해당 품목 가공·조립비) ──
export const materialStore = createStore("master.material", [
  { id: "FG-1001", code: "FG-1001", name: "에어프라이어 5.5L (AF-550K)", type: "완제품", uom: "EA", price: 89000, labor: 12000, stock: 1240, safety: 500, status: "사용" },
  { id: "FG-1002", code: "FG-1002", name: "무선 스틱청소기 (VC-230S)", type: "완제품", uom: "EA", price: 249000, labor: 18000, stock: 380, safety: 300, status: "사용" },
  { id: "FG-1003", code: "FG-1003", name: "전기포트 1.7L (EK-170W)", type: "완제품", uom: "EA", price: 39000, labor: 5000, stock: 2150, safety: 800, status: "사용" },
  { id: "SF-2001", code: "SF-2001", name: "히터 어셈블리 1800W", type: "반제품", uom: "EA", price: 0, labor: 2500, stock: 860, safety: 400, status: "사용" },
  { id: "SF-2002", code: "SF-2002", name: "BLDC 모터 어셈블리", type: "반제품", uom: "EA", price: 0, labor: 6000, stock: 420, safety: 300, status: "사용" },
  { id: "SF-2003", code: "SF-2003", name: "컨트롤 PCB ASSY", type: "반제품", uom: "EA", price: 0, labor: 3500, stock: 1530, safety: 600, status: "사용" },
  { id: "RM-3001", code: "RM-3001", name: "MLCC 0603 10uF", type: "원자재", uom: "EA", price: 45, labor: 0, stock: 480000, safety: 200000, status: "사용" },
  { id: "RM-3002", code: "RM-3002", name: "PCB 4층 FR-4", type: "원자재", uom: "EA", price: 4800, labor: 0, stock: 5200, safety: 3000, status: "사용" },
  { id: "RM-3003", code: "RM-3003", name: "BLDC 모터 코어", type: "원자재", uom: "EA", price: 32000, labor: 0, stock: 610, safety: 400, status: "사용" },
  { id: "RM-3004", code: "RM-3004", name: "히팅코일 NiCr", type: "원자재", uom: "EA", price: 6500, labor: 0, stock: 1900, safety: 800, status: "사용" },
  { id: "RM-3005", code: "RM-3005", name: "배터리셀 21700", type: "원자재", uom: "EA", price: 9800, labor: 0, stock: 2400, safety: 1500, status: "사용" },
  { id: "RM-3006", code: "RM-3006", name: "ABS 수지 내열", type: "원자재", uom: "KG", price: 3800, labor: 0, stock: 8600, safety: 4000, status: "사용" },
  { id: "PK-4001", code: "PK-4001", name: "포장박스 대형", type: "부자재", uom: "EA", price: 1200, labor: 0, stock: 6800, safety: 3000, status: "사용" },
]);

// ── BOM (parent → child, 다단계) — Sprint 7: 케이스용 ABS 소요량 현실화 ──
export const bomStore = createStore("master.bom", [
  { id: "B-01", parent: "FG-1001", child: "SF-2001", qty: 1, uom: "EA" },
  { id: "B-02", parent: "FG-1001", child: "SF-2003", qty: 1, uom: "EA" },
  { id: "B-03", parent: "FG-1001", child: "RM-3006", qty: 2.5, uom: "KG" },
  { id: "B-04", parent: "FG-1001", child: "PK-4001", qty: 1, uom: "EA" },
  { id: "B-05", parent: "SF-2001", child: "RM-3004", qty: 1, uom: "EA" },
  { id: "B-06", parent: "SF-2003", child: "RM-3001", qty: 24, uom: "EA" },
  { id: "B-07", parent: "SF-2003", child: "RM-3002", qty: 1, uom: "EA" },
  { id: "B-08", parent: "FG-1002", child: "SF-2002", qty: 1, uom: "EA" },
  { id: "B-09", parent: "FG-1002", child: "SF-2003", qty: 1, uom: "EA" },
  { id: "B-10", parent: "FG-1002", child: "RM-3005", qty: 4, uom: "EA" },
  { id: "B-11", parent: "FG-1002", child: "RM-3006", qty: 1.5, uom: "KG" },
  { id: "B-12", parent: "FG-1002", child: "PK-4001", qty: 1, uom: "EA" },
  { id: "B-13", parent: "SF-2002", child: "RM-3003", qty: 1, uom: "EA" },
  { id: "B-14", parent: "FG-1003", child: "SF-2001", qty: 1, uom: "EA" },
  { id: "B-15", parent: "FG-1003", child: "RM-3006", qty: 0.6, uom: "KG" },
  { id: "B-16", parent: "FG-1003", child: "PK-4001", qty: 1, uom: "EA" },
]);

// ── 거래처마스터 (고객+공급사 통합) ──────────────
export const partnerStore = createStore("master.partner", [
  { id: "C-1001", code: "C-1001", name: "하이마트", type: "고객", country: "KR", currency: "KRW", payTerm: "월말 30일", status: "거래중" },
  { id: "C-1002", code: "C-1002", name: "쿠팡", type: "고객", country: "KR", currency: "KRW", payTerm: "월말 45일", status: "거래중" },
  { id: "C-1003", code: "C-1003", name: "이마트", type: "고객", country: "KR", currency: "KRW", payTerm: "월말 30일", status: "거래중" },
  { id: "C-2001", code: "C-2001", name: "Amazon US", type: "고객", country: "US", currency: "USD", payTerm: "NET 60", status: "거래중" },
  { id: "C-2002", code: "C-2002", name: "MediaMarkt", type: "고객", country: "DE", currency: "EUR", payTerm: "NET 45", status: "거래중" },
  { id: "V-1001", code: "V-1001", name: "삼화콘덴서", type: "공급사", country: "KR", currency: "KRW", payTerm: "월말 60일", status: "거래중" },
  { id: "V-1002", code: "V-1002", name: "대덕전자", type: "공급사", country: "KR", currency: "KRW", payTerm: "월말 60일", status: "거래중" },
  { id: "V-2001", code: "V-2001", name: "Shenzhen Motor Co.", type: "공급사", country: "CN", currency: "USD", payTerm: "T/T 30", status: "거래중" },
]);

// ── 창고마스터 ──────────────────────────────────
export const warehouseStore = createStore("master.warehouse", [
  { id: "WH-101", code: "WH-101", name: "수원 완제품창고", plant: "수원공장", type: "완제품", status: "사용" },
  { id: "WH-102", code: "WH-102", name: "수원 원자재창고", plant: "수원공장", type: "원자재", status: "사용" },
  { id: "WH-103", code: "WH-103", name: "수원 반제품창고", plant: "수원공장", type: "반제품", status: "사용" },
  { id: "WH-201", code: "WH-201", name: "이천 물류센터", plant: "이천물류", type: "완제품", status: "사용" },
  { id: "WH-202", code: "WH-202", name: "이천 반품창고", plant: "이천물류", type: "반품", status: "사용" },
]);

// ── 고객마스터 (SD-001: 등급·신용한도) ───────────
export const customerStore = createStore("master.customer", [
  { id: "C-1001", code: "C-1001", name: "하이마트", country: "KR", currency: "KRW", payTerm: "월말 30일", grade: "A", creditLimit: 5000000000, creditUsed: 3200000000, status: "거래중" },
  { id: "C-1002", code: "C-1002", name: "쿠팡", country: "KR", currency: "KRW", payTerm: "월말 45일", grade: "A", creditLimit: 8000000000, creditUsed: 5100000000, status: "거래중" },
  { id: "C-1003", code: "C-1003", name: "이마트", country: "KR", currency: "KRW", payTerm: "월말 30일", grade: "B", creditLimit: 3000000000, creditUsed: 2700000000, status: "거래중" },
  { id: "C-2001", code: "C-2001", name: "Amazon US", country: "US", currency: "USD", payTerm: "NET 60", grade: "A", creditLimit: 6000000000, creditUsed: 1900000000, status: "거래중" },
  { id: "C-2002", code: "C-2002", name: "MediaMarkt", country: "DE", currency: "EUR", payTerm: "NET 45", grade: "B", creditLimit: 2500000000, creditUsed: 2450000000, status: "거래중" },
  { id: "C-1099", code: "C-1099", name: "(주)폐업상사", country: "KR", currency: "KRW", payTerm: "현금", grade: "C", creditLimit: 0, creditUsed: 0, status: "거래중지" },
]);
