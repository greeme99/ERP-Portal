// QM-001 검사기준관리 — 품목별 검사항목·스펙 기준치·AQL 허용차수 및 검사 기준서
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface InspectionStandard {
  id: string;
  stdNo: string; // 기준서 번호
  materialCode: string;
  materialName: string;
  inspType: "수입검사" | "공정검사" | "출하검사";
  checkItem: string; // 검사항목 (예: 모터 소음, 외관 흠집, 치수 공차)
  specValue: string; // 규격/기준치 (예: 45dB 이하, 10mm ±0.05)
  aqlLevel: string; // AQL 수준
  revNo: string; // 개정번호
  status: "개정완료" | "적용중";
  updatedAt: string;
}

export const inspectionStdStore = createStore("qm.inspection_std", [
  { id: "STD-01", stdNo: "STD-FG-001", materialCode: "FG-1001", materialName: "소형가전 무선청소기", inspType: "출하검사", checkItem: "흡입력 / 동작 소음", specValue: "흡입력 200W 이상 / 소음 65dB 이하", aqlLevel: "AQL 0.65 Level II", revNo: "Rev.02", status: "적용중", updatedAt: "2026-06-15" },
  { id: "STD-02", stdNo: "STD-RM-004", materialCode: "RM-3004", materialName: "BLDC 모터 코어 자재", inspType: "수입검사", checkItem: "권선 저항 / 샤프트 외경", specValue: "저항 2.5Ω ±5% / 외경 5.0mm ±0.01", aqlLevel: "AQL 0.40 Level II", revNo: "Rev.01", status: "적용중", updatedAt: "2026-05-10" },
  { id: "STD-03", stdNo: "STD-SF-001", materialCode: "SF-2001", materialName: "메인 제어 PCB 모듈", inspType: "공정검사", checkItem: "SMT 납땜 납도포 / 통신 테스트", specValue: "납도포 100% 검사 / CAN 통신 정상", aqlLevel: "AQL 0.25 Level II", revNo: "Rev.03", status: "개정완료", updatedAt: "2026-07-01" },
]);

export default function InspectionStandards() {
  const standards = useStore(inspectionStdStore) as InspectionStandard[];
  const [typeFilter, setTypeFilter] = useState("전체");

  const filtered = standards.filter((s) => typeFilter === "전체" || s.inspType === typeFilter);

  const excel = () =>
    downloadCsv(
      "품질_검사기준서_대장.csv",
      ["기준서번호", "품목코드", "품목명", "검사구분", "검사항목", "규격기준치", "AQL수준", "개정번호", "상태", "수정일자"],
      filtered.map((s) => [
        s.stdNo,
        s.materialCode,
        s.materialName,
        s.inspType,
        s.checkItem,
        s.specValue,
        s.aqlLevel,
        s.revNo,
        s.status,
        s.updatedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. Quality Management (품질관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">검사기준관리 (QM-001)</h1>
          <span className="text-[11px] text-sub">품목별 검사 기준서 · 검사항목 및 스펙 규격치 · AQL 샘플링 기준</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">검사 구분:</span>
          {["전체", "수입검사", "공정검사", "출하검사"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                typeFilter === t
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 검사기준서 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">기준서 번호</th>
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2">검사구분</th>
              <th className="px-3 py-2">검사항목</th>
              <th className="px-3 py-2">규격 / 기준치 (Spec)</th>
              <th className="px-3 py-2">AQL 수준</th>
              <th className="px-3 py-2">개정번호</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{s.stdNo}</td>
                <td className="px-3 py-2">{s.materialCode} — {s.materialName}</td>
                <td className="px-3 py-2 font-bold text-blue-600">{s.inspType}</td>
                <td className="px-3 py-2 font-medium">{s.checkItem}</td>
                <td className="px-3 py-2 font-mono text-emerald-600">{s.specValue}</td>
                <td className="px-3 py-2 text-sub text-[11px]">{s.aqlLevel}</td>
                <td className="px-3 py-2 font-mono text-sub">{s.revNo}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {s.status}
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
