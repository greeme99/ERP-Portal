// 1.0_Standard_ERP_Menu_Structure.md 기반 13개 모듈 메뉴 트리
export interface MenuItem {
  name: string;
  slug: string;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  icon: string;
  items: MenuItem[];
}

const slugify = (moduleId: string, idx: number) => `${moduleId}-${String(idx + 1).padStart(2, "0")}`;

const build = (
  id: string,
  code: string,
  name: string,
  nameEn: string,
  icon: string,
  itemNames: string[]
): Module => ({
  id,
  code,
  name,
  nameEn,
  icon,
  items: itemNames.map((n, i) => ({ name: n, slug: slugify(id, i) })),
});

export const MODULES: Module[] = [
  build("sd", "01", "영업관리", "Sales", "💼", ["고객마스터", "가격정책 관리", "견적관리", "수주관리", "판매계약관리", "수주 잔고", "출하현황", "반품관리", "채권관리", "영업활동", "영업실적관리", "고객별 손익분석", "영업분석", "납기약속"]),
  build("scm", "02", "SCM", "Supply Chain", "🔗", ["수요예측", "S&OP 판매·운영 계획", "공급계획", "협력사 SCM", "재고계획", "공급위험관리", "SCM Control Tower", "공급망 시뮬레이션", "SCM Dashboard"]),
  build("mm", "03", "구매관리", "Procurement", "🛒", ["공급업체관리", "공급사 평가", "구매승인", "구매요청 PR", "구매발주 PO", "외주구매", "외주가공 정산", "원재료 구매", "공급사 포털", "설비 구매", "금형 구매", "통관관리", "수입관리", "구매실적관리", "구매 Dashboard"]),
  build("le", "04", "물류관리", "Logistics", "🚚", ["입고관리", "출고관리", "수불관리", "재고이동", "LOT 관리", "재고조사", "피킹/패킹", "운송관리 TMS", "로케이션관리", "수출입 및 통관관리", "수입관리", "보험관리", "클레임관리", "물류 Dashboard"]),
  build("pp", "05", "생산관리", "Production", "🏭", ["생산 종합대시보드", "생산계획 MPS", "MRP 자재소요량계획", "공정관리", "공정/라우팅", "작업지시·실적", "공정실적관리", "가동률 분석", "설비관리", "재작업관리", "생산마감", "설비가동현황", "OEE 분석", "생산 Dashboard"]),
  build("qm", "06", "품질관리", "Quality", "🔍", ["검사기준관리", "수입검사", "공정검사", "출하검사", "검사분석", "SPC 관리도", "공정능력분석 Cpk", "부적합관리 / 8D Report", "8D Report", "계측기/검사구 관리", "CAPA", "고객품질클레임"]),
  build("plm", "07", "연구개발", "Engineering", "🧪", ["프로젝트 관리", "제품사양", "ECO / ECR 설계변경", "도면관리", "부품표준화", "기술문서관리", "변경이력", "시품질", "시제품관리", "BOM 구성분석"]),
  build("fi", "08", "재무회계", "Financial", "💰", ["전표관리", "예산관리", "매출채권 AR", "매입채무 AP", "자금관리", "고정자산관리", "결산관리", "결산관리", "세무관리", "외환관리", "차입금및파생상품", "주주명부및배당관리"]),
  build("co", "09", "관리회계", "Controlling", "📊", ["원가요소마스터", "코스트센터마스터", "손익센터마스터", "제조원가", "원가배부", "ABC원가", "차이분석", "예산관리 · 편성", "배부관리", "수익성분석 COPA", "손익분석", "경영 Dashboard"]),
  build("mk", "10", "마케팅", "Marketing", "📣", ["마케팅 전략", "경쟁사분석", "채널분석", "고객분석", "캠페인관리", "시장분석", "마켓인텔리전스", "ROI 분석", "브랜드커뮤니케이션"]),
  build("sv", "11", "서비스", "Service", "🛠️", ["AS접수", "AS 접수 / 수리관리", "AS부품재고", "VOC관리", "Warranty 관리", "서비스 비용관리", "고객만족도", "필드서비스 AI기술지원"]),
  build("mdm", "12", "기준정보", "Master Data", "🗂️", ["품목마스터", "BOM 마스터", "거래처마스터", "공급사마스터", "작업장마스터", "창고마스터", "공장마스터", "설비마스터", "계정과목마스터", "환율관리", "조직마스터", "공통코드"]),
  build("com", "13", "공통/플랫폼", "Platform", "⚙️", ["사용자관리", "권한관리", "조직관리", "전자결재", "권한그룹마스터", "API Gateway", "배치관리", "알림센터", "로그관리", "시스템 모니터링", "AI Agent 관리", "공지게시판"]),
];

export function findMenu(moduleId?: string, slug?: string) {
  const mod = MODULES.find((m) => m.id === moduleId);
  const item = mod?.items.find((i) => i.slug === slug);
  return { mod, item };
}
