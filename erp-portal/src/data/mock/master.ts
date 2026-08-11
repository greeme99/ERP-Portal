// 전자부품·소형가전 도메인 마스터 Mock 데이터
// Sprint 7 원가 현실화: 자재단가 재조정 + labor(가공비) 필드
// MRP 24주 화요일 입고 기준: 자재별 leadTimeWeeks (리드타임 주차) 및 leadTimeCategory (단납기, 중납기, 장납기)
import { createStore } from "../../services/store";

export interface MaterialItem {
  id: string;
  code: string;
  name: string;
  type: string;
  uom: string;
  price: number;
  labor: number;
  stock: number;
  safety: number;
  status: string;
  leadTimeWeeks: number;      // 리드타임 (주차 단위: 1~8주)
  leadTimeCategory: string;   // 단납기(1주), 중납기(2~4주), 장납기(6~8주)
}

// ── 품목마스터 ──
export const materialStore = createStore("master.material", [
  { id: "FG-1001", code: "FG-1001", name: "에어프라이어 5.5L (AF-550K)", type: "완제품", uom: "EA", price: 89000, labor: 12000, stock: 1240, safety: 500, status: "사용", leadTimeWeeks: 1, leadTimeCategory: "단납기" },
  { id: "FG-1002", code: "FG-1002", name: "무선 스틱청소기 (VC-230S)", type: "완제품", uom: "EA", price: 249000, labor: 18000, stock: 380, safety: 300, status: "사용", leadTimeWeeks: 1, leadTimeCategory: "단납기" },
  { id: "FG-1003", code: "FG-1003", name: "전기포트 1.7L (EK-170W)", type: "완제품", uom: "EA", price: 39000, labor: 5000, stock: 2150, safety: 800, status: "사용", leadTimeWeeks: 1, leadTimeCategory: "단납기" },
  { id: "SF-2001", code: "SF-2001", name: "히터 어셈블리 1800W", type: "반제품", uom: "EA", price: 0, labor: 2500, stock: 860, safety: 400, status: "사용", leadTimeWeeks: 1, leadTimeCategory: "단납기" },
  { id: "SF-2002", code: "SF-2002", name: "BLDC 모터 어셈블리", type: "반제품", uom: "EA", price: 0, labor: 6000, stock: 420, safety: 300, status: "사용", leadTimeWeeks: 2, leadTimeCategory: "중납기" },
  { id: "SF-2003", code: "SF-2003", name: "컨트롤 PCB ASSY", type: "반제품", uom: "EA", price: 0, labor: 3500, stock: 1530, safety: 600, status: "사용", leadTimeWeeks: 2, leadTimeCategory: "중납기" },
  { id: "RM-3001", code: "RM-3001", name: "MLCC 0603 10uF", type: "원자재", uom: "EA", price: 45, labor: 0, stock: 480000, safety: 200000, status: "사용", leadTimeWeeks: 2, leadTimeCategory: "중납기" },
  { id: "RM-3002", code: "RM-3002", name: "PCB 4층 FR-4", type: "원자재", uom: "EA", price: 4800, labor: 0, stock: 5200, safety: 3000, status: "사용", leadTimeWeeks: 3, leadTimeCategory: "중납기" },
  { id: "RM-3003", code: "RM-3003", name: "BLDC 모터 코어", type: "원자재", uom: "EA", price: 32000, labor: 0, stock: 610, safety: 400, status: "사용", leadTimeWeeks: 6, leadTimeCategory: "장납기" },
  { id: "RM-3004", code: "RM-3004", name: "히팅코일 NiCr", type: "원자재", uom: "EA", price: 6500, labor: 0, stock: 1900, safety: 800, status: "사용", leadTimeWeeks: 4, leadTimeCategory: "중납기" },
  { id: "RM-3005", code: "RM-3005", name: "배터리셀 21700", type: "원자재", uom: "EA", price: 9800, labor: 0, stock: 2400, safety: 1500, status: "사용", leadTimeWeeks: 8, leadTimeCategory: "장납기" },
  { id: "RM-3006", code: "RM-3006", name: "ABS 수지 내열", type: "원자재", uom: "KG", price: 3800, labor: 0, stock: 8600, safety: 4000, status: "사용", leadTimeWeeks: 1, leadTimeCategory: "단납기" },
  { id: "PK-4001", code: "PK-4001", name: "포장박스 대형", type: "부자재", uom: "EA", price: 1200, labor: 0, stock: 6800, safety: 3000, status: "사용", leadTimeWeeks: 1, leadTimeCategory: "단납기" },
]);

// ── BOM (parent → child, 다단계) ──
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

