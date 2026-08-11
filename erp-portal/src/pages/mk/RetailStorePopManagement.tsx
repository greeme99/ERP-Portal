// MK-011 리테일매장POP관리 (Retail Store Monitoring & POP Display) — 전국 오프라인 유통 매장 POP 진열대 및 시연기기 현장 점검 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface RetailPopItem {
  id: string;
  storeCode: string;
  storeName: string; // 유통 매장명 (예: 롯데하이마트 잠실점, 이마트 역삼점, 현대백화점 판교점)
  retailChannel: "하이마트/전자마트" | "대형마트 (이마트/홈플러스)" | "백화점 직영점";
  popDisplayStatus: "골든존 진열 (최상)" | "일반 진열" | "진열대 보수 필요";
  demoUnitWorkingYn: "Y" | "N"; // 시연용 로봇청소기/청소기 정상 작동 여부
  fieldMdName: string; // 담당 리테일 MD / 현장 매니저
  auditScore: number; // 매장 점검 점수 (100점 만점)
  lastAuditDate: string;
}

export const retailPopStore = createStore("mk.retail_pop", [
  { id: "POP-01", storeCode: "STORE-001", storeName: "롯데하이마트 잠실 롯데월드몰점", retailChannel: "하이마트/전자마트", popDisplayStatus: "골든존 진열 (최상)", demoUnitWorkingYn: "Y", fieldMdName: "이리테일 과장", auditScore: 98, lastAuditDate: "2026-08-05" },
  { id: "POP-02", storeCode: "STORE-002", storeName: "이마트 역삼점 가전 매장", retailChannel: "대형마트 (이마트/홈플러스)", popDisplayStatus: "일반 진열", demoUnitWorkingYn: "Y", fieldMdName: "박현장 대리", auditScore: 90, lastAuditDate: "2026-08-04" },
  { id: "POP-03", storeCode: "STORE-003", storeName: "현대백화점 판교점 직영 매장", retailChannel: "백화점 직영점", popDisplayStatus: "골든존 진열 (최상)", demoUnitWorkingYn: "Y", fieldMdName: "이리테일 과장", auditScore: 100, lastAuditDate: "2026-08-06" },
]);

export default function RetailStorePopManagement() {
  const items = useStore(retailPopStore) as RetailPopItem[];
  const [channelFilter, setChannelFilter] = useState("전체");

  const filtered = items.filter((i) => channelFilter === "전체" || i.retailChannel.includes(channelFilter));

  const avgScore = filtered.reduce((acc, i) => acc + i.auditScore, 0) / (filtered.length || 1);

  const excel = () =>
    downloadCsv(
      "마케팅_리테일매장_POP진열_점검_대장.csv",
      ["매장코드", "매장명", "유통채널", "POP진열상태", "시연기기작동", "담당MD", "점검점수", "최근점검일"],
      filtered.map((i) => [
        i.storeCode,
        i.storeName,
        i.retailChannel,
        i.popDisplayStatus,
        i.demoUnitWorkingYn,
        i.fieldMdName,
        i.auditScore,
        i.lastAuditDate,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">12. Marketing Management (마케팅)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">리테일매장POP관리 (MK-011)</h1>
          <span className="text-[11px] text-sub">전국 오프라인 가전 유통 매장 POP 진열대 상태 · 골든존 입점률 및 시연기기 현장 점검</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">관리 오프라인 유통 매장 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">개 매장</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 매장 POP 점검 점수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgScore.toFixed(1)} <span className="text-xs font-normal text-ink">점</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">골든존 입점 비율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {((items.filter((i) => i.popDisplayStatus.includes("골든존")).length / (items.length || 1)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">채널:</span>
          {["전체", "하이마트", "대형마트", "백화점"].map((c) => (
            <button
              key={c}
              onClick={() => setChannelFilter(c)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                channelFilter === c
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 POP관리 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">매장 코드</th>
              <th className="px-3 py-2">유통 매장명</th>
              <th className="px-3 py-2">유통 채널</th>
              <th className="px-3 py-2">POP 진열 상태</th>
              <th className="px-3 py-2">시연기기 작동</th>
              <th className="px-3 py-2">담당 MD</th>
              <th className="px-3 py-2 text-right">점검 점수</th>
              <th className="px-3 py-2">최근 점검일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.storeCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.storeName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.retailChannel}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.popDisplayStatus.includes("골든존") ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}>
                    {i.popDisplayStatus}
                  </span>
                </td>
                <td className="px-3 py-2 font-bold font-mono text-emerald-600">{i.demoUnitWorkingYn}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.fieldMdName}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{i.auditScore}점</td>
                <td className="px-3 py-2 font-mono text-sub">{i.lastAuditDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
