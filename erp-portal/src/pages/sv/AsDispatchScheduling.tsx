// SV-001 AS접수 (Service Dispatch & Engineer Scheduling) — 고객 방문 AS 수리 접수·엔지니어 배정 스케줄 및 당일 현장 수리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface AsDispatchItem {
  id: string;
  receiptNo: string;
  customerName: string;
  customerPhone: string;
  addressZone: string; // 방문 지역 (예: 서울 강남구 역삼동)
  productName: string;
  symptomDetail: string; // 고장 증상
  assignedEngineer: string; // 담당 엔지니어
  visitScheduledDate: string; // 방문 예정 일시
  dispatchStatus: "접수완료" | "엔지니어 배정" | "방문 수리중" | "수리 완료";
}

export const asDispatchStore = createStore("sv.as_dispatch", [
  { id: "DSP-01", receiptNo: "AS-2026-0801", customerName: "김고객", customerPhone: "010-1111-2222", addressZone: "서울 강남구 역삼동", productName: "소형가전 무선청소기 FG-1001", symptomDetail: "전원 작동 불능 및 배터리 충전 불가", assignedEngineer: "최엔지니어 기사", visitScheduledDate: "2026-08-06 14:00", dispatchStatus: "방문 수리중" },
  { id: "DSP-02", receiptNo: "AS-2026-0802", customerName: "이소비자", customerPhone: "010-3333-4444", addressZone: "서울 서초구 반포동", productName: "스마트 무선 로봇청소기 FG-1002", symptomDetail: "자율주행 센서 오작동 및 제자리 회전", assignedEngineer: "정수리 책임", visitScheduledDate: "2026-08-06 16:30", dispatchStatus: "엔지니어 배정" },
  { id: "DSP-03", receiptNo: "AS-2026-0803", customerName: "박구매", customerPhone: "010-5555-6666", addressZone: "경기 성남시 분당구", productName: "전자기판 모듈 SF-2001", symptomDetail: "메인 PCB 기판 통신 에러 E-04", assignedEngineer: "강기술 팀장", visitScheduledDate: "2026-08-05 11:00", dispatchStatus: "수리 완료" },
]);

export default function AsDispatchScheduling() {
  const items = useStore(asDispatchStore) as AsDispatchItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.dispatchStatus === statusFilter);

  const excel = () =>
    downloadCsv(
      "서비스_AS접수_방문스케줄_대장.csv",
      ["접수번호", "고객명", "연락처", "방문지역", "제품명", "고장증상", "담당엔지니어", "방문예정일시", "수리상태"],
      filtered.map((i) => [
        i.receiptNo,
        i.customerName,
        i.customerPhone,
        i.addressZone,
        i.productName,
        i.symptomDetail,
        i.assignedEngineer,
        i.visitScheduledDate,
        i.dispatchStatus,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. Customer Service (고객서비스)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">AS접수 (SV-001)</h1>
          <span className="text-[11px] text-sub">고객 방문 수리 AS 접수 · 전담 엔지니어 관할구역 배정 스케줄 및 당일 방문 완료 처리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">금일 당일 AS 방문 접수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">현재 방문 수리 진행중</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {items.filter((i) => i.dispatchStatus === "방문 수리중").length} <span className="text-xs font-normal text-ink">건</span>
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">당일 방문 수리 완료율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {((items.filter((i) => i.dispatchStatus === "수리 완료").length / (items.length || 1)) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "엔지니어 배정", "방문 수리중", "수리 완료"].map((st) => (
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
          📥 AS접수대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">접수 번호</th>
              <th className="px-3 py-2">고객명 / 연락처</th>
              <th className="px-3 py-2">방문 지역 주소</th>
              <th className="px-3 py-2">제품명</th>
              <th className="px-3 py-2">고장 증상 요약</th>
              <th className="px-3 py-2">담당 엔지니어</th>
              <th className="px-3 py-2">방문 예정 일시</th>
              <th className="px-3 py-2">수리 상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">{i.receiptNo}</td>
                <td className="px-3 py-2 font-medium">
                  <div>{i.customerName}</div>
                  <div className="text-[11px] text-sub">{i.customerPhone}</div>
                </td>
                <td className="px-3 py-2 text-sub font-medium">{i.addressZone}</td>
                <td className="px-3 py-2 text-sub">{i.productName}</td>
                <td className="px-3 py-2 font-semibold text-red-500">{i.symptomDetail}</td>
                <td className="px-3 py-2 font-bold text-ink">{i.assignedEngineer}</td>
                <td className="px-3 py-2 font-mono text-blue-600 font-bold">{i.visitScheduledDate}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.dispatchStatus === "수리 완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    i.dispatchStatus === "방문 수리중" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.dispatchStatus}
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
