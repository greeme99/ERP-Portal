// PLM-005 부품표준화 — 개발 부품 공용화(Commonality) 비율·중복 파트 통폐합 및 원가 절감액 추정
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ComponentStd {
  id: string;
  partGroupCode: string;
  partGroupName: string; // 부품군 (예: 스위치 모듈, 전원선 고무 링)
  stdPartCode: string; // 대표 표준 부품코드
  stdPartName: string;
  appliedModelCount: number; // 적용 모델 수
  commonalityRate: number; // 공용화율 (%)
  estCostReduction: number; // 연간 원가 절감 예상액 (KRW)
  status: "표준화완료" | "검토중";
}

export const componentStdStore = createStore("plm.component_std", [
  { id: "STD-P01", partGroupCode: "GRP-SW-01", partGroupName: "전원 락 스위치 부품군", stdPartCode: "RM-3004", stdPartName: "표준형 락 스위치 250V", appliedModelCount: 8, commonalityRate: 88.5, estCostReduction: 45000000, status: "표준화완료" },
  { id: "STD-P02", partGroupCode: "GRP-CB-02", partGroupName: "내열 연결 케이블 부품군", stdPartCode: "RM-3002", stdPartName: "고순도 3선 배선 케이블", appliedModelCount: 12, commonalityRate: 92.0, estCostReduction: 62000000, status: "표준화완료" },
  { id: "STD-P03", partGroupCode: "GRP-SN-03", partGroupName: "온도 센서 모듈 부품군", stdPartCode: "SF-2003", stdPartName: "표준 NTC 온도 센서", appliedModelCount: 4, commonalityRate: 65.0, estCostReduction: 18000000, status: "검토중" },
]);

export default function ComponentStandardization() {
  const list = useStore(componentStdStore) as ComponentStd[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = list.filter((item) => statusFilter === "전체" || item.status === statusFilter);

  const totalCostSavings = filtered.reduce((acc, item) => acc + item.estCostReduction, 0);
  const avgCommonality = (filtered.reduce((acc, item) => acc + item.commonalityRate, 0) / (filtered.length || 1)).toFixed(1);

  const excel = () =>
    downloadCsv(
      "RND_부품표준화_공용화_대장.csv",
      ["부품군코드", "부품군명", "대표표준부품코드", "대표표준부품명", "적용모델수", "공용화율(%)", "원가절감예상액(원)", "상태"],
      filtered.map((item) => [
        item.partGroupCode,
        item.partGroupName,
        item.stdPartCode,
        item.stdPartName,
        item.appliedModelCount,
        `${item.commonalityRate}%`,
        item.estCostReduction,
        item.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. Engineering Management (연구개발)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">부품표준화 (PLM-005)</h1>
          <span className="text-[11px] text-sub">부품 모듈화 및 공용화(Commonality) · 중복 부품 통폐합 · 개발 원가 절감</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 원가 절감 예상액</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalCostSavings / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 부품 공용화율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgCommonality}%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">표준화 대상 부품군</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{list.length} <span className="text-xs font-normal text-ink">군</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "표준화완료", "검토중"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === st
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 부품표준화 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">부품군 코드 / 명</th>
              <th className="px-3 py-2">대표 표준 부품</th>
              <th className="px-3 py-2 text-right">적용 모델 수</th>
              <th className="px-3 py-2 text-right">공용화율</th>
              <th className="px-3 py-2 text-right">원가 절감 예상액</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{item.partGroupCode} — {item.partGroupName}</td>
                <td className="px-3 py-2 text-sub">{item.stdPartCode} ({item.stdPartName})</td>
                <td className="px-3 py-2 text-right font-mono font-medium">{item.appliedModelCount}개 모델</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{item.commonalityRate.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{(item.estCostReduction / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.status === "표준화완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
