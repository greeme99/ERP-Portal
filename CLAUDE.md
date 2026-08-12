# Project: 표준 ERP 포탈

상위 Workspace 지침을 따르며, 이 파일은 프로젝트 고유 사실과 명령만 정의한다.

## Mission
- 목적: 소비자용 소형가전·전자부품 제조 중견/중소기업이 사용할 수 있는 표준 ERP 패키지 프로토타입을 구축한다.
- 주요 사용자: 경영진, 영업·구매·생산·품질·물류·재무·관리 담당자.
- 완료 기준: 표준 기능 트리의 핵심 E2E 업무 흐름이 화면과 서비스 계층에서 동작하고 타입체크·빌드·통합 시나리오를 통과한다.

## Stack
- Runtime: Node.js 24 (개발 환경)
- Package manager: npm
- Framework: React 18 + TypeScript + Vite + Tailwind CSS + HashRouter
- Database: REST 백엔드(무의존성 Node http + JSON 파일) 또는 브라우저 localStorage.
  `erp-portal/.env` 의 `VITE_API_URL` 이 있으면 REST 모드, 없거나 서버에 닿지 못하면 localStorage 폴백.
  향후 PostgreSQL 전환 예정.
- Test: TypeScript typecheck + Node E2E 시나리오

## Architecture
- `erp-portal/src/services/store.ts`: EntityStore 공개 API와 지속성 경계 (REST/localStorage/메모리)
- `erp-portal/src/services/restBackend.ts`: REST 전송 계층 — 스냅샷 부트스트랩, 낙관적 쓰기, 실패 롤백
- `erp-portal/server/`: 무의존성 Node REST 서버. 신뢰 경계 입력 검증, 키별 쓰기 직렬화,
  ID 순번 구간 예약(`_sequence.json`)을 담당
- `erp-portal/src/services/insights.ts`: KPI·예외·AI Agent 인사이트 계산
- `erp-portal/src/data/mock/`: 도메인별 초기 데이터와 singleton store
- `erp-portal/src/pages/`: 모듈별 실화면, `ScaffoldPage`는 미구현 메뉴의 공통 화면
- 의존성 방향: 화면 → store/insights → mock data. 화면에서 localStorage에 직접 접근하지 않는다.
- 공개 API/호환성 제약: `EntityStore`의 subscribe/getAll/create/update/remove/replaceAll 계약을 유지한다.
  `getAll()`은 동기이고 `create()`는 Entity를 동기 반환하므로 REST 모드도 캐시 우선 + 낙관적 쓰기여야 한다.
  N건을 원자적으로 반영해야 하는 경로(일괄 업로드)는 `replaceAll`을 쓴다.
- ID 발급: REST 모드에서는 서버가 겹치지 않는 순번 구간을 예약해 주고 `nextId`가 그 안에서 동기 발급한다.
  클라이언트별 카운터로 되돌아가지 않는다(다중 사용자 id 충돌 방지).

## Canonical Commands
```powershell
# install
npm.cmd install

# lint
# 별도 lint 구성 없음

# typecheck
npm.cmd run typecheck

# unit test
npx.cmd tsx scripts/store-persistence-scenario.ts

# integration/e2e
npx.cmd tsx scripts/e2e-scenario.ts
npx.cmd tsx scripts/run-5-scenarios.ts

# backend (REST 서버 + store 왕복)
npx.cmd tsx scripts/backend-scenario.ts
npx.cmd tsx scripts/rest-store-scenario.ts

# build
npm.cmd run build

# 개발 서버 (터미널 2개)
npm.cmd run server   # 백엔드 http://127.0.0.1:5177
npm.cmd run dev      # 화면  http://localhost:5180
```

## Coding Rules
- 기존 코드 스타일과 네이밍을 따른다.
- 새 의존성은 필요성과 대안을 설명한 후 추가한다.
- 요청과 무관한 포맷/리팩터링을 금지한다.
- 공개 인터페이스 변경은 명시적으로 보고한다.
- localStorage와 REST 백엔드의 JSON 저장소는 모두 합성 데이터용 프로토타입 캐시다.
  실제 개인정보·권한 원본·인증정보·영업비밀을 저장하지 않는다.
- 프로토타입 백엔드는 인증·인가를 구현하지 않는다. 운영 전환 시 서버측 인증/인가와
  트랜잭션 저장소로 교체해야 한다. 브라우저에서 오는 입력은 서버에서 다시 검증한다.
- localStorage의 권한 데이터는 UI 데모용이며 실제 인가는 향후 서버에서 재검증한다.

## Verification Matrix
| 변경 유형 | 필수 검증 |
|---|---|
| 로직 | 관련 단위 테스트 |
| API/DB | 통합 테스트 + 호환성 확인 |
| UI | 컴포넌트 테스트 또는 실제 실행 검증 |
| 설정/빌드 | clean build |
| 보안 경계 | security-reviewer 검토 |

## Memory
- 이 프로젝트 고유 사실은 `.claude\memory\MEMORY.md`에 있다. 세션 시작 시 읽는다.
- 새 기록은 `.claude\memory\pending\`에 초안으로 남기고 승인 후 반영한다
