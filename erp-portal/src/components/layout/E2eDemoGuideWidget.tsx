import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export interface DemoStep {
  step: number;
  tcode: string;
  sapTcode: string;
  name: string;
  path: string;
  desc: string;
  inputData: string;
  checkpoint: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    tcode: "SCM-01",
    sapTcode: "MD61",
    name: "수요예측 (Forecasting)",
    path: "/m/scm/scm-01",
    desc: "월별/주별 완제품 판매 수요예측 입력 및 확정",
    inputData: "FG-1001 (에어프라이어) 1,450대 / FG-1002 (무선스틱청소기) 650대 / FG-1003 (전기포트) 5,000대 확정",
    checkpoint: "SCM 대시보드 및 MPS에 확정 수요 수량이 실시간 반영됨",
  },
  {
    step: 2,
    tcode: "PP-02",
    sapTcode: "MD01",
    name: "주생산계획 (MPS)",
    path: "/m/pp/pp-02",
    desc: "완제품 주생산계획 수립 및 완제품 오더 생성",
    inputData: "FG-1001 (에어프라이어 5.5L) 1,200대 (완료예정일 2026-07-25) 지정 및 저장",
    checkpoint: "MPS 목록에 상태가 '확정'으로 표시됨",
  },
  {
    step: 3,
    tcode: "PP-03",
    sapTcode: "MD02",
    name: "자재소요량계획 (MRP)",
    path: "/m/pp/pp-03",
    desc: "BOM 다단계 전개 및 부족 원자재/부자재 소요량 계산",
    inputData: "[MRP 실행] 클릭 -> SF-2001, RM-3004 자재 소요량 산출",
    checkpoint: "RM-3004 (히팅코일 NiCr) 부족량 (5,900개: 소요 7,000 / 재고 1,900) 자동 계산 확인",
  },
  {
    step: 4,
    tcode: "MM-04",
    sapTcode: "ME51N",
    name: "구매요청 (PR)",
    path: "/m/mm/mm-04",
    desc: "부족 자재 구매요청 작성 및 부서 예산 자동 승인",
    inputData: "RM-3004 5,900개 구매요청 (38,350,000원, 생산팀 예산 승인)",
    checkpoint: "PR 상태 '승인' 변경 시 생산팀 집행예산 6.20억 → 6.58억 차감 반영 확인",
  },
  {
    step: 5,
    tcode: "MM-05",
    sapTcode: "ME21N",
    name: "구매발주 (PO)",
    path: "/m/mm/mm-05",
    desc: "공급사(V-1002 대덕전자) 구매 발주서 발행",
    inputData: "승인된 PR 연동 -> 발주서 생성 (입고창고 WH-102)",
    checkpoint: "발주코드(PO-XXXX) 생성 및 '발주' 상태 확인",
  },
  {
    step: 6,
    tcode: "LE-01",
    sapTcode: "MIGO_GR",
    name: "자재 입고",
    path: "/m/le/le-01",
    desc: "발주 자재 입고 처리 및 이력 추적용 신규 LOT 채번",
    inputData: "PO 선택 후 5,900개 입고 확인 -> [입고 처리] 클릭",
    checkpoint: "RM-3004 재고 수량 1,900 → 7,800개 증가 및 LOT-2607-021 생성",
  },
  {
    step: 7,
    tcode: "QM-02",
    sapTcode: "QA01",
    name: "자재 수입검사",
    path: "/m/qm/qm-02",
    desc: "입고된 원자재 LOT에 대해 샘플링 수입검사 수행",
    inputData: "신규 LOT 선택 -> AQL 샘플 154개 검사 -> 불량 0개 -> [합격]",
    checkpoint: "검사 결과 '합격' 및 해당 LOT 상태가 '가용'으로 변경",
  },
  {
    step: 8,
    tcode: "PP-06/07",
    sapTcode: "CO01/CO11N",
    name: "생산오더 & 공정실적",
    path: "/m/pp/pp-06",
    desc: "제조 작업지시 발행, 자재 백플러시 자동 차감, 완제품 입고",
    inputData: "FG-1001 (에어프라이어) 500대 지시 -> 양품 490대, 불량 10대 실적 마감",
    checkpoint: "FG-1001 재고 입고 (+490대), 하위부품 SF-2001 백플러시 차감 (−500대) 완료",
  },
  {
    step: 9,
    tcode: "SD-04",
    sapTcode: "VA01",
    name: "수주등록 & ATP",
    path: "/m/sd/sd-04",
    desc: "고객 수주 입력 및 가용재고(ATP) 납기 검증",
    inputData: "고객 C-1001 (하이마트), FG-1001 400대 (단가 82,000원) -> ATP 검증",
    checkpoint: "ATP 가용 수량 체크 후 수주 상태가 '출하예약'으로 지정",
  },
  {
    step: 10,
    tcode: "LE-02",
    sapTcode: "MIGO_GI",
    name: "제품 출고 (FIFO)",
    path: "/m/le/le-02",
    desc: "LOT 선입선출(FIFO) 기준 제품 출하 및 배송 등록",
    inputData: "수주 선택 -> [출고 처리] -> 선입선출(FIFO) 기준 400개 차감",
    checkpoint: "수주 상태 '출하완료', LOT 400개 완전 차감 소진 및 출고 로그 기록",
  },
  {
    step: 11,
    tcode: "FI-01/03",
    sapTcode: "FB50/F-28",
    name: "매출전표 & 수금",
    path: "/m/fi/fi-01",
    desc: "매출 인식 전표 전기 및 매출채권(AR) 수금 처리",
    inputData: "매출 전표 발행 (차:외상매출금 3,280만원, 대:제품매출 3,280만원) -> 수금 처리",
    checkpoint: "차대평형 일치, 전기 완료, 고객 C-1001 여신 사용액 32.00억 → 31.67억 차감",
  },
  {
    step: 12,
    tcode: "EIS-01",
    sapTcode: "ZKPI01",
    name: "원가/COPA & KPI 확인",
    path: "/executive-kpi",
    desc: "제조원가 계산, COPA 마진율 검증, 경영 대시보드 최종 확인",
    inputData: "FG-1001 표준원가 50,413원 계산 -> 경영 대시보드 통합 지표 확인",
    checkpoint: "마진율 38.5% (정상범위 20~50%) 및 경영 KPI 실적 일치 확인",
  },
];

