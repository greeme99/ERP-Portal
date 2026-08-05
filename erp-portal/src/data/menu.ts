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
  build("sd", "01", "영업관리", "Sales", "💼", [
    "고객마스터", "가격정책 관리", "견적관리", "수주관리", "판매계약관리",
    "출하관리", "매출관리", "반품관리", "서비스오더관리", "채권조회",
    "영업실적관리", "고객별 손익분석", "제품별 손익분석", "영업 KPI Dashboard",
  ]),
  build("scm", "02", "SCM", "Supply Chain", "🔗", [
    "수요예측(Forecasting)", "S&OP", "공급계획(Supply Planning)", "생산계획(MPS)",
    "재고계획", "공급위험관리", "공급망 가시성(Control Tower)", "공급망 시뮬레이션", "SCM Dashboard",
  ]),
  build("mm", "03", "구매관리", "Procurement", "🛒", [
    "공급업체관리", "공급업체 평가", "구매계약관리", "구매요청(PR)", "구매발주(PO)",
    "외주구매", "위탁구매", "원재료 구매", "부자재 구매", "설비 구매", "금형 구매",
    "통관관리", "수입관리", "구매실적관리", "구매 Dashboard",
  ]),
  build("le", "04", "물류관리", "Logistics", "🚚", [
    "입고관리", "출고관리", "창고관리(WMS)", "재고이동", "LOT 관리", "Serial 관리",
    "Container 관리", "운송관리(TMS)", "물류비 정산", "수출관리", "수입관리",
    "보험관리", "클레임관리", "물류 Dashboard",
  ]),
  build("pp", "05", "생산관리", "Production", "🏭", [
    "생산마스터", "생산계획", "MRP", "자재소요계획", "생산오더", "작업지시",
    "공정실적", "생산실적", "외주생산", "재작업관리", "생산마감",
    "설비가동현황", "OEE 분석", "생산 Dashboard",
  ]),
  build("qm", "06", "품질관리", "Quality", "🔍", [
    "검사기준관리", "수입검사", "공정검사", "출하검사", "LOT Traceability",
    "SPC", "공정능력분석", "부적합관리", "8D Report", "고객클레임관리",
    "CAPA", "품질 Dashboard",
  ]),
  build("plm", "07", "연구개발", "Engineering", "🧪", [
    "품목관리", "BOM 관리", "ECO/ECR", "도면관리", "부품표준화", "설계표준화",
    "프로젝트관리", "개발원가관리", "시제품관리", "R&D Dashboard",
  ]),
  build("fi", "08", "재무회계", "Financial", "💰", [
    "전표관리", "일반회계", "매출채권", "매입채무", "자금관리", "고정자산관리",
    "연결회계", "결산관리", "세무관리", "IFRS 관리", "내부회계관리", "재무 Dashboard",
  ]),
  build("co", "09", "관리회계", "Controlling", "📊", [
    "원가센터", "손익센터", "프로젝트원가", "제조원가", "표준원가", "실제원가",
    "차이분석", "예산관리", "배부관리", "수익성분석(COPA)", "손익분석", "경영 Dashboard",
  ]),
  build("mk", "10", "마케팅", "Marketing", "📣", [
    "마케팅계획", "프로모션관리", "판촉비관리", "광고비관리", "캠페인관리",
    "시장분석", "경쟁사분석", "ROI 분석", "마케팅 Dashboard",
  ]),
  build("sv", "11", "서비스", "Service", "🛠️", [
    "고객지원", "AS 접수", "수리관리", "서비스 부품관리", "Warranty 관리",
    "서비스 비용관리", "Field Service", "서비스 Dashboard",
  ]),
  build("mdm", "12", "기준정보", "Master Data", "🗂️", [
    "품목마스터", "BOM 마스터", "거래처마스터", "공급사마스터", "조직마스터",
    "창고마스터", "공장마스터", "라인마스터", "설비마스터", "계정과목마스터",
    "환율관리", "코드관리",
  ]),
  build("com", "13", "공통/플랫폼", "Platform", "⚙️", [
    "사용자관리", "권한관리", "Workflow", "전자결재", "인터페이스 관리",
    "API Gateway", "배치관리", "알림센터", "로그관리", "시스템 모니터링",
    "AI Agent 관리", "ESG / Compliance",
  ]),
];

export function findMenu(moduleId?: string, slug?: string) {
  const mod = MODULES.find((m) => m.id === moduleId);
  const item = mod?.items.find((i) => i.slug === slug);
  return { mod, item };
}
