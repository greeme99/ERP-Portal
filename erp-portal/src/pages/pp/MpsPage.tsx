// PP-001 생산계획(MPS) — 14일간 일별 생산계획 + 3주~20주 주간 MPS (CAPA·인력·잔업·외주·RTF 연동)
import { useState } from "react";
import { Link } from "react-router-dom";
import { materialStore } from "../../data/mock/master";
import { salesOrderStore, DocLine } from "../../data/mock/sales";
import {
  mpsStore,
  mpsWeeklyStore,
  DAILY_CAPACITY,
  WEEKLY_CAPACITY,
  DAILY_BUCKETS,
  WEEKLY_MPS_BUCKETS,
  MpsDailyItem,
  MpsWeeklyItem,
  getMpsTotalByMaterial,
} from "../../data/mock/production";
import { useStore } from "../../services/store";

export default function MpsPage() {
  const mpsItems = useStore(mpsStore) as MpsDailyItem[];
  const weeklyMpsItems = useStore(mpsWeeklyStore) as MpsWeeklyItem[];
  const orders = useStore(salesOrderStore);
  const mats = useStore(materialStore);

  // 탭 제어: "1~2주 (14일 일별)" vs "3주 ~ 20주 (주간 MPS 확장)"
  const [mpsTab, setMpsTab] = useState<"daily" | "weekly">("daily");

  const materials = ["FG-1001", "FG-1002", "FG-1003"];

  // 미출하 수주량 (FG별)
  const orderQty = (matCode: string) =>
    orders
      .filter((o) => o.status === "등록" || o.status === "출하예약")
      .flatMap((o) => o.lines as DocLine[])
      .filter((l) => l.material === matCode)
      .reduce((s, l) => s + l.qty, 0);

  // 14일 일별 총 수량 및 부하율
  const grandTotalDailyPlan = mpsItems.reduce((s, p) => s + p.plan, 0);
  const totalDailyCapacity = DAILY_CAPACITY * 10;
  const dailyLoadPct = Math.round((grandTotalDailyPlan / totalDailyCapacity) * 100);

  // 3~20주 주간 총 수량 및 주간 라인 부하율
  const grandTotalWeeklyPlan = weeklyMpsItems.reduce((s, p) => s + p.plan, 0);
  const totalWeeklyCapacity = WEEKLY_CAPACITY * 18; // 18주차 x 3,250 EA
  const weeklyLoadPct = Math.round((grandTotalWeeklyPlan / totalWeeklyCapacity) * 100);

  // 외주 수량 총합 및 평균 RTF
  const totalOutsourcingQty = weeklyMpsItems.reduce((s, x) => s + x.outsourcingQty, 0);
  const avgRtfPct = Math.round(
    weeklyMpsItems.reduce((s, x) => s + x.rtfPct, 0) / (weeklyMpsItems.length || 1)
  );
  const totalManHours = weeklyMpsItems.reduce((s, x) => s + x.manHours, 0);
  const totalOvertimeHours = weeklyMpsItems.reduce((s, x) => s + x.overtimeHours, 0);

  const handleEditDailyPlan = (id: string, val: number) => {
    mpsStore.update(id, { plan: val });
  };

  const handleEditWeeklyPlan = (id: string, val: number) => {
    const item = weeklyMpsItems.find((x) => x.id === id);
    if (!item) return;
    const rtfPct = Math.min(100, Math.round((val / (item.forecast || 1)) * 100));
    const manHours = Math.round(val * 0.15);
    const overtimeHours = val > 600 ? Math.round((val - 600) * 0.08) : 0;
    const outsourcingQty = val > 1300 ? val - 1300 : 0;
    const status = outsourcingQty > 0 ? "외주검토" : rtfPct < 95 ? "조정필요" : "확정";

    mpsWeeklyStore.update(id, {
      plan: val,
      rtfPct,
      manHours,
      overtimeHours,
      outsourcingQty,
      status,
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. 생산관리 (Production)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">생산계획 MPS (PP-001)</h1>
          <span className="text-[11px] text-sub">14일간 일별 계획 + 3주~20주 주간 MPS (CAPA·인력·외주·RTF)</span>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-panel border border-line rounded-lg p-2 flex items-center gap-2 text-[12px]">
        <button
          onClick={() => setMpsTab("daily")}
          className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
            mpsTab === "daily"
              ? "bg-accent text-white shadow-sm"
              : "bg-surface text-sub hover:text-main border border-line"
          }`}
        >
          📅 1~2주차 (14일간 일별 Daily Bucket)
        </button>
        <button
          onClick={() => setMpsTab("weekly")}
          className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
            mpsTab === "weekly"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-surface text-sub hover:text-main border border-line"
          }`}
        >
          🚀 3주 ~ 20주차 주간 MPS (W29~W46) [RTF · 외주 · CAPA 연동]
        </button>
      </div>

      {/* 1탭: 14일 일별 MPS */}
      {mpsTab === "daily" && (
        <div className="space-y-3">
          {/* 일별 라인 능력 및 부하율 */}
          <div className="bg-panel border border-line rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-[12px]">
              <span className="font-semibold">
                2주간 총 라인 부하율 (일일 표준능력 {DAILY_CAPACITY} EA/일 × 10일 = {totalDailyCapacity.toLocaleString()} EA)
              </span>
              <span className={`font-bold ${dailyLoadPct > 100 ? "text-red-500" : dailyLoadPct > 85 ? "text-amber-500" : "text-emerald-500"}`}>
                {grandTotalDailyPlan.toLocaleString()} EA — {dailyLoadPct}%
              </span>
            </div>
            <div className="h-2.5 bg-surface rounded overflow-hidden">
              <div
                className={`h-2.5 rounded transition-all ${dailyLoadPct > 100 ? "bg-red-500" : dailyLoadPct > 85 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(dailyLoadPct, 100)}%` }}
              />
            </div>
          </div>

          {/* 일별 MPS 그리드 */}
          <div className="bg-panel border border-line rounded-lg overflow-x-auto">
            <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
              <span className="font-bold text-[13px] text-main">📅 14일간 일별(Daily) 생산계획 수립 테이블</span>
              <span className="text-[11px] text-sub">일자별 계획 입력 시 MRP 자재 소요량 자동 연동</span>
            </div>

            <table className="w-full text-[12px] min-w-[1100px]">
              <thead>
                <tr className="border-b border-line text-sub text-left bg-surface">
                  <th className="px-3 py-2 sticky left-0 bg-surface border-r border-line z-10 w-56">완제품 품목</th>
                  <th className="px-2 py-2 text-right">수주잔</th>
                  <th className="px-2 py-2 text-right">2주 총계획</th>
                  {DAILY_BUCKETS.map((db) => (
                    <th
                      key={db.date}
                      className={`px-2 py-2 text-center border-r border-line/40 whitespace-nowrap ${
                        db.isWeekend ? "bg-amber-500/10 text-amber-700" : ""
                      }`}
                    >
                      <div className="text-[11px] font-bold">{db.date.slice(5)}</div>
                      <div className="text-[9px] font-normal">({db.dayOfWeek})</div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold">GAP</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((matCode) => {
                  const mat = mats.find((m) => m.code === matCode);
                  const so = orderQty(matCode);
                  const { forecast: totalFc, plan: totalPl } = getMpsTotalByMaterial(matCode, mpsItems);
                  const demand = so + totalFc;
                  const gap = totalPl + (mat?.stock ?? 0) - demand;

                  return (
                    <tr key={matCode} className="border-b border-line last:border-0 hover:bg-accent-soft transition-colors">
                      <td className="px-3 py-2.5 sticky left-0 bg-panel border-r border-line font-medium">
                        <div className="font-bold text-main">{matCode}</div>
                        <div className="text-[11px] text-sub truncate">{mat?.name ?? ""}</div>
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-sub">{so.toLocaleString()}</td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-accent">{totalPl.toLocaleString()}</td>

                      {DAILY_BUCKETS.map((db) => {
                        const item = mpsItems.find((x) => x.material === matCode && x.date === db.date);
                        return (
                          <td
                            key={db.date}
                            className={`px-1.5 py-2 text-center border-r border-line/30 ${
                              db.isWeekend ? "bg-amber-500/5" : ""
                            }`}
                          >
                            {item ? (
                              <div className="space-y-0.5">
                                <input
                                  type="number"
                                  value={item.plan}
                                  onChange={(e) => handleEditDailyPlan(item.id, Number(e.target.value))}
                                  disabled={db.isWeekend}
                                  className={`w-14 px-1 py-0.5 rounded border border-line text-right font-mono text-[11px] ${
                                    db.isWeekend ? "bg-surface/50 text-sub cursor-not-allowed" : "bg-surface text-ink"
                                  }`}
                                />
                                <div className="text-[9px] font-mono text-sub">수요:{item.forecast}</div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}

                      <td className={`px-3 py-2 text-right font-bold ${gap < 0 ? "text-red-500" : "text-emerald-500"}`}>
                        {gap >= 0 ? "+" : ""}{gap.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2탭: 3주 ~ 20주 주간 MPS (CAPA·인력·잔업·외주·영업 RTF) */}
      {mpsTab === "weekly" && (
        <div className="space-y-3">
          {/* 주간 3~20주 종합 KPI 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-panel border border-line rounded-lg p-3">
              <div className="text-[11px] text-sub">3~20주 평균 라인 부하율</div>
              <div className={`text-xl font-bold mt-1 ${weeklyLoadPct > 100 ? "text-red-500" : "text-emerald-600"}`}>
                {weeklyLoadPct}%
              </div>
              <div className="text-[10px] text-sub mt-0.5">주당 능력 {WEEKLY_CAPACITY.toLocaleString()} EA 기준</div>
            </div>
            <div className="bg-panel border border-line rounded-lg p-3">
              <div className="text-[11px] text-sub">영업 RTF (판매가용성)</div>
              <div className={`text-xl font-bold mt-1 ${avgRtfPct < 90 ? "text-amber-500" : "text-emerald-600"}`}>
                {avgRtfPct}%
              </div>
              <div className="text-[10px] text-sub mt-0.5">Return To Forecast 평균</div>
            </div>
            <div className="bg-panel border border-line rounded-lg p-3">
              <div className="text-[11px] text-sub">누적 인력 소요량</div>
              <div className="text-xl font-bold mt-1 text-main font-mono">{totalManHours.toLocaleString()} 시간</div>
              <div className="text-[10px] text-sub mt-0.5">Direct Labor Man-Hours</div>
            </div>
            <div className="bg-panel border border-line rounded-lg p-3">
              <div className="text-[11px] text-sub">잔업 계획 시간</div>
              <div className="text-xl font-bold mt-1 text-amber-600 font-mono">{totalOvertimeHours.toLocaleString()} 시간</div>
              <div className="text-[10px] text-sub mt-0.5">피크주차 수량 대응 잔업</div>
            </div>
            <div className="bg-panel border border-line rounded-lg p-3">
              <div className="text-[11px] text-sub">비상 외주 필요량</div>
              <div className={`text-xl font-bold mt-1 ${totalOutsourcingQty > 0 ? "text-red-500 font-mono" : "text-sub"}`}>
                {totalOutsourcingQty.toLocaleString()} EA
              </div>
              <div className="text-[10px] text-sub mt-0.5">CAPA 초과 외주(Outsourcing)</div>
            </div>
          </div>

          {/* 주간 MPS 대단위 그리드 */}
          <div className="bg-panel border border-line rounded-lg overflow-x-auto">
            <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
              <span className="font-bold text-[13px] text-main">
                🚀 3주 ~ 20주차 (W29~W46) 중장기 주간 MPS 계획 테이블
              </span>
              <span className="text-[11px] text-sub">
                중장납기 자재발주소요, 인력/잔업/외주계획, 영업 RTF(Return To Forecast) 통합 산출
              </span>
            </div>

            <table className="w-full text-[12px] min-w-[1300px]">
              <thead>
                <tr className="border-b border-line text-sub text-left bg-surface">
                  <th className="px-3 py-2 sticky left-0 bg-surface border-r border-line z-10 w-48">완제품 품목</th>
                  <th className="px-2 py-2 text-right">18주 총계획</th>
                  {WEEKLY_MPS_BUCKETS.map((wb) => (
                    <th key={wb.week} className="px-2 py-2 text-center border-r border-line/40 whitespace-nowrap">
                      <div className="text-[11px] font-bold text-purple-700">{wb.week.slice(5)}</div>
                      <div className="text-[9px] font-normal text-sub">{wb.seq}주차</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((matCode) => {
                  const mat = mats.find((m) => m.code === matCode);
                  const matItems = weeklyMpsItems.filter((x) => x.material === matCode);
                  const totalPlanVal = matItems.reduce((s, x) => s + x.plan, 0);

                  return (
                    <tr key={matCode} className="border-b border-line last:border-0 hover:bg-accent-soft transition-colors">
                      <td className="px-3 py-2.5 sticky left-0 bg-panel border-r border-line font-medium">
                        <div className="font-bold text-main">{matCode}</div>
                        <div className="text-[11px] text-sub truncate">{mat?.name ?? ""}</div>
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-purple-600">
                        {totalPlanVal.toLocaleString()}
                      </td>

                      {/* 3~20주 주간 계획 셀 */}
                      {WEEKLY_MPS_BUCKETS.map((wb) => {
                        const item = matItems.find((x) => x.week === wb.week);
                        return (
                          <td key={wb.week} className="px-1.5 py-2 text-center border-r border-line/30">
                            {item ? (
                              <div className="space-y-1">
                                <input
                                  type="number"
                                  value={item.plan}
                                  onChange={(e) => handleEditWeeklyPlan(item.id, Number(e.target.value))}
                                  className="w-16 px-1 py-0.5 rounded border border-line bg-surface text-right font-mono text-[11px] text-ink font-semibold"
                                />
                                <div className="text-[9px] flex flex-col items-center gap-0.5">
                                  <span className={`px-1 rounded text-[8px] font-bold ${
                                    item.rtfPct < 90 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                                  }`}>
                                    RTF:{item.rtfPct}%
                                  </span>
                                  {item.outsourcingQty > 0 && (
                                    <span className="text-[8px] text-red-600 font-bold">
                                      외주:{item.outsourcingQty}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-4 py-2.5 border-t border-line flex items-center justify-between text-[11px]">
              <span className="text-sub">
                • 3주~20주 MPS 계획은 중장납기 원자재(BLDC모터 6주, 배터리셀 8주) 사전 발주 및 영업 RTF 값으로 즉시 연동됩니다.
              </span>
              <Link
                to="/m/pp/pp-03"
                className="px-3.5 py-1.5 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors shadow-sm"
              >
                ▶ MRP 24주 화요일 입고기준 실행
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
