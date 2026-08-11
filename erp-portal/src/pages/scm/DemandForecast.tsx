// SCM-001 수요예측 — 주단위(Weekly) Bucket Plan Cycle & AI 통계예측 시계열 모델 엔진
// 수작업 예측값 (고객사 구매계획) 엑셀/CSV 업로드 기능 포함
import { useState, useRef } from "react";
import { materialStore } from "../../data/mock/master";
import { mpsStore, MpsDailyItem } from "../../data/mock/production";
import { forecastStore, mape, accuracy, CURRENT_WEEK, WEEK_BUCKETS, ForecastItem } from "../../data/mock/scm";
import { useStore, downloadCsv } from "../../services/store";
import { runAiStatisticalForecastEngine, AiForecastResult } from "../../services/aiStatsModel";

export default function DemandForecast() {
  const rows = useStore(forecastStore) as ForecastItem[];
  const mats = useStore(materialStore);
  const mps = useStore(mpsStore) as MpsDailyItem[];

  const [activeTab, setActiveTab] = useState<"all" | "manual" | "ai">("all");
  const [selectedFg, setSelectedFg] = useState<string>("FG-1001");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fgs = [...new Set(rows.map((r) => r.material))];
  const matName = (c: string) => mats.find((m) => m.code === c)?.name ?? c;

  const editForecast = (id: string, v: number) => forecastStore.update(id, { forecast: v });

  // 표시할 주차 필터링
  const displayedWeeks = WEEK_BUCKETS.filter((wb) => {
    if (activeTab === "manual") return wb.seq <= 16;
    if (activeTab === "ai") return wb.seq >= 17;
    return true;
  });

  // 선택한 품목의 과거 실적 데이터 추출 (W27~W29 실적 + W30~W42 수기예측)
  const fgHistory = rows
    .filter((r) => r.material === selectedFg && r.weekSeq <= 16)
    .map((r) => (r.actual > 0 ? r.actual : r.forecast));

  // AI 통계예측 엔진 연동 실행 (17~24주차)
  const aiResults: AiForecastResult[] = runAiStatisticalForecastEngine(fgHistory, 17, 8);

  // AI 통계예측 결과 17~24주차에 일괄 적용
  const handleApplyAiForecast = () => {
    aiResults.forEach((res) => {
      const target = rows.find((r) => r.material === selectedFg && r.week === res.week);
      if (target) {
        forecastStore.update(target.id, {
          forecast: res.ensembleAi,
          aiForecast: res.ensembleAi,
        });
      }
    });
    alert(`[${selectedFg}] 17~24주차 AI 통계예측 앙상블 결과 (${aiResults.map(r => r.ensembleAi).join(", ")}) 적용 완료!`);
    setAiModalOpen(false);
  };

  // 주별 예측을 MPS(일단위 생산계획)에 자동 롤다운/반영
  const pushToMps = (material: string) => {
    const w27 = rows.find((r) => r.material === material && r.week === CURRENT_WEEK);
    if (!w27) return;

    const dailyForecast = Math.round(w27.forecast / 10);
    const mpsList = mps.filter((p) => p.material === material);

    mpsList.forEach((p) => {
      if (p.dayOfWeek !== "토" && p.dayOfWeek !== "일") {
        mpsStore.update(p.id, { forecast: dailyForecast });
      }
    });

    alert(`[${material}] ${CURRENT_WEEK} 주간예측 ${w27.forecast.toLocaleString()}대 → 2주간 일별 MPS 반영 완료 (평일 ${dailyForecast}대/일)`);
  };

  // 고객사 구매계획 24주 매트릭스 양식 템플릿 다운로드
  const downloadUploadTemplate = () => {
    const headers = ["품목", ...WEEK_BUCKETS.map((w) => w.week)];
    const templateRows = [
      [
        "FG-1001", "363", "349", "337", "329", "345", "362", "383", "403", "420", "432", "416", "395",
        "370", "349", "333", "354", "387", "412", "436", "424", "399", "374", "358", "391",
      ],
      [
        "FG-1002", "149", "145", "133", "143", "147", "151", "159", "165", "168", "170", "167", "160",
        "153", "147", "141", "149", "157", "163", "171", "167", "160", "151", "147", "157",
      ],
      [
        "FG-1003", "1228", "1196", "1162", "1140", "1185", "1240", "1295", "1339", "1406", "1450", "1417",
        "1350", "1262", "1207", "1151", "1196", "1306", "1383", "1461", "1428", "1361", "1273", "1218", "1306",
      ],
    ];
    downloadCsv("고객사_구매계획_수요예측_24주_업로드템플릿.csv", headers, templateRows);
  };

  // 고객사 구매계획 엑셀/CSV/TSV 업로드 파싱 (BOM 제거, EUC-KR/UTF-8 자동 감지, 따옴표 안 콤마 숫자 파싱 지원)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) return;

        // 1차 UTF-8 디코딩 및 BOM 제거
        let text = new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "");

        // 한글 깨짐 감지 시 EUC-KR / CP949 디코딩 재시도
        if (text.includes("")) {
          try {
            text = new TextDecoder("euc-kr").decode(buffer).replace(/^\uFEFF/, "");
          } catch {
            // fallback
          }
        }

        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          alert("업로드한 파일에 데이터가 존재하지 않거나 1줄 이하입니다.");
          return;
        }

        // CSV 따옴표 고려 컬럼 분할 유틸리티 (예: "1,228" 형태 처리)
        const parseCsvLine = (line: string): string[] => {
          const result: string[] = [];
          let cur = "";
          let inQuotes = false;
          const delimiter = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              result.push(cur.trim().replace(/^["']|["']$/g, ""));
              cur = "";
            } else {
              cur += char;
            }
          }
          result.push(cur.trim().replace(/^["']|["']$/g, ""));
          return result;
        };

        let updatedCount = 0;
        const logMsgs: string[] = [];

        // 첫 번째 라인(헤더) 분할
        const headerParts = parseCsvLine(lines[0]);

        // 매트릭스 포맷 여부 확인 (2번째 컬럼부터 주차 정보가 존재하는 경우 또는 컬럼 4개 이상)
        const isMatrixFormat = headerParts.length > 3 || headerParts.some((h) => h.includes("W") || h.includes("2026"));

        if (isMatrixFormat) {
          // ── 24주차 매트릭스 (피벗) 포맷 파싱 ──
          const weekHeaders: string[] = [];

          for (let c = 1; c < headerParts.length; c++) {
            const h = headerParts[c];
            const wMatch = h.match(/(\d+)/);
            if (wMatch) {
              const wNum = parseInt(wMatch[0], 10);
              if (wNum >= 27 && wNum <= 50) {
                weekHeaders.push(`2026-W${String(wNum).padStart(2, "0")}`);
              } else if (wNum >= 1 && wNum <= 24) {
                weekHeaders.push(`2026-W${String(26 + wNum).padStart(2, "0")}`);
              } else {
                weekHeaders.push(h);
              }
            } else {
              weekHeaders.push(h);
            }
          }

          // 2번째 라인부터 데이터 파싱
          for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i]);
            if (cols.length < 2) continue;

            const matCodeUpper = cols[0].toUpperCase();

            for (let c = 1; c < cols.length; c++) {
              const weekStr = weekHeaders[c - 1];
              if (!weekStr) continue;

              // 수치 내 콤마 및 숫자가 아닌 문자를 모두 제거 (예: "1,228" -> 1228)
              const numStr = cols[c].replace(/,/g, "").replace(/[^0-9]/g, "");
              if (!numStr) continue;

              const qty = parseInt(numStr, 10);
              if (isNaN(qty)) continue;

              const targetItem = rows.find(
                (r) => r.material.toUpperCase() === matCodeUpper && r.week === weekStr
              );

              if (targetItem) {
                forecastStore.update(targetItem.id, { forecast: qty });
                updatedCount++;
              }
            }
            logMsgs.push(`· ${cols[0]}: ${cols.length - 1}개 주차 수량 반영`);
          }
        } else {
          // ── 행 단위 (품목, 주차, 수량) 포맷 파싱 ──
          for (let i = 1; i < lines.length; i++) {
            const parts = parseCsvLine(lines[i]);
            if (parts.length >= 3) {
              const matCodeRaw = parts[0];
              const weekStrRaw = parts[1];
              const qtyStrRaw = parts[2];

              const qty = parseInt(qtyStrRaw.replace(/,/g, "").replace(/[^0-9]/g, ""), 10);
              if (!matCodeRaw || !weekStrRaw || isNaN(qty)) continue;

              const matCodeUpper = matCodeRaw.toUpperCase();
              let normalizedWeek = weekStrRaw;
              const weekNumMatch = weekStrRaw.match(/(\d+)/);

              if (weekNumMatch) {
                const weekNum = parseInt(weekNumMatch[0], 10);
                if (weekNum >= 27 && weekNum <= 50) {
                  normalizedWeek = `2026-W${String(weekNum).padStart(2, "0")}`;
                } else if (weekNum >= 1 && weekNum <= 24) {
                  normalizedWeek = `2026-W${String(26 + weekNum).padStart(2, "0")}`;
                }
              }

              const targetItem = rows.find(
                (r) => r.material.toUpperCase() === matCodeUpper && r.week === normalizedWeek
              );

              if (targetItem) {
                forecastStore.update(targetItem.id, { forecast: qty });
                updatedCount++;
              }
            }
          }
        }

        if (updatedCount > 0) {
          alert(
            `✅ 고객사 구매계획 엑셀 업로드 성공!\n\n총 ${updatedCount}건 데이터가 성공적으로 반영되었습니다.\n\n[반영 현황]\n${logMsgs.join("\n")}`
          );
        } else {
          alert(
            `⚠️ 업로드한 파일에서 일치하는 품목코드/주차를 찾지 못했습니다.\n\n'📥 템플릿 다운로드' 버튼으로 표준 24주차 매트릭스 양식을 다시 다운받아 업로드해 주세요.`
          );
        }
      } catch (err) {
        alert("파일 파싱 중 오류가 발생했습니다. CSV 인코딩 및 형식을 확인해주세요.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };




  const excel = () =>
    downloadCsv("주단위_수요예측_AI통계모델.csv", ["품목", ...displayedWeeks.map((w) => w.week), "MAPE%", "정확도%"],
      fgs.map((fg) => {
        const fr = rows.filter((r) => r.material === fg);
        const m = mape(fr);
        return [fg, ...displayedWeeks.map((wb) => {
          const r = fr.find((x) => x.week === wb.week);
          return r ? `${r.forecast}/${r.actual || (r.isAi ? `(AI:${r.aiForecast})` : "-")}` : "-";
        }), m?.toFixed(1) ?? "-", accuracy(m)?.toFixed(1) ?? "-"];
      }));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">02. SCM (Supply Chain)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">수요예측 (SCM-001) — 고객사 구매계획 업로드 & AI 통계예측</h1>
          <span className="text-[11px] text-sub">
            24주 Plan Cycle · 1~16주 고객사 구매계획 수작업/엑셀 업로드 vs 17~24주 Holt-Winters AI 통계예측 모델
          </span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex flex-wrap items-center gap-3 text-[11px]">
        {/* 주차 탭 필터 */}
        <div className="flex items-center gap-1 bg-surface border border-line rounded p-0.5">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${activeTab === "all" ? "bg-accent text-white" : "text-sub hover:text-main"}`}
          >
            전체 24주 (W27~W50)
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${activeTab === "manual" ? "bg-accent text-white" : "text-sub hover:text-main"}`}
          >
            1~16주 (수기/영업예측)
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${activeTab === "ai" ? "bg-purple-600 text-white" : "text-sub hover:text-main"}`}
          >
            🤖 17~24주 (AI 통계예측)
          </button>
        </div>

        {/* 수작업 예측값 엑셀/CSV 업로드 버튼 및 템플릿 다운로드 */}
        <div className="flex items-center gap-1.5 ml-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv, .txt, .tsv, .xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
            title="고객사 구매계획 엑셀/CSV 파일 업로드"
          >
            <span>📤 고객사 구매계획 엑셀 업로드</span>
          </button>

          <button
            onClick={downloadUploadTemplate}
            className="px-2.5 py-1.5 rounded border border-line bg-surface text-sub hover:text-main text-[11px] font-medium"
            title="업로드 양식 템플릿 다운로드"
          >
            📥 템플릿 다운로드
          </button>
        </div>

        {/* AI 통계예측 모델 분석 모달 열기 버튼 */}
        <button
          onClick={() => setAiModalOpen(true)}
          className="px-3 py-1.5 rounded bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1.5 ml-auto"
        >
          <span>🤖 AI 통계예측 모델 분석</span>
        </button>
      </div>


      {/* 수요예측 24주 테이블 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px] min-w-[1200px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2.5 sticky left-0 bg-panel border-r border-line z-10 w-64">품목 / 버킷</th>
              {displayedWeeks.map((wb) => (
                <th
                  key={wb.week}
                  className={`px-2 py-2 text-right whitespace-nowrap ${
                    wb.week === CURRENT_WEEK
                      ? "text-accent bg-accent-soft/30 font-bold"
                      : wb.isAi
                      ? "text-purple-600 bg-purple-500/5 font-semibold"
                      : ""
                  }`}
                >
                  <div className="flex flex-col items-end">
                    <span>{wb.week.slice(5)}</span>
                    <span className="text-[9px] font-normal opacity-80">
                      {wb.seq}주차 {wb.isAi ? "(AI)" : ""}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold">MAPE</th>
              <th className="px-3 py-2 text-right font-semibold">정확도</th>
              <th className="px-3 py-2">MPS 롤다운</th>
            </tr>
          </thead>
          <tbody>
            {fgs.map((fg) => {
              const fr = rows.filter((r) => r.material === fg);
              const m = mape(fr);
              const acc = accuracy(m);
              return (
                <tr key={fg} className="border-b border-line last:border-0 hover:bg-accent-soft transition-colors">
                  <td className="px-3 py-2.5 font-medium sticky left-0 bg-panel border-r border-line">
                    <div className="font-bold text-main">{fg}</div>
                    <div className="text-[11px] text-sub truncate">{matName(fg)}</div>
                  </td>
                  {displayedWeeks.map((wb) => {
                    const r = fr.find((x) => x.week === wb.week);
                    const future = r && r.actual === 0;
                    return (
                      <td
                        key={wb.week}
                        className={`px-2 py-2 text-right border-r border-line/30 ${
                          wb.week === CURRENT_WEEK ? "bg-accent-soft/20" : wb.isAi ? "bg-purple-500/5" : ""
                        }`}
                      >
                        {r ? (
                          <div className="space-y-0.5">
                            {r.isAi ? (
                              <div className="font-mono text-purple-600 font-bold text-[11px]">
                                {r.forecast.toLocaleString()}
                                <span className="text-[9px] block text-sub font-normal">Holt-Winters</span>
                              </div>
                            ) : future ? (
                              <input
                                type="number"
                                value={r.forecast}
                                onChange={(e) => editForecast(r.id, Number(e.target.value))}
                                className="w-16 px-1 py-0.5 rounded border border-line bg-surface text-[11px] text-right font-mono text-ink"
                              />
                            ) : (
                              <div className="font-mono font-semibold">{r.forecast.toLocaleString()}</div>
                            )}

                            <div className="text-[10px] text-sub font-mono">
                              {r.actual > 0 ? (
                                <span className="text-emerald-600 font-semibold">{r.actual.toLocaleString()}</span>
                              ) : (
                                "—"
                              )}
                            </div>
                          </div>
                        ) : "-"}
                      </td>
                    );
                  })}
                  <td className={`px-3 py-2 text-right font-semibold ${m === null ? "text-sub" : m > 10 ? "text-red-500" : m > 5 ? "text-amber-500" : "text-emerald-500"}`}>
                    {m !== null ? `${m.toFixed(1)}%` : "-"}
                  </td>
                  <td className={`px-3 py-2 text-right font-bold ${acc === null ? "text-sub" : acc < 90 ? "text-amber-500" : "text-emerald-500"}`}>
                    {acc !== null ? `${acc.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => pushToMps(fg)}
                      className="px-2 py-1 rounded bg-accent text-white text-[10px] font-bold hover:bg-accent/80 transition-colors whitespace-nowrap shadow-sm"
                    >
                      ↓ MPS 일별 롤다운
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI 통계예측 시계열 모델 분석 상세 모달 */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-panel border border-line rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-line flex justify-between items-center bg-surface">
              <div>
                <h3 className="font-bold text-base text-main flex items-center gap-2">
                  🤖 AI 시계열 통계예측 모델 상세 분석 (17~24주차)
                </h3>
                <p className="text-xs text-sub mt-0.5">
                  Holt-Winters 지수평균 추세 모델, 이동평균, 선형회귀 앙상블 및 95% 신뢰구간 산출
                </p>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="text-sub hover:text-main text-lg">✕</button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {/* 품목 선택 */}
              <div className="flex items-center gap-2 bg-surface p-2.5 border border-line rounded-lg">
                <span className="font-bold text-main">분석 대상 품목:</span>
                {fgs.map((fg) => (
                  <button
                    key={fg}
                    onClick={() => setSelectedFg(fg)}
                    className={`px-3 py-1 rounded font-bold transition-colors ${
                      selectedFg === fg ? "bg-purple-600 text-white" : "bg-panel border border-line text-sub"
                    }`}
                  >
                    {fg} ({matName(fg)})
                  </button>
                ))}
              </div>

              {/* 통계 모델 비교 테이블 */}
              <div className="border border-line rounded-lg overflow-hidden">
                <div className="p-2.5 bg-surface font-bold text-main border-b border-line flex justify-between">
                  <span>17~24주차 (W43 ~ W50) AI 모델별 예측 비교</span>
                  <span className="text-purple-600 font-mono text-[11px]">Ensemble Confidence: 95.0%</span>
                </div>
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-line text-sub bg-surface/50 font-semibold">
                      <th className="p-2">주차</th>
                      <th className="p-2 text-right">Holt-Winters (50%)</th>
                      <th className="p-2 text-right">이동평균 (30%)</th>
                      <th className="p-2 text-right">선형회귀 (20%)</th>
                      <th className="p-2 text-right text-purple-600 font-bold">앙상블 AI 추천</th>
                      <th className="p-2 text-right">신뢰구간 (±6.5%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiResults.map((r) => (
                      <tr key={r.week} className="border-b border-line/40 hover:bg-accent-soft">
                        <td className="p-2 font-bold text-main font-mono">{r.week} ({r.seq}주차)</td>
                        <td className="p-2 text-right font-mono text-sub">{r.holtWinters.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono text-sub">{r.movingAverage.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono text-sub">{r.linearRegression.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold text-purple-600 text-[12px]">
                          {r.ensembleAi.toLocaleString()}대
                        </td>
                        <td className="p-2 text-right font-mono text-emerald-600">
                          [{r.lowerBound.toLocaleString()} ~ {r.upperBound.toLocaleString()}]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 border-t border-line bg-surface flex justify-between items-center">
              <span className="text-sub text-[11px]">
                Holt-Winters 계절성 평활화 α=0.4, β=0.2 적용
              </span>
              <div className="flex gap-2">
                <button onClick={() => setAiModalOpen(false)} className="px-4 py-1.5 rounded bg-panel border border-line font-bold text-main">
                  닫기
                </button>
                <button
                  onClick={handleApplyAiForecast}
                  className="px-4 py-1.5 rounded bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-md"
                >
                  ✓ 17~24주차 AI 통계예측 일괄 적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
