# 📋 ERP Portal Project Hand-over Notes (for Claude / Next Agent)

> **문서 목적**: 본 인수인계 노트는 바이브 코딩으로 구축된 **소비자용 소형가전 및 전자부품 제조 기업용 Standard ERP Portal** 프로젝트의 현재 진행 상태, 완성된 기능 아키텍처, 데이터 구조, 검증 결과 및 다음 추천 작업(Next Steps)을 다음 에이전트(Claude)가 즉시 이어서 개발/승계할 수 있도록 작성되었습니다.

---

## 1. 📌 프로젝트 개요 및 환경

- **프로젝트 명**: Standard ERP Portal (소형가전·전자부품 제조 맞춤형 ERP)
- **기술 스택**: React + Vite + TypeScript + TailwindCSS
- **GitHub 저장소**: `https://github.com/greeme99/ERP-Portal.git` (`main` 브랜치에 최신 커밋/푸시 완료됨)
- **로컬 서버**: `http://localhost:5180/` (Vite dev server)
- **주요 라우팅 계층**: `src/App.tsx`, `src/components/layout/Layout.tsx`

---

## 2. 🚀 주요 구현 완료 기능 (Current Milestone Accomplishments)

### 1) 24주 Weekly SCM & 17~24주차 Holt-Winters AI 통계예측 모델
- **화면**: `src/pages/scm/DemandForecast.tsx`
- **엔진**: `src/services/aiStatsModel.ts`
- **구조**: 24주차 시계열 Plan Cycle (`2026-W27` ~ `2026-W50`)
  - **1 ~ 16주차 (`W27`~`W42`)**: 영업/고객사 수수 수작업 예측 및 엑셀 업로드
  - **17 ~ 24주차 (`W43`~`W50`)**: **🤖 Holt-Winters 지수평균 추세 모델 (α=0.4, β=0.2)**, 이동평균, 선형회귀 앙상블 AI 통계예측 및 95% 신뢰구간 (Confidence Interval) 산출/일괄 적용 모달

### 2) 고객사 구매계획 24주차 매트릭스(피벗) 엑셀/CSV 업로드 및 양식 다운로드
- **화면**: `src/pages/scm/DemandForecast.tsx`
- **템플릿 다운로드**: 24주차 매트릭스 CSV 양식 (`품목, 2026-W27, 2026-W28, ..., 2026-W50`) 생성
- **업로드 파서 파이프라인**:
  - `FileReader.readAsArrayBuffer` 원본 바이트 디코딩
  - UTF-8 BOM (`\uFEFF`) 자동 제거 및 EUC-KR / CP949 인코딩 자동 감지 Fallback
  - 큰따옴표 내 천단위 콤마(예: `"1,228"`) 인식 CSV 파서(`parseCsvLine`) 적용
  - 품목코드 대소문자 무시 및 24개 주차 예측 수량(`forecast`) 즉시 일괄 반영

### 3) PP-001 주생산계획 (MPS) — 14일 일별 + 3주~20주 주간 MPS 확장
- **화면**: `src/pages/pp/MpsPage.tsx`
- **1~2주차 (14일간)**: 일별(Daily Bucket) 생산계획 및 표준 라인 능력(650 EA/일) 밸런싱
- **3~20주차 (W29~W46)**: 주간(Weekly Bucket) 중장기 MPS 확장
  - 중장납기 자재 사전 발주 소요 추정
  - 라인 CAPA 과부족 (주당 3,250 EA 대비 부하율 %)
  - 인력 소요시간 (**Man-Hours**), 피크 주차 **잔업 계획시간**, **외주(Outsourcing)** 수량
  - 영업 **RTF (Return To Forecast %)** 자동 연동 계산

### 4) PP-002 자재소요량계획 (MRP) — 24주 화요일 입고 기준 리드타임 전개
- **화면**: `src/pages/pp/MrpPage.tsx`
- **리드타임 분류**: 자재 마스터(`master.ts`)에 `leadTimeWeeks` (장납기 6~8주: 배터리셀 8주, BLDC모터 6주 | 중납기 2~4주 | 단납기 1주) 부여
- **전개 로직**: 24주차 수요예측/MPS 소요량을 해당 주차 **화요일(Tuesday Arrival)** 입고를 기준으로 리드타임 역산 발주주차 산출
- **PR 생성**: 부족 주차 셀 클릭 시 화요일 입고 기준 구매요청(PR) 원클릭 자동 발행

### 5) SCM-002 (S&OP) & SCM-005 (재고계획) — 3주~24주 Contingency Plan 시뮬레이션
- **화면**: `src/pages/scm/Sop.tsx` & `src/pages/scm/InventoryPlan.tsx`
- **시뮬레이션**: 3주~24주 (W29~W50) 주단위 예상 기말재고 및 안전재고 결품위험 추이 감지
- **Contingency Plan 의사결정 모달**:
  1. 🏭 비상 외주(Outsourcing) 할당
  2. ✈️ 긴급 항공 수송 (Air Freight)
  3. 🔄 대치 자재 (Alt Part) 전환
  4. 📅 수주 납기 조정 / 할당

### 6) T-Code 매핑 체계 (130개 표준 메뉴) & 레이아웃 패널 토글
- **파일**: `src/data/tcode.ts`, `src/components/layout/Header.tsx`, `Layout.tsx`, `StatusBar.tsx`
- **T-Code 조회**: 상단 검색창에 T-Code (예: `SD-04`, `VA01`, `PP-03`) 또는 메뉴명 검색 시 single-match 자동 이동 및 2개 이상 모달 선택
- **패널 토글**:
  - `◀ 모듈 패널 숨기기 / 보이기` (좌측 사이드바 GNB 접기/펼치기)
  - `🤖 AI Copilot (숨기기 / 보이기)` (우측 AI Copilot 사이드바 접기/펼치기)
  - `🎯 Demo Playbook 토글 스위치 (ON/OFF)` (하단 StatusBar 내 E2E 가이드 위젯 토글)

