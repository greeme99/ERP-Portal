// PP-002 MRP — 자재소요량계획 (24주 주차별 MRP & 리드타임 고려 화요일 입고 기준 전개)
import { useState } from "react";
import { materialStore, bomStore, MaterialItem } from "../../data/mock/master";
import { mpsStore, mpsWeeklyStore, explodeBom, MpsDailyItem, MpsWeeklyItem } from "../../data/mock/production";
import { prStore } from "../../data/mock/procurement";
import { WEEK_BUCKETS, forecastStore, ForecastItem } from "../../data/mock/scm";
import { useStore, nextId } from "../../services/store";
import { nextDocCode } from "../../services/docNumber";

const TODAY = "2026-07-03";

export default function MrpPage() {
  const mats = useStore(materialStore) as MaterialItem[];
  const boms = useStore(bomStore);
  const prs = useStore(prStore);
  const forecasts = useStore(forecastStore) as ForecastItem[];
  const mpsDaily = useStore(mpsStore) as MpsDailyItem[];
  const mpsWeekly = useStore(mpsWeeklyStore) as MpsWeeklyItem[];

  // 뷰 모드: "24주 주차별 MRP (화요일 입고)" vs "자재별 통합 소요량 요약"
  const [viewMode, setViewMode] = useState<"24weeks" | "summary">("24weeks");
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");

  // 24주차 주차별 소요량 매트릭스 계산 (W27 ~ W50)
  // 자재별 각 주차의 필요 소요량(Required Qty) 및 화요일 입고예정일 계산
  const calculate24WeeksMrp = () => {
    const matrix: Record<string, Record<string, number>> = {};

    // 1~2주차 (W27~W28)는 일별 MPS 합산 기준
    const mpsTotals: Record<string, number> = {};
    mpsDaily.forEach((d) => {
      mpsTotals[d.material] = (mpsTotals[d.material] ?? 0) + d.plan;
    });

    // W27 자재 소요량 전개
    const reqW27: Record<string, number> = {};
    Object.entries(mpsTotals).forEach(([mat, qty]) => {
      explodeBom(mat, qty, boms, reqW27);
    });

    // 24주차 각 주차별 완제품 소요 기준 BOM 전개
    WEEK_BUCKETS.forEach(({ week, seq }) => {
      const reqWeek: Record<string, number> = {};
      const materials = ["FG-1001", "FG-1002", "FG-1003"];

      materials.forEach((fg) => {
        // 1~2주차: Daily MPS 합산, 3~20주: Weekly MPS, 21~24주: SCM Forecast
        let planQty = 0;
        if (seq <= 2) {
          planQty = mpsTotals[fg] ?? 1000;
        } else if (seq <= 20) {
          const wItem = mpsWeekly.find((x) => x.material === fg && x.week === week);
          planQty = wItem?.plan ?? 1000;
        } else {
          const fItem = forecasts.find((x) => x.material === fg && x.week === week);
          planQty = fItem?.forecast ?? 1000;
        }

        explodeBom(fg, planQty, boms, reqWeek);
      });

      Object.entries(reqWeek).forEach(([cCode, qVal]) => {
        if (!matrix[cCode]) matrix[cCode] = {};
        matrix[cCode][week] = Math.ceil(qVal);
      });
    });

    return matrix;
  };

  const mrp24Matrix = calculate24WeeksMrp();

  // 화요일 입고 기준 날짜 계산 유틸리티
  const getTuesdayArrivalDate = (weekSeq: number, leadTimeWeeks: number) => {
    // 2026-W27 화요일: 2026-06-30
    const baseDate = new Date(2026, 5, 30); // 6월 30일 화요일
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + (weekSeq - 1) * 7 - leadTimeWeeks * 7);
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    return `${targetDate.getFullYear()}-${month}-${day} (화)`;
  };

  const filteredMats = mats
    .filter((m) => m.status === "사용")
    .filter((m) => selectedCategory === "전체" || m.leadTimeCategory === selectedCategory);

  const createPrForWeek = async (matCode: string, weekStr: string, qty: number, arrivalDate: string) => {
    const mat = mats.find((m) => m.code === matCode);
    const code = await nextDocCode("PR", prStore.getAll().map((x) => String(x.code)));
    prStore.create({
      id: code,
      code,
      dept: "생산팀",
      material: matCode,
      qty,
      amount: qty * (mat?.price ?? 0),
      reqDate: TODAY,
      dueDate: arrivalDate.slice(0, 10),
      status: "승인대기",
    });
    alert(`[${matCode}] ${weekStr} 화요일 입고(${arrivalDate}) 기준 PR (${code}) ${qty.toLocaleString()}개 생성 완료!`);
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. 생산관리 (Production)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">MRP 자재소요량계획 (PP-002) — 24주 화요일 입고 기준</h1>
          <span className="text-[11px] text-sub">
            중납기·장납기 리드타임 고려 · 24주 수요예측/MPS 환산 · 해당주차 화요일 입고 전개
          </span>
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="bg-panel border border-line rounded-lg p-3 flex flex-wrap items-center gap-3 text-[12px]">
        {/* 리드타임 카테고리 필터 */}
        <div className="flex items-center gap-1 bg-surface border border-line rounded p-0.5">
          {["전체", "장납기(6~8주)", "중납기(2~4주)", "단납기(1주)"].map((cat) => {
            const catVal = cat.split("(")[0];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(catVal)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  selectedCategory === catVal ? "bg-accent text-white" : "text-sub hover:text-main"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <span className="text-sub font-mono text-[11px]">
          • 입고 기준: 매주 화요일(Tuesday Arrival) | 장납기(배터리셀 8주, BLDC모터 6주) 사전 발주 제안
        </span>
      </div>

      {/* 24주 주차별 MRP 대단위 그리드 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
          <span className="font-bold text-[13px] text-main">
            📦 24주차 (W27 ~ W50) 자재소요량 전개 테이블 (화요일 입고 기준)
          </span>
          <span className="text-[11px] text-sub">부족량 발생 주차 셀 클릭 시 화요일 입고 PR 즉시 생성</span>
        </div>

        <table className="w-full text-[12px] min-w-[1400px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2 sticky left-0 bg-surface border-r border-line z-10 w-56">
                자재 / 리드타임
              </th>
              <th className="px-2 py-2">유형</th>
              <th className="px-2 py-2 text-right">현재고</th>
              <th className="px-2 py-2 text-right">안전재고</th>
              {WEEK_BUCKETS.map((wb) => (
                <th key={wb.week} className="px-2 py-2 text-center border-r border-line/40 whitespace-nowrap">
                  <div className="text-[11px] font-bold text-accent">{wb.week.slice(5)}</div>
                  <div className="text-[9px] font-normal text-sub">화요일 입고</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMats.map((mat) => {
              const rowReqs = mrp24Matrix[mat.code] ?? {};
              let cumStock = mat.stock;

              return (
                <tr key={mat.code} className="border-b border-line last:border-0 hover:bg-accent-soft transition-colors">
                  <td className="px-3 py-2.5 sticky left-0 bg-panel border-r border-line font-medium">
                    <div className="font-bold text-main">{mat.code}</div>
                    <div className="text-[11px] text-sub truncate">{mat.name}</div>
                    <div className="text-[10px] text-purple-600 font-semibold mt-0.5">
                      L/T: {mat.leadTimeWeeks}주 ({mat.leadTimeCategory})
                    </div>
                  </td>
                  <td className="px-2 py-2 text-sub">{mat.type}</td>
                  <td className="px-2 py-2 text-right font-mono font-semibold">{mat.stock.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right font-mono text-sub">{mat.safety.toLocaleString()}</td>

                  {/* 24주차별 소요량 및 화요일 입고 체크 셀 */}
                  {WEEK_BUCKETS.map((wb) => {
                    const reqQty = rowReqs[wb.week] ?? 0;
                    cumStock = cumStock - reqQty;
                    const isShort = cumStock < mat.safety;
                    const tuesdayDate = getTuesdayArrivalDate(wb.seq, mat.leadTimeWeeks);

                    return (
                      <td
                        key={wb.week}
                        className={`px-1.5 py-2 text-center border-r border-line/30 ${
                          isShort ? "bg-red-500/10" : ""
                        }`}
                      >
                        {reqQty > 0 ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-[11px]">{reqQty.toLocaleString()}</div>
                            {isShort ? (
                              <button
                                onClick={() => createPrForWeek(mat.code, wb.week, reqQty + mat.safety, tuesdayDate)}
                                className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold hover:bg-red-700 transition-colors shadow-sm block w-full whitespace-nowrap"
                                title={`화요일(${tuesdayDate}) 입고 PR 생성`}
                              >
                                🛒 {wb.week} PR
                              </button>
                            ) : (
                              <div className="text-[9px] text-emerald-600 font-mono">가용</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sub text-[10px]">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-4 py-2 text-[11px] text-sub border-t border-line flex justify-between items-center">
          <span>
            • 24주 MRP 소요량은 해당주차 화요일(Tuesday) 입고를 기준으로 리드타임 역산 발주주차를 자동으로 산출합니다.
          </span>
          <span className="font-mono text-[10px] text-accent font-bold">Tuesday Arrival Lead-Time MRP System</span>
        </div>
      </div>
    </div>
  );
}