export const partnerStore = createStore("master.partner", [
  { id: "C-1001", code: "C-1001", name: "하이마트", type: "고객", country: "KR", currency: "KRW", payTerm: "월말 30일", status: "거래중" },
  { id: "C-1002", code: "C-1002", name: "쿠팡", type: "고객", country: "KR", currency: "KRW", payTerm: "월말 45일", status: "거래중" },
  { id: "C-1003", code: "C-1003", name: "이마트", type: "고객", country: "KR", currency: "KRW", payTerm: "월말 30일", status: "거래중" },
  { id: "C-2001", code: "C-2001", name: "Amazon US", type: "고객", country: "US", currency: "USD", payTerm: "NET 60", status: "거래중" },
  { id: "C-2002", code: "C-2002", name: "MediaMarkt", type: "고객", country: "DE", currency: "EUR", payTerm: "NET 45", status: "거래중" },
  { id: "V-1001", code: "V-1001", name: "삼화콘덴서", type: "공급사", country: "KR", currency: "KRW", payTerm: "월말 60일", status: "거래중" },
  { id: "V-1002", code: "V-1002", name: "대덕전자", type: "공급사", country: "KR", currency: "KRW", payTerm: "월말 60일", status: "거래중" },
  { id: "V-2001", code: "V-2001", name: "Shenzhen Motor Co.", type: "공급사", country: "CN", currency: "USD", payTerm: "T/T 30", status: "거래중" },
  { id: "V-1003", code: "V-1003", name: "동양열선", type: "공급사", country: "KR", currency: "KRW", payTerm: "월말 30일", status: "거래중" },
  { id: "V-2002", code: "V-2002", name: "Ganfeng Cell", type: "공급사", country: "CN", currency: "USD", payTerm: "T/T 45", status: "거래중" },
  { id: "V-1009", code: "V-1009", name: "한빛수지", type: "공급사", country: "KR", currency: "KRW", payTerm: "현금", status: "거래중지" },
]);

export const warehouseStore = createStore("master.warehouse", [
  { id: "WH-101", code: "WH-101", name: "수원 완제품창고", plant: "수원공장", type: "완제품", status: "사용" },
  { id: "WH-102", code: "WH-102", name: "수원 원자재창고", plant: "수원공장", type: "원자재", status: "사용" },
  { id: "WH-103", code: "WH-103", name: "수원 반제품창고", plant: "수원공장", type: "반제품", status: "사용" },
  { id: "WH-201", code: "WH-201", name: "이천 물류센터", plant: "이천물류", type: "완제품", status: "사용" },
  { id: "WH-202", code: "WH-202", name: "이천 반품창고", plant: "이천물류", type: "반품", status: "사용" },
]);

export const customerStore = createStore("master.customer", [
  { id: "C-1001", code: "C-1001", name: "하이마트", country: "KR", currency: "KRW", payTerm: "월말 30일", grade: "A", creditLimit: 5000000000, creditUsed: 3200000000, status: "거래중" },
  { id: "C-1002", code: "C-1002", name: "쿠팡", country: "KR", currency: "KRW", payTerm: "월말 45일", grade: "A", creditLimit: 8000000000, creditUsed: 5100000000, status: "거래중" },
  { id: "C-1003", code: "C-1003", name: "이마트", country: "KR", currency: "KRW", payTerm: "월말 30일", grade: "B", creditLimit: 3000000000, creditUsed: 2700000000, status: "거래중" },
  { id: "C-2001", code: "C-2001", name: "Amazon US", country: "US", currency: "USD", payTerm: "NET 60", grade: "A", creditLimit: 6000000000, creditUsed: 1900000000, status: "거래중" },
  { id: "C-2002", code: "C-2002", name: "MediaMarkt", country: "DE", currency: "EUR", payTerm: "NET 45", grade: "B", creditLimit: 2500000000, creditUsed: 2450000000, status: "거래중" },
  { id: "C-1099", code: "C-1099", name: "(주)폐업상사", country: "KR", currency: "KRW", payTerm: "현금", grade: "C", creditLimit: 0, creditUsed: 0, status: "거래중지" },
]);

