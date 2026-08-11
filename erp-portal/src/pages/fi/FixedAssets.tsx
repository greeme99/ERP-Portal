// FI-006 고정자산관리 — 고정자산 취득·감가상각(정액법/정률법)·장부가액 및 매각/폐기 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  category: "생산설비" | "건물/구축물" | "차량운반구" | "비품/공구";
  acqDate: string;
  acqCost: number; // 취득가액
  usefulLife: number; // 내용연수(년)
  depMethod: "정액법" | "정률법";
  salvageValue: number; // 잔존가액
  accumDep: number; // 감가상각누계액
  status: "가동중" | "매각" | "폐기";
}

export const fixedAssetStore = createStore("fi.fixed_asset", [
  { id: "FA-001", code: "FA-2024-01", name: "사출성형기 500톤 (A라인)", category: "생산설비", acqDate: "2024-01-15", acqCost: 120000000, usefulLife: 5, depMethod: "정액법", salvageValue: 12000000, accumDep: 36000000, status: "가동중" },
  { id: "FA-002", code: "FA-2024-02", name: "SMT 칩마운터 (B라인)", category: "생산설비", acqDate: "2024-03-20", acqCost: 250000000, usefulLife: 5, depMethod: "정액법", salvageValue: 25000000, accumDep: 67500000, status: "가동중" },
  { id: "FA-003", code: "FA-2023-01", name: "본사 제조공장 1동", category: "건물/구축물", acqDate: "2020-05-10", acqCost: 1500000000, usefulLife: 20, depMethod: "정액법", salvageValue: 150000000, accumDep: 405000000, status: "가동중" },
  { id: "FA-004", code: "FA-2025-01", name: "물류용 3.5톤 트럭", category: "차량운반구", acqDate: "2025-02-01", acqCost: 45000000, usefulLife: 5, depMethod: "정률법", salvageValue: 4500000, accumDep: 12000000, status: "가동중" },
  { id: "FA-005", code: "FA-2025-02", name: "품질검사용 3D 측정기", category: "비품/공구", acqDate: "2025-04-10", acqCost: 35000000, usefulLife: 3, depMethod: "정액법", salvageValue: 3500000, accumDep: 7000000, status: "가동중" },
]);

export default function FixedAssets() {
  const assets = useStore(fixedAssetStore) as FixedAsset[];
  const [filterCat, setFilterCat] = useState("전체");

  const filtered = assets.filter((a) => filterCat === "전체" || a.category === filterCat);

  // 총 취득가액, 감가상각누계액, 장부가액 계산
  const totalAcqCost = filtered.reduce((acc, a) => acc + a.acqCost, 0);
  const totalAccumDep = filtered.reduce((acc, a) => acc + a.accumDep, 0);
  const totalBookValue = totalAcqCost - totalAccumDep;

  const excel = () =>
    downloadCsv(
      "고정자산_대장.csv",
      ["자산코드", "자산명", "분류", "취득일자", "취득가액", "내용연수", "상각방법", "감가상각누계액", "장부가액", "상태"],
      filtered.map((a) => [
        a.code,
        a.name,
        a.category,
        a.acqDate,
        a.acqCost,
        a.usefulLife,
        a.depMethod,
        a.accumDep,
        a.acqCost - a.accumDep,
        a.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">08. Financial Accounting (재무회계)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">고정자산관리 (FI-006)</h1>
          <span className="text-[11px] text-sub">고정자산 대장 · 감가상각(정액/정률) · 장부가액 추이</span>
        </div>
      </div>

      {/* 요약 KPI 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 취득가액</div>
          <div className="text-xl font-bold mt-1">{(totalAcqCost / 100000000).toFixed(2)} <span className="text-xs font-normal">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">감가상각 누계액</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{(totalAccumDep / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">순 장부가액</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{(totalBookValue / 100000000).toFixed(2)} <span className="text-xs font-normal text-ink">억원</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">자산 분류:</span>
          {["전체", "생산설비", "건물/구축물", "차량운반구", "비품/공구"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterCat === cat
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 고정자산대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">자산코드 / 명</th>
              <th className="px-3 py-2">분류</th>
              <th className="px-3 py-2">취득일자</th>
              <th className="px-3 py-2 text-right">취득가액</th>
              <th className="px-3 py-2 text-right">내용연수</th>
              <th className="px-3 py-2">상각방법</th>
              <th className="px-3 py-2 text-right">감가상각 누계액</th>
              <th className="px-3 py-2 text-right">순 장부가액</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const bookValue = a.acqCost - a.accumDep;
              return (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2 font-medium">{a.code} — {a.name}</td>
                  <td className="px-3 py-2 text-sub">{a.category}</td>
                  <td className="px-3 py-2 font-mono text-sub">{a.acqDate}</td>
                  <td className="px-3 py-2 text-right font-mono">{a.acqCost.toLocaleString()}원</td>
                  <td className="px-3 py-2 text-right font-mono">{a.usefulLife}년</td>
                  <td className="px-3 py-2 text-sub">{a.depMethod}</td>
                  <td className="px-3 py-2 text-right font-mono text-amber-600">{a.accumDep.toLocaleString()}원</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">{bookValue.toLocaleString()}원</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      {a.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
