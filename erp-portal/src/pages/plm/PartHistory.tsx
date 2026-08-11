// PLM-007 변경이력 (Part & BOM Change History) — 부품 대체·BOM 단종 교체·설계 변경 트래킹 이력 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface PartHistoryItem {
  id: string;
  changeCode: string;
  ecoNumber: string; // 관련 ECO 번호
  targetMaterialCode: string;
  targetMaterialName: string;
  changeCategory: "부품대체" | "단종교체" | "BOM수량수정";
  oldValue: string; // 이전 부품/수량
  newValue: string; // 신규 부품/수량
  changeReason: string; // 변경 사유
  changedBy: string;
  changedAt: string;
}

export const partHistoryStore = createStore("plm.part_history", [
  { id: "HIS-01", changeCode: "CHG-2026-081", ecoNumber: "ECO-2026-001", targetMaterialCode: "FG-1001", targetMaterialName: "소형가전 무선청소기", changeCategory: "부품대체", oldValue: "RM-3001 (기존 구형 스위치)", newValue: "RM-3004 (표준형 락 스위치 250V)", changeReason: "부품 표준화 및 연간 원가 4,500만원 절감", changedBy: "김연구 수석", changedAt: "2026-07-28" },
  { id: "HIS-02", changeCode: "CHG-2026-082", ecoNumber: "ECO-2026-002", targetMaterialCode: "SF-2001", targetMaterialName: "전자기판 모듈", changeCategory: "단종교체", oldValue: "IC-CHIP-99 (해외 단종 IC)", newValue: "IC-CHIP-100 (국산 대체 IC)", changeReason: "해외 부품 공급사 단종에 따른 긴급 수급 교체", changedBy: "박설계 과장", changedAt: "2026-08-01" },
]);

export default function PartHistory() {
  const list = useStore(partHistoryStore) as PartHistoryItem[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = list.filter((l) => catFilter === "전체" || l.changeCategory === catFilter);

  const excel = () =>
    downloadCsv(
      "연구개발_부품_BOM_변경이력_대장.csv",
      ["변경코드", "ECO번호", "대상품목코드", "대상품목명", "변경구분", "이전값", "변경값", "변경사유", "작성자", "변경일시"],
      filtered.map((l) => [
        l.changeCode,
        l.ecoNumber,
        l.targetMaterialCode,
        l.targetMaterialName,
        l.changeCategory,
        l.oldValue,
        l.newValue,
        l.changeReason,
        l.changedBy,
        l.changedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. Engineering Management (연구개발)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">변경이력 (PLM-007)</h1>
          <span className="text-[11px] text-sub">ECO 연동 부품 대체 · BOM 단종 교체 · 설계 변경 구/신버전 이력 트래킹</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 부품/BOM 변경 이력</div>
          <div className="text-xl font-bold mt-1 font-mono">{list.length} <span className="text-xs font-normal">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">부품 표준화 대체 건수</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{list.filter((l) => l.changeCategory === "부품대체").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">단종/수급 비상 교체 건수</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{list.filter((l) => l.changeCategory === "단종교체").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">구분:</span>
          {["전체", "부품대체", "단종교체"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                catFilter === cat
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 변경이력 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">변경 코드 / ECO</th>
              <th className="px-3 py-2">대상 품목</th>
              <th className="px-3 py-2">변경 구분</th>
              <th className="px-3 py-2">이전 값 (Before)</th>
              <th className="px-3 py-2">신규 변경 값 (After)</th>
              <th className="px-3 py-2">변경 사유</th>
              <th className="px-3 py-2">변경자</th>
              <th className="px-3 py-2">변경 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">
                  <div className="font-bold">{l.changeCode}</div>
                  <div className="text-[11px] text-sub">{l.ecoNumber}</div>
                </td>
                <td className="px-3 py-2 font-medium">{l.targetMaterialCode} — {l.targetMaterialName}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    l.changeCategory === "부품대체" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {l.changeCategory}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub line-through">{l.oldValue}</td>
                <td className="px-3 py-2 font-bold text-emerald-600">{l.newValue}</td>
                <td className="px-3 py-2 text-ink text-[11px] font-medium">{l.changeReason}</td>
                <td className="px-3 py-2 text-sub">{l.changedBy}</td>
                <td className="px-3 py-2 font-mono text-sub">{l.changedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