// MDM-04 공급사 마스터 — 거래처(partner) 중 공급사의 조달 조건 상세 (리드타임·MOQ·품질등급)
export const supplierStore = createStore("master.supplier", [
  { id: "V-1001", code: "V-1001", name: "삼화콘덴서", itemGroup: "수동부품 (MLCC)", country: "KR", currency: "KRW", payTerm: "월말 60일", leadTimeWeeks: 2, moq: 100000, qualityGrade: "A", status: "거래중" },
  { id: "V-1002", code: "V-1002", name: "대덕전자", itemGroup: "PCB", country: "KR", currency: "KRW", payTerm: "월말 60일", leadTimeWeeks: 4, moq: 2000, qualityGrade: "A", status: "거래중" },
  { id: "V-1003", code: "V-1003", name: "동양열선", itemGroup: "히팅코일", country: "KR", currency: "KRW", payTerm: "월말 30일", leadTimeWeeks: 2, moq: 1000, qualityGrade: "B", status: "거래중" },
  { id: "V-2001", code: "V-2001", name: "Shenzhen Motor Co.", itemGroup: "BLDC 모터", country: "CN", currency: "USD", payTerm: "T/T 30", leadTimeWeeks: 6, moq: 500, qualityGrade: "B", status: "거래중" },
  { id: "V-2002", code: "V-2002", name: "Ganfeng Cell", itemGroup: "배터리셀", country: "CN", currency: "USD", payTerm: "T/T 45", leadTimeWeeks: 8, moq: 5000, qualityGrade: "A", status: "거래중" },
  { id: "V-1009", code: "V-1009", name: "한빛수지", itemGroup: "ABS 수지", country: "KR", currency: "KRW", payTerm: "현금", leadTimeWeeks: 1, moq: 500, qualityGrade: "C", status: "거래중지" },
]);

// MDM-07 공장 마스터
export const plantStore = createStore("master.plant", [
  { id: "P-101", code: "P-101", name: "수원 제1제조공장", region: "경기 수원", address: "경기도 수원시 권선구 산업로 120", manager: "김제조", lineCount: 4, dailyCapacity: 3200, status: "가동중" },
  { id: "P-102", code: "P-102", name: "평택 제2스마트공장", region: "경기 평택", address: "경기도 평택시 청북읍 산단로 44", manager: "이스마트", lineCount: 3, dailyCapacity: 2600, status: "가동중" },
  { id: "P-201", code: "P-201", name: "이천 물류거점", region: "경기 이천", address: "경기도 이천시 부발읍 물류대로 8", manager: "박물류", lineCount: 0, dailyCapacity: 0, status: "가동중" },
  { id: "P-301", code: "P-301", name: "베트남 하이퐁 공장", region: "VN 하이퐁", address: "Haiphong Industrial Zone, Lot C-7", manager: "Nguyen Van A", lineCount: 2, dailyCapacity: 1800, status: "가동중" },
  { id: "P-109", code: "P-109", name: "광주 구공장", region: "광주 광산", address: "광주광역시 광산구 하남산단 6번로 31", manager: "-", lineCount: 0, dailyCapacity: 0, status: "폐쇄" },
]);

// MDM-08 설비 마스터
export const equipmentStore = createStore("master.equipment", [
  { id: "EQ-1001", code: "EQ-1001", name: "180T 사출성형기 1호", type: "사출기", plant: "수원 제1제조공장", workCenter: "WC-PRESS-01", acquiredAt: "2022-03-15", ratedCapacity: 720, pmCycleDays: 30, status: "정상" },
  { id: "EQ-1002", code: "EQ-1002", name: "SMT 칩마운터 A", type: "SMT", plant: "수원 제1제조공장", workCenter: "WC-SMT-01", acquiredAt: "2023-07-01", ratedCapacity: 1200, pmCycleDays: 14, status: "정상" },
  { id: "EQ-1003", code: "EQ-1003", name: "리플로우 오븐 8존", type: "SMT", plant: "수원 제1제조공장", workCenter: "WC-SMT-01", acquiredAt: "2023-07-01", ratedCapacity: 1200, pmCycleDays: 30, status: "정상" },
  { id: "EQ-2001", code: "EQ-2001", name: "메인 조립 컨베이어 A", type: "조립설비", plant: "평택 제2스마트공장", workCenter: "WC-ASSY-01", acquiredAt: "2021-11-20", ratedCapacity: 650, pmCycleDays: 60, status: "점검중" },
  { id: "EQ-3001", code: "EQ-3001", name: "에이징 항온항습 챔버", type: "검사설비", plant: "평택 제2스마트공장", workCenter: "WC-AGING-01", acquiredAt: "2020-05-08", ratedCapacity: 400, pmCycleDays: 90, status: "고장" },
]);

