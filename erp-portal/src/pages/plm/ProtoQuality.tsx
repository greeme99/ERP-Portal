// PLM-008 시품질 (Prototype Quality & First Article Inspection) — R&D 개발 시제품 초물검사(FAI)·성능 평가 및 양산이관 품질 승인
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface ProtoQualityItem {
  id: string;
  faiCode: string;
  projectName: string;
  protoSampleCode: string; // 시제품 샘플 번호 (예: PROTO-FG-1001-A)
  inspectionCategory: "치수검단" | "전기성능" | "신뢰성시험" | "외관품질";
  inspectedQty: number;
  passedQty: number;
  defectQty: number;
  judgeResult: "양산승인" | "조건부승인" | "불합격(재작업)";
  inspector: string;
  inspectedAt: string;
}

export const protoQualityStore = createStore("plm.proto_quality", [
  { id: "FAI-01", faiCode: "FAI-2026-01", projectName: "차세대 무선청소기 2세대 개발", protoSampleCode: "PROTO-FG-1001-V2", inspectionCategory: "전기성능", inspectedQty: 10, passedQty: 10, defectQty: 0, judgeResult: "양산승인", inspector: "김시품 수석", inspectedAt: "2026-08-02" },
  { id: "FAI-02", faiCode: "FAI-2026-02", projectName: "AI 자율주행 로봇청소기 개발", protoSampleCode: "PROTO-FG-1002-LIDAR", inspectionCategory: "신뢰성시험", inspectedQty: 5, passedQty: 4, defectQty: 1, judgeResult: "조건부승인", inspector: "박품질 책임", inspectedAt: "2026-08-04" },
]);

export default function ProtoQuality() {
  const items = useStore(protoQualityStore) as ProtoQualityItem[];
  const [judgeFilter, setJudgeFilter] = useState("전체");

  const filtered = items.filter((i) => judgeFilter === "전체" || i.judgeResult === judgeFilter);

  const excel = () =>
    downloadCsv(
      "연구개발_시품질_초물검사_대장.csv",
      ["FAI코드", "프로젝트명", "시제품샘플코드", "검사항목", "검사수량", "합격수량", "불량수량", "판정결과", "검사자", "검사일시"],
      filtered.map((i) => [
        i.faiCode,
        i.projectName,
        i.protoSampleCode,
        i.inspectionCategory,
        i.inspectedQty,
        i.passedQty,
        i.defectQty,
        i.judgeResult,
        i.inspector,
        i.inspectedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. Engineering Management (연구개발)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">시품질 (PLM-008)</h1>
          <span className="text-[11px] text-sub">R&D 개발 시제품 초물검사(FAI) · 전기/신뢰성 성능 평가 · 양산 이관 승인</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 초물검사(FAI) 진행 건수</div>
          <div className="text-xl font-bold mt-1 font-mono">{items.length} <span className="text-xs font-normal">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">양산 이관 승인 건수</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{items.filter((i) => i.judgeResult === "양산승인").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">조건부 승인 / 보완 필요</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{items.filter((i) => i.judgeResult !== "양산승인").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">판정:</span>
          {["전체", "양산승인", "조건부승인"].map((j) => (
            <button
              key={j}
              onClick={() => setJudgeFilter(j)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                judgeFilter === j
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {j}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 시품질 FAI Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">FAI 코드 / 프로젝트명</th>
              <th className="px-3 py-2">시제품 샘플 코드</th>
              <th className="px-3 py-2">검사 항목</th>
              <th className="px-3 py-2 text-right">검사 수량</th>
              <th className="px-3 py-2 text-right">합격 수량</th>
              <th className="px-3 py-2 text-right">불량 수량</th>
              <th className="px-3 py-2">최종 판정 결과</th>
              <th className="px-3 py-2">검사자</th>
              <th className="px-3 py-2">검사 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">
                  <div className="font-bold font-mono">{i.faiCode}</div>
                  <div className="text-[11px] text-sub">{i.projectName}</div>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.protoSampleCode}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.inspectionCategory}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.inspectedQty} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.passedQty} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-red-500">{i.defectQty} EA</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.judgeResult === "양산승인" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.judgeResult}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub">{i.inspector}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.inspectedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
