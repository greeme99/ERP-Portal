// LE-010 통관 및 수출입관리 — 수출입 B/L, HS코드, 관세/부가세 및 통관 절차 모니터링
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CustomsDoc {
  id: string;
  docNo: string; // 통관신고번호
  type: "수출" | "수입";
  hsCode: string;
  itemName: string;
  declarationAmount: number; // 신고금액(USD)
  tariffRate: number; // 관세율(%)
  dutyAmount: number; // 관세액(KRW)
  customsOffice: string; // 관할세관
  status: "신고접수" | "통관심사" | "수리완료" | "보류";
  declaredAt: string;
}

export const customsStore = createStore("le.customs", [
  { id: "CUS-01", docNo: "110-26-200912X", type: "수입", hsCode: "8504.40-3000", itemName: "전원공급장치 (SMPS)", declarationAmount: 45000, tariffRate: 8, dutyAmount: 4860000, customsOffice: "인천세관", status: "수리완료", declaredAt: "2026-07-28" },
  { id: "CUS-02", docNo: "110-26-200945X", type: "수출", hsCode: "8516.79-9000", itemName: "소형가전 무선청소기 FG-1001", declarationAmount: 120000, tariffRate: 0, dutyAmount: 0, customsOffice: "부산세관", status: "수리완료", declaredAt: "2026-07-30" },
  { id: "CUS-03", docNo: "110-26-201011X", type: "수입", hsCode: "8501.10-1000", itemName: "소형 모터 (BLDC)", declarationAmount: 28000, tariffRate: 8, dutyAmount: 3024000, customsOffice: "평택세관", status: "통관심사", declaredAt: "2026-08-02" },
  { id: "CUS-04", docNo: "110-26-201050X", type: "수출", hsCode: "8516.50-0000", itemName: "스마트 공기청정기 FG-2002", declarationAmount: 85000, tariffRate: 0, dutyAmount: 0, customsOffice: "인천공항세관", status: "신고접수", declaredAt: "2026-08-04" },
]);

export default function CustomsManagement() {
  const docs = useStore(customsStore) as CustomsDoc[];
  const [typeFilter, setTypeFilter] = useState("전체");

  const filtered = docs.filter((d) => typeFilter === "전체" || d.type === typeFilter);

  const totalUSD = filtered.reduce((acc, d) => acc + d.declarationAmount, 0);
  const totalDuty = filtered.reduce((acc, d) => acc + d.dutyAmount, 0);

  const excel = () =>
    downloadCsv(
      "통관_수출입신고대장.csv",
      ["신고번호", "구분", "HS Code", "품목명", "신고금액(USD)", "관세율(%)", "관세액(원)", "관할세관", "상태", "신고일자"],
      filtered.map((d) => [
        d.docNo,
        d.type,
        d.hsCode,
        d.itemName,
        d.declarationAmount,
        d.tariffRate,
        d.dutyAmount,
        d.customsOffice,
        d.status,
        d.declaredAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">04. Logistics Management (물류관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">수출입 및 통관관리 (LE-010)</h1>
          <span className="text-[11px] text-sub">수출입 신고대장 · HS Code 분류 · 관세 및 세관 통관 현황</span>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 신고 금액 (USD)</div>
          <div className="text-xl font-bold mt-1 font-mono">${totalUSD.toLocaleString()}</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">수입 관세 납부액 (KRW)</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{totalDuty.toLocaleString()} <span className="text-xs font-normal text-ink">원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">통관 수리율</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {((docs.filter((d) => d.status === "수리완료").length / docs.length) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">수출입 구분:</span>
          {["전체", "수출", "수입"].map((t) => (
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
          📥 통관 대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">신고번호</th>
              <th className="px-3 py-2">구분</th>
              <th className="px-3 py-2">HS Code</th>
              <th className="px-3 py-2">품목명</th>
              <th className="px-3 py-2 text-right">신고금액 (USD)</th>
              <th className="px-3 py-2 text-right">관세액 (KRW)</th>
              <th className="px-3 py-2">관할세관</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">신고일자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{d.docNo}</td>
                <td className="px-3 py-2 font-bold">
                  <span className={d.type === "수출" ? "text-emerald-600" : "text-blue-600"}>{d.type}</span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{d.hsCode}</td>
                <td className="px-3 py-2">{d.itemName}</td>
                <td className="px-3 py-2 text-right font-mono font-medium">${d.declarationAmount.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{d.dutyAmount ? `${d.dutyAmount.toLocaleString()}원` : "-"}</td>
                <td className="px-3 py-2 text-sub">{d.customsOffice}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    d.status === "수리완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{d.declaredAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