// MDM-09 계정과목 마스터 (GL Account)
export const glAccountStore = createStore("master.gl_account", [
  { id: "GL-1010", code: "1010", name: "현금및현금성자산", category: "자산", drcr: "차변", parentCode: "1000", useYn: "Y" },
  { id: "GL-1130", code: "1130", name: "매출채권", category: "자산", drcr: "차변", parentCode: "1100", useYn: "Y" },
  { id: "GL-1410", code: "1410", name: "원재료", category: "자산", drcr: "차변", parentCode: "1400", useYn: "Y" },
  { id: "GL-1430", code: "1430", name: "제품", category: "자산", drcr: "차변", parentCode: "1400", useYn: "Y" },
  { id: "GL-2010", code: "2010", name: "매입채무", category: "부채", drcr: "대변", parentCode: "2000", useYn: "Y" },
  { id: "GL-3010", code: "3010", name: "자본금", category: "자본", drcr: "대변", parentCode: "3000", useYn: "Y" },
  { id: "GL-4010", code: "4010", name: "제품매출", category: "수익", drcr: "대변", parentCode: "4000", useYn: "Y" },
  { id: "GL-5010", code: "5010", name: "제품매출원가", category: "비용", drcr: "차변", parentCode: "5000", useYn: "Y" },
  { id: "GL-5210", code: "5210", name: "급여", category: "비용", drcr: "차변", parentCode: "5200", useYn: "Y" },
  { id: "GL-5290", code: "5290", name: "폐지계정(미사용)", category: "비용", drcr: "차변", parentCode: "5200", useYn: "N" },
]);

// MDM-10 환율 관리 — 통화별 일자 고시 환율 이력 (통화 마스터는 COM-20)
export const fxRateStore = createStore("master.fx_rate", [
  { id: "FX-01", currency: "USD", rateDate: "2026-08-10", baseRate: 1362.5, buyRate: 1385.9, sellRate: 1339.1, quoteSeq: 1, source: "서울외국환중개" },
  { id: "FX-02", currency: "USD", rateDate: "2026-08-11", baseRate: 1358.2, buyRate: 1381.5, sellRate: 1334.9, quoteSeq: 1, source: "서울외국환중개" },
  { id: "FX-03", currency: "EUR", rateDate: "2026-08-10", baseRate: 1487.3, buyRate: 1516.9, sellRate: 1457.7, quoteSeq: 1, source: "서울외국환중개" },
  { id: "FX-04", currency: "EUR", rateDate: "2026-08-11", baseRate: 1491.0, buyRate: 1520.8, sellRate: 1461.2, quoteSeq: 1, source: "서울외국환중개" },
  { id: "FX-05", currency: "JPY", rateDate: "2026-08-11", baseRate: 9.21, buyRate: 9.39, sellRate: 9.03, quoteSeq: 1, source: "서울외국환중개" },
  { id: "FX-06", currency: "CNY", rateDate: "2026-08-11", baseRate: 189.4, buyRate: 198.8, sellRate: 180.0, quoteSeq: 1, source: "서울외국환중개" },
]);

// MDM-11 조직 마스터
export const orgStore = createStore("master.org", [
  { id: "ORG-100", code: "ORG-100", name: "대표이사", orgType: "본부", parentCode: "", company: "(주)헤르메스 전자", head: "정대표", headcount: 3, status: "운영중" },
  { id: "ORG-200", code: "ORG-200", name: "영업본부", orgType: "본부", parentCode: "ORG-100", company: "(주)헤르메스 전자", head: "김영업", headcount: 42, status: "운영중" },
  { id: "ORG-210", code: "ORG-210", name: "국내영업팀", orgType: "팀", parentCode: "ORG-200", company: "(주)헤르메스 전자", head: "최국내", headcount: 18, status: "운영중" },
  { id: "ORG-220", code: "ORG-220", name: "해외영업팀", orgType: "팀", parentCode: "ORG-200", company: "(주)헤르메스 전자", head: "한해외", headcount: 12, status: "운영중" },
  { id: "ORG-300", code: "ORG-300", name: "생산본부", orgType: "본부", parentCode: "ORG-100", company: "(주)헤르메스 전자", head: "이생산", headcount: 156, status: "운영중" },
  { id: "ORG-310", code: "ORG-310", name: "생산관리팀", orgType: "팀", parentCode: "ORG-300", company: "(주)헤르메스 전자", head: "박관리", headcount: 14, status: "운영중" },
  { id: "ORG-320", code: "ORG-320", name: "제조1파트", orgType: "파트", parentCode: "ORG-300", company: "(주)헤르메스 전자", head: "조제조", headcount: 68, status: "운영중" },
  { id: "ORG-400", code: "ORG-400", name: "품질보증본부", orgType: "본부", parentCode: "ORG-100", company: "(주)헤르메스 전자", head: "윤품질", headcount: 31, status: "운영중" },
  { id: "ORG-500", code: "ORG-500", name: "경영지원본부", orgType: "본부", parentCode: "ORG-100", company: "(주)헤르메스 전자", head: "강지원", headcount: 27, status: "운영중" },
  { id: "ORG-590", code: "ORG-590", name: "신사업TF", orgType: "파트", parentCode: "ORG-500", company: "(주)헤르메스 전자", head: "미정", headcount: 0, status: "신설예정" },
]);
