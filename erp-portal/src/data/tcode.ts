// 표준 ERP 전체 메뉴 T-Code (트랜잭션 코드) 체계도 데이터
export interface TCodeItem {
  tcode: string;       // ERP 표준 T-Code (예: SD-04)
  sapTcode?: string;   // 대응 SAP T-Code (예: VA01)
  name: string;        // 화면 / 메뉴명
  path: string;        // 라우트 경로
  module: string;      // 모듈명
  moduleId: string;    // 모듈 ID (예: sd, mm, pp, fi 등)
  desc?: string;       // 상세 설명
}

export const ALL_TCODES: TCodeItem[] = [
  // ── 01. 영업관리 (SD) ──
  { tcode: "SD-01", sapTcode: "VD01", name: "고객 마스터", path: "/m/sd/sd-01", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-02", sapTcode: "VK11", name: "가격정책 관리", path: "/m/sd/sd-02", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-03", sapTcode: "VA11", name: "견적 관리", path: "/m/sd/sd-03", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-04", sapTcode: "VA01", name: "수주 관리 (Sales Order)", path: "/m/sd/sd-04", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-05", sapTcode: "VA41", name: "판매계약 관리", path: "/m/sd/sd-05", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-06", sapTcode: "VA05", name: "수주잔고 관리", path: "/m/sd/sd-06", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-07", sapTcode: "VL06O", name: "출하 현황", path: "/m/sd/sd-07", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-08", sapTcode: "VA61", name: "반품 관리", path: "/m/sd/sd-08", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-09", sapTcode: "FD32", name: "영업채권 수금 관리", path: "/m/sd/sd-09", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-10", sapTcode: "CRM01", name: "영업기회 (Opportunity)", path: "/m/sd/sd-10", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-11", sapTcode: "MCTA", name: "영업실적 분석", path: "/m/sd/sd-11", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-12", sapTcode: "KE30_SD", name: "고객별 손익분석", path: "/m/sd/sd-12", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-13", sapTcode: "MC+E", name: "영업 KPI 대시보드", path: "/m/sd/sd-13", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-14", sapTcode: "VKM1", name: "ATP (약속가능재고)", path: "/m/sd/sd-14", module: "영업관리", moduleId: "sd" },
  { tcode: "SD-15", sapTcode: "V23", name: "영업 인센티브 관리", path: "/m/sd/sd-15", module: "영업관리", moduleId: "sd" },

  // ── 02. SCM (공급망관리) ──
  { tcode: "SCM-01", sapTcode: "MD61", name: "수요예측 (Forecasting)", path: "/m/scm/scm-01", module: "SCM", moduleId: "scm" },
  { tcode: "SCM-02", sapTcode: "MC81", name: "S&OP 판매생산계획", path: "/m/scm/scm-02", module: "SCM", moduleId: "scm" },
  { tcode: "SCM-03", sapTcode: "MD04", name: "공급계획 (Supply Plan)", path: "/m/scm/scm-03", module: "SCM", moduleId: "scm" },
  { tcode: "SCM-04", sapTcode: "EDI01", name: "협력사 SCM 연동", path: "/m/scm/scm-04", module: "SCM", moduleId: "scm" },
  { tcode: "SCM-05", sapTcode: "MC94", name: "재고계획", path: "/m/scm/scm-05", module: "SCM", moduleId: "scm" },
  { tcode: "SCM-06", sapTcode: "RSK01", name: "공급위험 관리", path: "/m/scm/scm-06", module: "SCM", moduleId: "scm" },
  { tcode: "SCM-07", sapTcode: "MB51", name: "SCM Control Tower", path: "/m/scm/scm-07", module: "SCM", moduleId: "scm" },
  { tcode: "SCM-08", sapTcode: "SIM01", name: "공급망 시뮬레이션", path: "/m/scm/scm-08", module: "SCM", moduleId: "scm" },

  // ── 03. 구매관리 (MM) ──
  { tcode: "MM-01", sapTcode: "MK01", name: "공급업체 관리", path: "/m/mm/mm-01", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-02", sapTcode: "ME61", name: "공급업체 평가", path: "/m/mm/mm-02", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-03", sapTcode: "ME28", name: "PO 결재/승인", path: "/m/mm/mm-03", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-04", sapTcode: "ME51N", name: "구매요청 (PR)", path: "/m/mm/mm-04", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-05", sapTcode: "ME21N", name: "구매발주 (PO)", path: "/m/mm/mm-05", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-06", sapTcode: "ME2O", name: "외주구매 관리", path: "/m/mm/mm-06", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-07", sapTcode: "ME2N", name: "외주 정산 관리", path: "/m/mm/mm-07", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-08", sapTcode: "ME57", name: "원자재 구매 관리", path: "/m/mm/mm-08", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-09", sapTcode: "ME01", name: "공급사 포탈 (Supplier Portal)", path: "/m/mm/mm-09", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-10", sapTcode: "ME41", name: "부자재 구매", path: "/m/mm/mm-10", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-11", sapTcode: "ME51N_EQ", name: "설비/금형 구매", path: "/m/mm/mm-11", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-12", sapTcode: "VX01", name: "통관/수입 관리", path: "/m/mm/mm-12", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-13", sapTcode: "MCE1", name: "구매실적 분석", path: "/m/mm/mm-13", module: "구매관리", moduleId: "mm" },
  { tcode: "MM-14", sapTcode: "PUR_DB", name: "구매 Dashboard", path: "/m/mm/mm-14", module: "구매관리", moduleId: "mm" },

  // ── 04. 물류관리 (LE) ──
  { tcode: "LE-01", sapTcode: "MIGO_GR", name: "자재입고 관리", path: "/m/le/le-01", module: "물류관리", moduleId: "le" },
  { tcode: "LE-02", sapTcode: "MIGO_GI", name: "제품출고 관리", path: "/m/le/le-02", module: "물류관리", moduleId: "le" },
  { tcode: "LE-03", sapTcode: "MMBE", name: "재고 수불부", path: "/m/le/le-03", module: "물류관리", moduleId: "le" },
  { tcode: "LE-04", sapTcode: "MB1B", name: "재고이동 관리", path: "/m/le/le-04", module: "물류관리", moduleId: "le" },
  { tcode: "LE-05", sapTcode: "MSC1N", name: "LOT 추적관리", path: "/m/le/le-05", module: "물류관리", moduleId: "le" },
  { tcode: "LE-06", sapTcode: "MI01", name: "실사재고 관리", path: "/m/le/le-06", module: "물류관리", moduleId: "le" },
  { tcode: "LE-07", sapTcode: "VL02N", name: "피킹/포장 관리", path: "/m/le/le-07", module: "물류관리", moduleId: "le" },
  { tcode: "LE-08", sapTcode: "VT01N", name: "운송관리 (TMS)", path: "/m/le/le-08", module: "물류관리", moduleId: "le" },
  { tcode: "LE-09", sapTcode: "LS02N", name: "창고 위치/렉 관리", path: "/m/le/le-09", module: "물류관리", moduleId: "le" },
  { tcode: "LE-10", sapTcode: "VX02", name: "수출입 통관 관리", path: "/m/le/le-10", module: "물류관리", moduleId: "le" },
  { tcode: "LE-11", sapTcode: "VTTK", name: "물류비 정산", path: "/m/le/le-11", module: "물류관리", moduleId: "le" },
  { tcode: "LE-12", sapTcode: "LE_DB", name: "물류 Dashboard", path: "/m/le/le-12", module: "물류관리", moduleId: "le" },

  // ── 05. 생산관리 (PP) ──
  { tcode: "PP-01", sapTcode: "PP_DB", name: "생산 마스터/대시보드", path: "/m/pp/pp-01", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-02", sapTcode: "MD01", name: "생산계획 (MPS)", path: "/m/pp/pp-02", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-03", sapTcode: "MD02", name: "자재소요량계획 (MRP)", path: "/m/pp/pp-03", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-04", sapTcode: "SFC01", name: "공정통제 관리", path: "/m/pp/pp-04", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-05", sapTcode: "CA01", name: "라우팅 마스터", path: "/m/pp/pp-05", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-06", sapTcode: "CO01", name: "생산오더/작업지시", path: "/m/pp/pp-06", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-07", sapTcode: "CO11N", name: "공정실적/생산실적", path: "/m/pp/pp-07", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-08", sapTcode: "CM01", name: "공정능력/부하 분석", path: "/m/pp/pp-08", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-09", sapTcode: "IW31", name: "설비 보전/가동 현황", path: "/m/pp/pp-09", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-10", sapTcode: "CO07", name: "재작업 관리", path: "/m/pp/pp-10", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-11", sapTcode: "CO43", name: "생산 마감", path: "/m/pp/pp-11", module: "생산관리", moduleId: "pp" },
  { tcode: "PP-12", sapTcode: "OEE01", name: "OEE 종합효율 분석", path: "/m/pp/pp-12", module: "생산관리", moduleId: "pp" },

  // ── 06. 품질관리 (QM) ──
  { tcode: "QM-01", sapTcode: "QS21", name: "검사기준 관리", path: "/m/qm/qm-01", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-02", sapTcode: "QA01", name: "수입검사 관리", path: "/m/qm/qm-02", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-03", sapTcode: "QE01", name: "공정검사 관리", path: "/m/qm/qm-03", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-04", sapTcode: "QA11", name: "출하검사 관리", path: "/m/qm/qm-04", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-05", sapTcode: "MCXA", name: "검사 실적분석", path: "/m/qm/qm-05", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-06", sapTcode: "QC01", name: "SPC 통계적 공정제어", path: "/m/qm/qm-06", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-07", sapTcode: "CPK01", name: "공정능력 분석 (Cpk)", path: "/m/qm/qm-07", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-08", sapTcode: "QM01", name: "부적합 관리", path: "/m/qm/qm-08", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-09", sapTcode: "QM02", name: "8D Report", path: "/m/qm/qm-09", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-10", sapTcode: "GAUGE01", name: "계측기 관리", path: "/m/qm/qm-10", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-11", sapTcode: "CAPA01", name: "CAPA 시정/예방 조치", path: "/m/qm/qm-11", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-12", sapTcode: "QCC01", name: "고객클레임 관리", path: "/m/qm/qm-12", module: "품질관리", moduleId: "qm" },
  { tcode: "QM-13", sapTcode: "QMLOG", name: "검사장비 이력", path: "/m/qm/qm-13", module: "품질관리", moduleId: "qm" },

  // ── 07. 연구개발 (PLM) ──
  { tcode: "PLM-01", sapTcode: "CJ20N", name: "프로젝트 관리", path: "/m/plm/plm-01", module: "연구개발", moduleId: "plm" },
  { tcode: "PLM-02", sapTcode: "MM01_DEV", name: "제품 사양 관리", path: "/m/plm/plm-02", module: "연구개발", moduleId: "plm" },
  { tcode: "PLM-03", sapTcode: "CC01", name: "ECO/ECR 설계변경", path: "/m/plm/plm-03", module: "연구개발", moduleId: "plm" },
  { tcode: "PLM-04", sapTcode: "CV01N", name: "도면 관리", path: "/m/plm/plm-04", module: "연구개발", moduleId: "plm" },
  { tcode: "PLM-05", sapTcode: "STD01", name: "부품 표준화", path: "/m/plm/plm-05", module: "연구개발", moduleId: "plm" },
  { tcode: "PLM-06", sapTcode: "DMS01", name: "기술문서 관리", path: "/m/plm/plm-06", module: "연구개발", moduleId: "plm" },
  { tcode: "PLM-07", sapTcode: "HIS01", name: "부품 이력 관리", path: "/m/plm/plm-07", module: "연구개발", moduleId: "plm" },
  { tcode: "PLM-08", sapTcode: "QC_DEV", name: "시제품 품질 검증", path: "/m/plm/plm-08", module: "연구개발", moduleId: "plm" },
  { tcode: "PLM-09", sapTcode: "PROTO01", name: "시제품 제작 관리", path: "/m/plm/plm-09", module: "연구개발", moduleId: "plm" },
  { tcode: "PLM-10", sapTcode: "CS11", name: "BOM 구조 분석", path: "/m/plm/plm-10", module: "연구개발", moduleId: "plm" },

  // ── 08. 재무회계 (FI) ──
  { tcode: "FI-01", sapTcode: "FB50", name: "매출/일반 전표입력", path: "/m/fi/fi-01", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-02", sapTcode: "FMBB", name: "재무 예산관리", path: "/m/fi/fi-02", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-03", sapTcode: "F-28", name: "매출채권 (AR) / 수금", path: "/m/fi/fi-03", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-04", sapTcode: "F-53", name: "매입채무 (AP) / 지급", path: "/m/fi/fi-04", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-05", sapTcode: "FF7A", name: "자금 집행/수지 관리", path: "/m/fi/fi-05", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-06", sapTcode: "AS01", name: "고정자산 관리", path: "/m/fi/fi-06", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-07", sapTcode: "F.16", name: "월말/연말 결산", path: "/m/fi/fi-07", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-08", sapTcode: "F.01", name: "재무제표 (B/S, P/L)", path: "/m/fi/fi-08", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-09", sapTcode: "FTXP", name: "세무 관리 / 부가세", path: "/m/fi/fi-09", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-10", sapTcode: "FX01", name: "환리스크 관리", path: "/m/fi/fi-10", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-11", sapTcode: "LOAN01", name: "차입금/금융 관리", path: "/m/fi/fi-11", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-12", sapTcode: "SHR01", name: "주주/자본금 관리", path: "/m/fi/fi-12", module: "재무회계", moduleId: "fi" },
  { tcode: "FI-13", sapTcode: "IFRS01", name: "IFRS 감사 대응", path: "/m/fi/fi-13", module: "재무회계", moduleId: "fi" },

  // ── 09. 관리회계 (CO) ──
  { tcode: "CO-01", sapTcode: "KA01", name: "원가요소 마스터", path: "/m/co/co-01", module: "관리회계", moduleId: "co" },
  { tcode: "CO-02", sapTcode: "KS01", name: "원가센터 마스터", path: "/m/co/co-02", module: "관리회계", moduleId: "co" },
  { tcode: "CO-03", sapTcode: "ECPCA", name: "손익센터 마스터", path: "/m/co/co-03", module: "관리회계", moduleId: "co" },
  { tcode: "CO-04", sapTcode: "KSS4", name: "제조원가 계산", path: "/m/co/co-04", module: "관리회계", moduleId: "co" },
  { tcode: "CO-05", sapTcode: "KSV5", name: "원가 배부/분배", path: "/m/co/co-05", module: "관리회계", moduleId: "co" },
  { tcode: "CO-06", sapTcode: "ABC01", name: "활동기준원가 (ABC)", path: "/m/co/co-06", module: "관리회계", moduleId: "co" },
  { tcode: "CO-07", sapTcode: "KOB1", name: "원가 차이분석", path: "/m/co/co-07", module: "관리회계", moduleId: "co" },
  { tcode: "CO-08", sapTcode: "KP06", name: "관리회계 예산 수립", path: "/m/co/co-08", module: "관리회계", moduleId: "co" },
  { tcode: "CO-09", sapTcode: "ALLOC", name: "배부 실행 관리", path: "/m/co/co-09", module: "관리회계", moduleId: "co" },
  { tcode: "CO-10", sapTcode: "KE30", name: "COPA 수익성 분석", path: "/m/co/co-10", module: "관리회계", moduleId: "co" },
  { tcode: "CO-11", sapTcode: "S_ALR", name: "부문별 손익분석", path: "/m/co/co-11", module: "관리회계", moduleId: "co" },
  { tcode: "CO-12", sapTcode: "PROFIT", name: "제품별 손익분석", path: "/m/co/co-12", module: "관리회계", moduleId: "co" },
  { tcode: "CO-13", sapTcode: "SIM_COST", name: "목표원가 시뮬레이션", path: "/m/co/co-13", module: "관리회계", moduleId: "co" },

  // ── 10. 마케팅 (MK) ──
  { tcode: "MK-01", sapTcode: "MKT01", name: "마케팅 전략 수립", path: "/m/mk/mk-01", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-02", sapTcode: "CMP01", name: "경쟁사 동향 분석", path: "/m/mk/mk-02", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-03", sapTcode: "CHN01", name: "유통채널 분석", path: "/m/mk/mk-03", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-04", sapTcode: "SEG01", name: "고객 세그먼테이션", path: "/m/mk/mk-04", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-05", sapTcode: "CAM01", name: "캠페인 관리", path: "/m/mk/mk-05", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-06", sapTcode: "MKT02", name: "시장조사 분석", path: "/m/mk/mk-06", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-07", sapTcode: "INTEL01", name: "마켓 인텔리전스", path: "/m/mk/mk-07", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-08", sapTcode: "ROI01", name: "마케팅 ROI 분석", path: "/m/mk/mk-08", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-09", sapTcode: "COMM01", name: "브랜드 커뮤니케이션", path: "/m/mk/mk-09", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-10", sapTcode: "VOC01", name: "소셜 리스닝 VOC", path: "/m/mk/mk-10", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-11", sapTcode: "POP01", name: "매장 POP 관리", path: "/m/mk/mk-11", module: "마케팅", moduleId: "mk" },
  { tcode: "MK-12", sapTcode: "CPN01", name: "쿠폰/프로모션 관리", path: "/m/mk/mk-12", module: "마케팅", moduleId: "mk" },

  // ── 11. 서비스 (SV) ──
  { tcode: "SV-01", sapTcode: "IW51", name: "A/S 출장 스케줄링", path: "/m/sv/sv-01", module: "서비스", moduleId: "sv" },
  { tcode: "SV-02", sapTcode: "IW32_SV", name: "A/S 수리 관리", path: "/m/sv/sv-02", module: "서비스", moduleId: "sv" },
  { tcode: "SV-03", sapTcode: "MMBE_SV", name: "서비스 부품 재고", path: "/m/sv/sv-03", module: "서비스", moduleId: "sv" },
  { tcode: "SV-04", sapTcode: "VOC_SV", name: "고객 VOC 접수", path: "/m/sv/sv-04", module: "서비스", moduleId: "sv" },
  { tcode: "SV-05", sapTcode: "WARR01", name: "보증 (Warranty) 관리", path: "/m/sv/sv-05", module: "서비스", moduleId: "sv" },
  { tcode: "SV-06", sapTcode: "COST_SV", name: "서비스 비용 정산", path: "/m/sv/sv-06", module: "서비스", moduleId: "sv" },
  { tcode: "SV-07", sapTcode: "CSAT01", name: "고객만족도 조사", path: "/m/sv/sv-07", module: "서비스", moduleId: "sv" },
  { tcode: "SV-08", sapTcode: "AI_SV", name: "Field Service AI 지원", path: "/m/sv/sv-08", module: "서비스", moduleId: "sv" },
  { tcode: "SV-09", sapTcode: "MAP01", name: "현장서비스 위치 매핑", path: "/m/sv/sv-09", module: "서비스", moduleId: "sv" },
  { tcode: "SV-10", sapTcode: "STK01", name: "서비스부품 안전재고", path: "/m/sv/sv-10", module: "서비스", moduleId: "sv" },
  { tcode: "SV-11", sapTcode: "REP01", name: "보증수리 실적분석", path: "/m/sv/sv-11", module: "서비스", moduleId: "sv" },
  { tcode: "SV-12", sapTcode: "REVISIT", name: "재방문 수리 원인분석", path: "/m/sv/sv-12", module: "서비스", moduleId: "sv" },
  { tcode: "SV-13", sapTcode: "VEHICLE", name: "서비스 차량/공구 관리", path: "/m/sv/sv-13", module: "서비스", moduleId: "sv" },

  // ── 12. 기준정보 (MDM) ──
  { tcode: "MDM-01", sapTcode: "MM01", name: "품목 마스터", path: "/m/mdm/mdm-01", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-02", sapTcode: "CS01", name: "BOM 마스터", path: "/m/mdm/mdm-02", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-03", sapTcode: "XK01", name: "거래처 마스터", path: "/m/mdm/mdm-03", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-04", sapTcode: "XK02", name: "공급사 마스터", path: "/m/mdm/mdm-04", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-05", sapTcode: "CR01", name: "작업장 마스터", path: "/m/mdm/mdm-05", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-06", sapTcode: "LS01", name: "창고 마스터", path: "/m/mdm/mdm-06", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-07", sapTcode: "PP01", name: "공장 마스터", path: "/m/mdm/mdm-07", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-08", sapTcode: "IE01", name: "설비 마스터", path: "/m/mdm/mdm-08", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-09", sapTcode: "FS00", name: "계정과목 마스터", path: "/m/mdm/mdm-09", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-10", sapTcode: "OB08", name: "환율 관리", path: "/m/mdm/mdm-10", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-11", sapTcode: "PP02", name: "조직 마스터", path: "/m/mdm/mdm-11", module: "기준정보", moduleId: "mdm" },
  { tcode: "MDM-12", sapTcode: "SM30", name: "공통코드 관리", path: "/m/mdm/mdm-12", module: "기준정보", moduleId: "mdm" },

  // ── 13. 공통/플랫폼 (COM) ──
  { tcode: "COM-01", sapTcode: "SU01", name: "사용자 관리", path: "/m/com/com-01", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-02", sapTcode: "PFCG", name: "권한 매트릭스", path: "/m/com/com-02", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-03", sapTcode: "PP01_ORG", name: "조직도 관리", path: "/m/com/com-03", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-04", sapTcode: "SBWP", name: "전자결재 결재함", path: "/m/com/com-04", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-05", sapTcode: "ROLE01", name: "역할 (Role) 마스터", path: "/m/com/com-05", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-06", sapTcode: "SM30_COM", name: "시스템 코드 관리", path: "/m/com/com-06", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-07", sapTcode: "SM36", name: "배치 작업 관리", path: "/m/com/com-07", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-08", sapTcode: "NOTIF", name: "알림 센터", path: "/m/com/com-08", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-09", sapTcode: "STAT", name: "감사 및 접속 로그", path: "/m/com/com-09", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-10", sapTcode: "ST04", name: "시스템 모니터링", path: "/m/com/com-10", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-11", sapTcode: "AI_MGT", name: "AI Agent 관리", path: "/m/com/com-11", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-12", sapTcode: "BOARD", name: "공지사항 게시판", path: "/m/com/com-12", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-13", sapTcode: "WORKFLOW", name: "워크플로우 자동화", path: "/m/com/com-13", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-14", sapTcode: "AGENT_ORCH", name: "에이전트 오케스트레이션", path: "/m/com/com-14", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-15", sapTcode: "AUDIT_AN", name: "사용자 감사 분석", path: "/m/com/com-15", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-16", sapTcode: "PREF", name: "사용자 메뉴 환경설정", path: "/m/com/com-16", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-17", sapTcode: "EDI_EXT", name: "외부 EDI 인터페이스", path: "/m/com/com-17", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-18", sapTcode: "PRIVACY", name: "개인정보 보호 관리", path: "/m/com/com-18", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-19", sapTcode: "MDM_MOB", name: "모바일 디바이스 관리", path: "/m/com/com-19", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-20", sapTcode: "CURR01", name: "다중통화 마스터", path: "/m/com/com-20", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-21", sapTcode: "HR_MAP", name: "인사 권한 맵핑", path: "/m/com/com-21", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-22", sapTcode: "BRANCH", name: "사업장/법인 마스터", path: "/m/com/com-22", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-23", sapTcode: "BACKUP", name: "데이터 백업 및 복구", path: "/m/com/com-23", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-24", sapTcode: "TZ01", name: "글로벌 타임존 관리", path: "/m/com/com-24", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-25", sapTcode: "RETENTION", name: "데이터 보존 정책", path: "/m/com/com-25", module: "공통/플랫폼", moduleId: "com" },
  { tcode: "COM-26", sapTcode: "LIC01", name: "라이선스 및 구독 관리", path: "/m/com/com-26", module: "공통/플랫폼", moduleId: "com" },

  // ── 14. 경영분석 대시보드 (EIS) ──
  { tcode: "EIS-01", sapTcode: "ZKPI01", name: "경영 KPI 대시보드", path: "/executive-kpi", module: "경영분석", moduleId: "eis" },
  { tcode: "EIS-02", sapTcode: "ZMES01", name: "공장 실시간 관제", path: "/factory-control", module: "경영분석", moduleId: "eis" },
  { tcode: "EIS-03", sapTcode: "ZSCM01", name: "글로벌 SCM 맵", path: "/scm-map", module: "경영분석", moduleId: "eis" },
  { tcode: "EIS-04", sapTcode: "ZESG01", name: "ESG 탄소중립 관제", path: "/esg-carbon", module: "경영분석", moduleId: "eis" },
  { tcode: "EIS-05", sapTcode: "ZAI01", name: "AI 이상탐지 컨트롤타워", path: "/ai-anomaly", module: "경영분석", moduleId: "eis" },
  { tcode: "EIS-06", sapTcode: "ZLEG01", name: "글로벌 컴플라이언스", path: "/global-compliance", module: "경영분석", moduleId: "eis" },
];

/**
 * T-Code 및 메뉴명 기반 검색 함수
 */
export function searchTCodes(keyword: string): TCodeItem[] {
  if (!keyword || !keyword.trim()) return [];
  const q = keyword.trim().toLowerCase();

  // 1. T-code 또는 SAP T-code 완벽 일치 검색
  const exactMatches = ALL_TCODES.filter(
    (item) =>
      item.tcode.toLowerCase() === q ||
      (item.sapTcode && item.sapTcode.toLowerCase() === q)
  );

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // 2. 부분 포함 검색 (T-code, SAP T-code, 메뉴명, 모듈명)
  return ALL_TCODES.filter(
    (item) =>
      item.tcode.toLowerCase().includes(q) ||
      (item.sapTcode && item.sapTcode.toLowerCase().includes(q)) ||
      item.name.toLowerCase().includes(q) ||
      item.module.toLowerCase().includes(q)
  );
}
