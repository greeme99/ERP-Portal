# 표준 ERP 포탈 (Prototype)

소형가전·전자부품 제조 중견/중소기업용 Standard ERP — Sprint 0 골격.

## 실행

```bash
npm install
npm run dev     # http://localhost:5173
```

## 구성

- 13개 모듈 × 155개 메뉴 GNB (1.0_Standard_ERP_Menu_Structure.md 기반)
- CEO Dashboard (EIS KPI 6종, 예외관리, E2E 프로세스)
- 전 메뉴 화면 스캐폴드 (검색필터 + 데이터그리드 + CRUD 버튼)
- AI Copilot 패널 (Agent 5종 placeholder — Sprint 5 연동)
- 테마 3종: 라이트(기본) / 다크 / 블루그레이

## 스택

React 18 + TypeScript + Vite + Tailwind CSS + react-router-dom (Mock 데이터, 백엔드 없음)

## 다음 단계 (Sprint 1)

MDM(품목/거래처/BOM) + SD(고객·견적·수주) 실화면 구현 — 3.0_Standard_ERP_개발계획서 참조
