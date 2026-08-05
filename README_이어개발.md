# 표준 ERP 포탈 — 이어개발 패키지

> 사내망 백엔드 제약으로 외부(개인) 계정에서 개발을 이어가기 위한 이관 패키지.
> 생성: 2026-07-03 | Sprint 0~12 완료 상태 (실화면 47종 + 스캐폴드 111메뉴)

---

## 1. 패키지 구성

```
표준ERP_이어개발_패키지/
├── README_이어개발.md          ← 이 파일
├── harness/                     ← Hermes 에이전트 환경 (세션 시작 시 로드)
│   ├── CLAUDE.md                 행동 프로토콜 (폐쇄형 학습 루프)
│   ├── MEMORY.md                 에이전트 노트 (프로젝트 상태·마일스톤·주의사항)
│   ├── USER.md                   사용자 프로필/선호
│   └── skills/                   자동 생성 스킬 4종
│       ├── erp-screen-scaffold/  화면 표준 패턴
│       ├── erp-module-crud/      MasterCrudPage 설정 패턴
│       ├── erp-mock-data/        도메인 코드체계
│       └── erp-dashboard-widget/ KPI·예외·AI Agent 추가 절차
├── docs/                        ← 기획·설계·검증 문서 (필수 컨텍스트)
│   ├── 1.0~1.7  v1 기획
│   ├── 2.1~2.7  v2 상세화
│   ├── 3.0      개발계획서
│   ├── 4.1~4.4  v3 구현기준 역산 (기능/화면/ERD/E2E검증)
│   ├── 통합_비즈니스_플랫폼_아키텍처_설계서_v1
│   └── AGENTS.md
└── erp-portal/                  ← 개발 소스 (node_modules·dist 제외)
    ├── src/                      실화면 47종 + 서비스계층 + 인사이트
    ├── scripts/e2e-scenario.ts   E2E 자동 검증 (19/19 PASS)
    ├── package.json, vite.config.ts, tsconfig.json, tailwind/postcss
    └── README.md
```

## 2. 이어개발 시작 방법 (외부 계정)

```bash
cd erp-portal
npm install            # 최초 1회 (외부망에서는 정상 동작)
npm run dev            # http://localhost:5173 자동 오픈
npm run build          # 프로덕션 빌드 (dist/)
npx tsc --noEmit       # 타입체크
npx tsx scripts/e2e-scenario.ts   # E2E 통합 검증 (tsx 필요: npm i -D tsx)
```

## 3. 아키텍처 핵심 (인수인계)

- **스택**: React 18 + TypeScript + Vite + Tailwind + HashRouter, 인메모리 store
- **서비스 계층**: `src/services/store.ts` — `createStore()`(getAll/create/update/remove/subscribe, useSyncExternalStore 구독). **백엔드 전환 시 이 파일만 교체하면 화면 코드 무변경**
- **인사이트 계층**: `src/services/insights.ts` — computeKpis / computeExceptions(9규칙) / AI_AGENTS(5종). 대시보드·Copilot·Control Tower가 공유
- **라우팅**: `src/App.tsx` — 실화면 47종 구체 route가 범용 스캐폴드(`/m/:moduleId/:slug`)보다 우선
- **Mock 데이터**: `src/data/mock/*.ts` — 코드체계 FG/SF/RM/PK(품목), C/V(거래처), 문서번호 YY접두
- **핵심 E2E 흐름**: 수요예측→MPS→MRP(BOM전개)→PR(예산)→PO→입고(LOT)→수입검사→생산(백플러시)→수주(ATP)→출고(FIFO)→전표(차대평형)→AR/AP→원가(재료+노무+간접15%)→손익/COPA→KPI/예외

## 4. 다음 작업: 백엔드 실장 (지속성)

- 현재 인메모리라 새로고침 시 데이터 리셋 → 백엔드로 지속성 확보가 다음 단계
- **권장(사내망 무관)**: 무의존성 Node 서버(내장 http+fs, JSON 저장) 또는 브라우저 localStorage 지속화
- **문서 설계안**: Spring Boot + PostgreSQL (2.5 개발명세서) — 외부망에서 진행 시 채택 가능
- 전환 지점: `services/store.ts`의 create/update/remove를 REST fetch로, 초기 로드를 GET으로 교체. 트랜잭션 경계 = 입고/출고/WO완료/수금 등 화면 핸들러 단위 (4.3 ERD §5 참조)

## 5. 미구현 (스캐폴드 상태)

가격정책·반품·통관/수출입·출하검사·공급위험관리·고정자산·세무·연결회계·경쟁사분석·배부관리·SSO — 필요 시 기존 스킬(erp-module-crud 등)로 신속 추가 가능.