---

## 3. 📂 주요 소스 파일 지도 (Key Architecture Map)

| 구분 | 파일 경로 | 설명 |
| :--- | :--- | :--- |
| **T-Code 체계** | `src/data/tcode.ts` | 130개 ERP 메뉴와 SAP T-Code (VA01, MD02 등) 맵핑 데이터 |
| **AI 통계예측** | `src/services/aiStatsModel.ts` | Holt-Winters, 이동평균, 선형회귀 앙상블 시계열 예측 모델 |
| **인사이트/AI** | `src/services/insights.ts` | KPI, 7대 예외탐지, AI Agent 5종 (Demand Planner, Buyer, Scheduler, Quality, CFO) |
| **공통 스토어** | `src/services/store.ts` | EntityStore (localStorage + 메모리), `downloadCsv` (UTF-8 BOM 지원) |
| **마스터 데이터** | `src/data/mock/master.ts` | 품목마스터(리드타임 1~8주 포함), BOM, 고객/공급사, 여신한도 |
| **SCM 데이터** | `src/data/mock/scm.ts` | 24주차 주단위 ForecastStore, 3~24주 ContingencyStore |
| **PP 데이터** | `src/data/mock/production.ts` | 14일 일별 MpsDailyStore, 3~20주 MpsWeeklyStore, WOStore |
| **E2E 테스트** | `scripts/e2e-scenario.ts` | 26단계 E2E 통합검증 스크립트 (`npx tsx scripts/e2e-scenario.ts`) |
| **5대 시나리오** | `scripts/run-5-scenarios.ts` | 대표 5대 E2E 비즈니스 시나리오 스크립트 |

---

## 4. ✅ 시스템 검증 상태 (Verification Results)

- **TypeScript 컴파일**: `npx tsc --noEmit` ➔ **`PASS (exit code 0, Errors: 0)`**
- **E2E 통합 시나리오 테스트**: `npx tsx scripts/e2e-scenario.ts` ➔ **`PASS 26 / FAIL 0 (100% 성공)`**
- **5대 대표 시나리오 테스트**: `npx tsx scripts/run-5-scenarios.ts` ➔ **`PASS 5 / FAIL 0 (100% 성공)`**
- **Git 상태**: `origin/main` 브랜치로 최신 커밋(`5f61f6d`) 및 Push 완수됨

---

## 5. 🎯 다음 추천 개발 작업 (Next Action Steps for Claude)

> **2026-08-14 갱신** — 아래 3개 과제는 **모두 완료**됐다.
> 이후의 잔여 과제와 이관 목록은 **[4.6_프로토타입_잔여과제_이관목록_v1.md](4.6_프로토타입_잔여과제_이관목록_v1.md)** 로 옮겼다.

1. ~~AI 통계예측 파라미터 튜닝 패널~~ → **완료**. 백테스트 MAPE + 그리드 탐색, 튜닝값 영속화.
   실제 모델은 Holt 이중지수평활이며 계절항(γ)이 없다 — 문서의 "Holt-Winters" 표기는 부정확하다.
2. ~~백엔드 REST API 커넥터~~ → **완료**. 무의존성 Node REST 서버, 스냅샷 부트스트랩,
   낙관적 쓰기·롤백, 서버측 ID 구간 예약, 문서번호 채번.
3. ~~PDF / Print 서식 모듈~~ → **완료**. 브라우저 네이티브 인쇄 기반.

추가 완료: 인증·인가 + User Exit 확장 훅, 기준정보 엑셀 업로드/다운로드, 앱 이름 `AX-ERP Portal`.

---

## 6. ⚠️ 인계 사항 — 알려진 한계 2건 (버그 아님, 설계 결정)

상세와 근거는 **[4.6 §2](4.6_프로토타입_잔여과제_이관목록_v1.md)**, 배경은
**[4.5 §2.4](4.5_권한체계_UserExit_매트릭스_v1.md)** 에 있다.

### H-1. 여신한도는 서버가 검증하지 않는다

전표 차대·발주 한도는 문서 하나로 판정이 끝나는 *자기완결* 규칙이라
`shared/businessRules.mjs` 순수 함수를 클라이언트·서버가 공유한다.
여신한도는 **다른 저장 키(고객 여신)를 조회**해야 해서 이 방식에 맞지 않아 제외했다.

- **UI 를 거치면 정상 작동한다.** REST API 직접 호출만 우회 가능하다.
- 해소 시점 — **실 DB 전환과 동시**(4.6 D-2). 트랜잭션 안에서 여신을 조회·잠글 수 있게 되면 풀린다.

### H-2. 인증이 없어 신원 헤더는 위조할 수 있다

`X-ERP-User-Id/Role/Status` 를 서버가 그대로 믿는다. **암호학적 보안 경계가 아니며**,
목적은 클라이언트 우회 오조작 방지와 감사 흔적이다(`server/authz.mjs` 상단 주석).

- 해소 시점 — **운영개발 착수 즉시**(4.6 D-1).

> 두 항목 모두 `CLAUDE.md` 의 "프로토타입 백엔드는 인증·인가를 구현하지 않는다" 제약과
> 일관된다. 운영 전환 시 교체 지점은 4.6 §5 표를 따른다.

---

> **최초 작성일**: 2026-08-11 · **작성 에이전트**: Antigravity AI Agent
> **갱신일**: 2026-08-14 · **승계 에이전트**: Claude AI Agent
