# 승인 대기: 브라우저 지속성 도입

- 2026-08-05 기준 다음 개발 우선순위였던 데이터 지속성을 `erp-portal/src/services/store.ts`에 구현했다.
- 33개 도메인 store는 `erp-portal:prototype:v1:entity:<domain.key>` 형식의 고유 localStorage key를 사용한다.
- 손상 JSON, 미지원 버전, 접근 거부, quota 초과에서는 앱을 중단하지 않고 seed 또는 메모리 모드로 동작하며 손상 원본은 자동 덮어쓰지 않는다.
- 전역 ID 순번과 LOT 순번은 seed/복원 데이터의 최대 번호를 이어 사용해 새로고침 후 중복을 방지한다.
- localStorage는 합성 데이터용 프로토타입 캐시이며 권한·인증의 신뢰 경계가 아니다. 운영 전 서버 인증/인가와 트랜잭션 저장소로 교체해야 한다.
- 검증: persistence 시나리오 16/16 PASS, 기존 E2E 19/19 PASS. npm 레지스트리 연결 시간 초과로 정식 typecheck/build는 미실행.
