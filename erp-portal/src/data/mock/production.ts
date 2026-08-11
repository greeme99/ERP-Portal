// PP 생산 Mock — 주별 일단위 (Daily Bucket: 14일간) + 주간 MPS (3주 ~ 20주: W29 ~ W46)
import { createStore, Entity } from "../../services/store";

export interface MpsDailyItem {
  id: string;
  material: string;
  date: string;       // YYYY-MM-DD
  dayOfWeek: string;  // 월, 화, 수, 목, 금, 토, 일
  forecast: number;   // 일별 예측/수요량
  plan: number;       // 일별 생산계획량
}

export interface MpsWeeklyItem {
  id: string;
  material: string;
  week: string;            // 예: "2026-W29"
  weekSeq: number;         // 3 ~ 20
  forecast: number;        // 주간 수요예측량
  plan: number;            // 주간 MPS 계획량
  rtfPct: number;          // 영업 RTF (Return To Forecast, %)
  manHours: number;        // 인력 소요시간 (시간)
  overtimeHours: number;   // 잔업 계획시간 (시간)
  outsourcingQty: number;  // 외주(Outsourcing) 필요량 (EA)
  status: string;          // "확정" | "조정필요" | "외주검토"
}

// 14일간 일단위 버킷 생성 (2026-07-01 ~ 2026-07-14)
const DAYS_OF_WEEK = ["수", "목", "금", "토", "일", "월", "화"];
export const DAILY_BUCKETS = Array.from({ length: 14 }, (_, i) => {
  const dayNum = i + 1;
  const dateStr = `2026-07-${String(dayNum).padStart(2, "0")}`;
  const dayOfWeek = DAYS_OF_WEEK[i % 7];
  const isWeekend = dayOfWeek === "토" || dayOfWeek === "일";
  return { date: dateStr, dayOfWeek, isWeekend };
});

// 3주 ~ 20주차 (W29 ~ W46) 주간 버킷 리스트 생성
export const WEEKLY_MPS_BUCKETS = Array.from({ length: 18 }, (_, i) => {
  const seq = i + 3; // 3주차 ~ 20주차
  const weekNum = 26 + seq;
  return {
    week: `2026-W${String(weekNum).padStart(2, "0")}`,
    seq,
  };
});

const generateInitialDailyMps = (): MpsDailyItem[] => {
  const materials = ["FG-1001", "FG-1002", "FG-1003"];
  const dailyPlans: Record<string, { fDaily: number; pDaily: number }> = {
    "FG-1001": { fDaily: 107, pDaily: 143 },
    "FG-1002": { fDaily: 43, pDaily: 57 },
    "FG-1003": { fDaily: 285, pDaily: 357 },
  };

  const list: MpsDailyItem[] = [];
  materials.forEach((mat) => {
    const { fDaily, pDaily } = dailyPlans[mat];
    DAILY_BUCKETS.forEach(({ date, isWeekend }) => {
      const plan = isWeekend ? 0 : Math.round(pDaily * 1.4);
      const forecast = isWeekend ? 0 : Math.round(fDaily * 1.4);

      list.push({
        id: `MPS-${mat}-${date}`,
        material: mat,
        date,
        dayOfWeek: date,
        forecast,
        plan,
      });
    });
  });
  return list;
};

// 3주~20주 주간 MPS 초기 모의 데이터 생성
const generateInitialWeeklyMps = (): MpsWeeklyItem[] => {
  const materials = ["FG-1001", "FG-1002", "FG-1003"];
  const baseWeekly: Record<string, { fBase: number; pBase: number }> = {
    "FG-1001": { fBase: 500, pBase: 520 },
    "FG-1002": { fBase: 200, pBase: 210 },
    "FG-1003": { fBase: 1200, pBase: 1250 },
  };

  const list: MpsWeeklyItem[] = [];
  materials.forEach((mat) => {
    const { fBase, pBase } = baseWeekly[mat];
    WEEKLY_MPS_BUCKETS.forEach(({ week, seq }) => {
      const forecast = Math.round(fBase * (1 + (Math.sin(seq) * 0.1)));
      const plan = Math.round(pBase * (1 + (Math.cos(seq) * 0.1)));

      // 라인 주당 CAPA (3,250 EA) 및 부하 기준 인력/외주/RTF 계산
      const rtfPct = Math.min(100, Math.round((plan / forecast) * 100));
      const manHours = Math.round((plan * 0.15)); // 개당 0.15시간 가정
      const overtimeHours = plan > 600 ? Math.round((plan - 600) * 0.08) : 0;
      const outsourcingQty = plan > 1300 ? plan - 1300 : 0;
      const status = outsourcingQty > 0 ? "외주검토" : rtfPct < 95 ? "조정필요" : "확정";

      list.push({
        id: `MPS-W-${mat}-${week}`,
        material: mat,
        week,
        weekSeq: seq,
        forecast,
        plan,
        rtfPct,
        manHours,
        overtimeHours,
        outsourcingQty,
        status,
      });
    });
  });
  return list;
};

export const mpsStore = createStore("production.mps", generateInitialDailyMps());
export const mpsWeeklyStore = createStore("production.mps-weekly", generateInitialWeeklyMps());

// 일별 & 주별 생산능력 기준
export const DAILY_CAPACITY = 650;      // 1일 표준 라인 능력 (650 EA/일)
export const WEEKLY_CAPACITY = 3250;    // 주당 표준 라인 능력 (5일 x 650 EA = 3,250 EA)
export const CAPACITY = 6500;           // 2주간 총 라인 능력

// 품목별 2주간 총 생산계획량 계산 헬퍼
export function getMpsTotalByMaterial(material: string, items: MpsDailyItem[]): { forecast: number; plan: number } {
  const filtered = items.filter((x) => x.material === material);
  const forecast = filtered.reduce((s, x) => s + x.forecast, 0);
  const plan = filtered.reduce((s, x) => s + x.plan, 0);
  return { forecast, plan };
}

// ── 작업지시 (WO) ────────────────────────────────
export const woStore = createStore("production.work-order", [
  { id: "WO-26071", code: "WO-26071", material: "FG-1001", qty: 1000, startDate: "2026-07-01", dueDate: "2026-07-10", status: "진행", good: 0, defect: 0 },
  { id: "WO-26072", code: "WO-26072", material: "SF-2003", qty: 2000, startDate: "2026-07-02", dueDate: "2026-07-08", status: "계획", good: 0, defect: 0 },
  { id: "WO-26070", code: "WO-26070", material: "FG-1003", qty: 2000, startDate: "2026-06-25", dueDate: "2026-07-02", status: "완료", good: 1968, defect: 32 },
]);

// ── BOM 다단계 전개 (MRP 소요량 계산) ────────────
export function explodeBom(material: string, qty: number, boms: Entity[], acc: Record<string, number>) {
  for (const b of boms.filter((x) => x.parent === material)) {
    acc[b.child] = (acc[b.child] ?? 0) + b.qty * qty;
    explodeBom(b.child, b.qty * qty, boms, acc);
  }
}

export const WO_STYLE: Record<string, string> = {
  계획: "bg-amber-100 text-amber-700",
  진행: "bg-blue-100 text-blue-700",
  완료: "bg-emerald-100 text-emerald-700",
};