interface E2eDemoGuideWidgetProps {
  onClose?: () => void;
}

export default function E2eDemoGuideWidget({ onClose }: E2eDemoGuideWidgetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});


  const activeStep = DEMO_STEPS[currentStepIdx];
  const isCurrentPageMatch = location.pathname === activeStep.path;

  const toggleCheck = (stepNum: number) => {
    setCheckedSteps((prev) => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) setCurrentStepIdx((i) => i - 1);
  };

  const handleNext = () => {
    if (currentStepIdx < DEMO_STEPS.length - 1) setCurrentStepIdx((i) => i + 1);
  };

  const handleGoCurrentStep = () => {
    navigate(activeStep.path);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent text-white font-bold text-xs shadow-2xl hover:scale-105 transition-all border border-white/20"
        >
          <span>🎯 E2E Demo Playbook</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
            Step {activeStep.step}/12
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-panel/95 backdrop-blur-md border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs transition-all">
      {/* 위젯 헤더 */}
      <div className="bg-surface px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="font-bold text-main flex items-center gap-1.5">
            🎯 E2E Interactive Demo Playbook
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-sub hover:text-main px-1.5 py-0.5 rounded hover:bg-panel"
            title="최소화"
          >
            ➖
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-sub hover:text-main px-1.5 py-0.5 rounded hover:bg-panel font-bold"
              title="Demo Playbook 닫기 (OFF)"
            >
              ✕
            </button>
          )}
        </div>

      </div>

      {/* 위젯 본문 */}
      <div className="p-3.5 space-y-3">
        {/* Step 프로그레스 바 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-accent">
              STEP {activeStep.step}. {activeStep.tcode} ({activeStep.sapTcode})
            </span>
            <span className="text-sub font-mono text-[10px]">
              {currentStepIdx + 1} / {DEMO_STEPS.length}
            </span>
          </div>
          <div className="h-1.5 bg-line/40 rounded-full overflow-hidden flex">
            {DEMO_STEPS.map((s, idx) => (
              <div
                key={s.step}
                onClick={() => setCurrentStepIdx(idx)}
                className={`flex-1 h-full cursor-pointer transition-colors border-r border-panel ${
                  idx === currentStepIdx
                    ? "bg-accent"
                    : checkedSteps[s.step]
                    ? "bg-emerald-500"
                    : "bg-line"
                }`}
                title={`Step ${s.step}: ${s.name}`}
              />
            ))}
          </div>
        </div>

        {/* 현재 단계 상세 정보 */}
        <div className="p-2.5 rounded-xl bg-surface border border-line/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-main text-sm">{activeStep.name}</span>
            {isCurrentPageMatch ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-[10px] border border-emerald-500/30">
                ✓ 현재 위치 화면
              </span>
            ) : (
              <button
                onClick={handleGoCurrentStep}
                className="px-2.5 py-1 rounded bg-accent text-white text-[11px] font-semibold hover:bg-accent/90 transition-colors shadow-sm"
              >
                🚀 화면 직행 ({activeStep.tcode})
              </button>
            )}
          </div>

          <p className="text-sub text-[11px] leading-relaxed">{activeStep.desc}</p>

          <div className="pt-1 border-t border-line/40 space-y-1">
            <div className="text-[11px]">
              <span className="font-semibold text-accent">📥 입력/확인 데이터: </span>
              <span className="text-main font-mono">{activeStep.inputData}</span>
            </div>
            <div className="text-[11px]">
              <span className="font-semibold text-emerald-600">✅ Pass 체크포인트: </span>
              <span className="text-sub">{activeStep.checkpoint}</span>
            </div>
          </div>
        </div>

        {/* 체크 및 이동 컨트롤 */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer text-sub hover:text-main">
            <input
              type="checkbox"
              checked={!!checkedSteps[activeStep.step]}
              onChange={() => toggleCheck(activeStep.step)}
              className="rounded accent-emerald-600 w-3.5 h-3.5"
            />
            <span className="font-medium text-[11px]">이 단계 검증 완료 (Pass)</span>
          </label>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              className="px-2.5 py-1 rounded border border-line bg-surface text-main text-[11px] disabled:opacity-40 hover:bg-panel"
            >
              ◀ 이전
            </button>
            <button
              onClick={handleNext}
              disabled={currentStepIdx === DEMO_STEPS.length - 1}
              className="px-2.5 py-1 rounded border border-line bg-surface text-main text-[11px] disabled:opacity-40 hover:bg-panel"
            >
              다음 ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
