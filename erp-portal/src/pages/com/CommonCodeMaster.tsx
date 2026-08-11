// COM-006 공통코드 (Standard System Code Master) — 전사 시스템 공통 분류 코드그룹 및 상세 코드 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CommonCodeItem {
  id: string;
  codeGroupId: string;
  codeGroupName: string;
  codeValue: string;
  codeName: string;
  sortOrder: number;
  useYn: "Y" | "N";
  description: string;
}

export const commonCodeStore = createStore("com.common_code", [
  { id: "COD-01", codeGroupId: "SYS_CURRENCY", codeGroupName: "통화 코드", codeValue: "KRW", codeName: "원화 (대한민국)", sortOrder: 1, useYn: "Y", description: "기본 장부 통화" },
  { id: "COD-02", codeGroupId: "SYS_CURRENCY", codeGroupName: "통화 코드", codeValue: "USD", codeName: "미국 달러", sortOrder: 2, useYn: "Y", description: "수출 외화 거래 통화" },
  { id: "COD-03", codeGroupId: "PLANT_CODE", codeGroupName: "공장 코드", codeValue: "PLANT-01", codeName: "제1제조공장 (수원)", sortOrder: 1, useYn: "Y", description: "메인 소형가전 제조 라인" },
  { id: "COD-04", codeGroupId: "QUALITY_JUDGE", codeGroupName: "품질 판정구분", codeValue: "PASS", codeName: "검사 합격", sortOrder: 1, useYn: "Y", description: "품질 검사 합격 판정" },
]);

export default function CommonCodeMaster() {
  const items = useStore(commonCodeStore) as CommonCodeItem[];
  const [groupFilter, setGroupFilter] = useState("전체");

  const filtered = items.filter((i) => groupFilter === "전체" || i.codeGroupId === groupFilter);

  const excel = () =>
    downloadCsv(
      "시스템_표준_공통코드_마스터_대장.csv",
      ["코드그룹ID", "코드그룹명", "세부코드값", "세부코드명", "정렬순서", "사용여부", "비고설명"],
      filtered.map((i) => [
        i.codeGroupId,
        i.codeGroupName,
        i.codeValue,
        i.codeName,
        i.sortOrder,
        i.useYn,
        i.description,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공통코드 (COM-006)</h1>
          <span className="text-[11px] text-sub">전사 모듈 공통 표준 분류 코드 그룹 및 상세 코드 마스터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">등록 공통 코드 마스터 총 건수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">사용중 (Active) 코드 비율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">표준 코드 그룹 종류</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">3 <span className="text-xs font-normal text-ink">개 그룹</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">코드그룹:</span>
          {["전체", "SYS_CURRENCY", "PLANT_CODE", "QUALITY_JUDGE"].map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                groupFilter === g
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 공통코드 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">코드그룹 ID / 명</th>
              <th className="px-3 py-2">세부 코드 값</th>
              <th className="px-3 py-2">세부 코드 명</th>
              <th className="px-3 py-2 text-right">정렬 순서</th>
              <th className="px-3 py-2">사용 여부</th>
              <th className="px-3 py-2">비고 설명</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">
                  <div className="font-bold font-mono text-blue-600">{i.codeGroupId}</div>
                  <div className="text-[11px] text-sub">{i.codeGroupName}</div>
                </td>
                <td className="px-3 py-2 font-mono font-bold text-ink">{i.codeValue}</td>
                <td className="px-3 py-2 font-semibold text-emerald-600">{i.codeName}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.sortOrder}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.useYn}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub text-[11px]">{i.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
