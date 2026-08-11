// QM-012 고객품질클레임 (Customer Quality Claims & Field Issues) — 필드 불량 발생 접수·8D 리포트 연동 원인 규명 및 클레임 비용 트래킹
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CustomerClaimItem {
  id: string;
  claimNo: string;
  customerName: string;
  productName: string;
  defectCategory: "소음/진동" | "전원불량" | "외관스크래치" | "기능오작동";
  claimedQty: number; // 클레임 제기 수량
  claimCost: number; // 클레임 처리 비용 (KRW)
  eightDReportNo: string; // 연동 8D 리포트 번호
  claimStatus: "접수완료" | "원인분석중" | "대책수립" | "클레임종결";
  receivedAt: string;
}

export const customerClaimStore = createStore("qm.customer_claim", [
  { id: "CLM-01", claimNo: "CLM-2026-001", customerName: "삼성전자 글로벌", productName: "소형가전 무선청소기 FG-1001", defectCategory: "소음/진동", claimedQty: 10, claimCost: 1500000, eightDReportNo: "8D-2026-001", claimStatus: "대책수립", receivedAt: "2026-07-29" },
  { id: "CLM-02", claimNo: "CLM-2026-002", customerName: "쿠쿠전자", productName: "전자기판 모듈 SF-2001", defectCategory: "전원불량", claimedQty: 5, claimCost: 850000, eightDReportNo: "8D-2026-002", claimStatus: "원인분석중", receivedAt: "2026-08-03" },
]);

export default function CustomerClaim() {
  const items = useStore(customerClaimStore) as CustomerClaimItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.claimStatus === statusFilter);

  const totalClaimCost = filtered.reduce((acc, i) => acc + i.claimCost, 0);

  const excel = () =>
    downloadCsv(
      "품질_고객_클레임_처리대장.csv",
      ["클레임번호", "고객사명", "제품명", "불량유형", "제기수량", "클레임비용(원)", "8D리포트번호", "처리상태", "접수일시"],
      filtered.map((i) => [
        i.claimNo,
        i.customerName,
        i.productName,
        i.defectCategory,
        i.claimedQty,
        i.claimCost,
        i.eightDReportNo,
        i.claimStatus,
        i.receivedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">05. Quality Management (품질관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">고객품질클레임 (QM-012)</h1>
          <span className="text-[11px] text-sub">고객사 필드 품질 클레임 접수 · 8D 문제해결 보고서 연동 및 보상 비용 트래킹</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 필드 클레임 접수 건수</div>
          <div className="text-xl font-bold mt-1 font-mono text-amber-600">{items.length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">총 클레임 보상 비용</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{(totalClaimCost / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">8D 리포트 작성 진행률</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "원인분석중", "대책수립"].map((st) => (
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
          📥 고객클레임 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">클레임 번호</th>
              <th className="px-3 py-2">고객사명 / 제품명</th>
              <th className="px-3 py-2">불량 유형</th>
              <th className="px-3 py-2 text-right">제기 수량</th>
              <th className="px-3 py-2 text-right">클레임 처리 비용</th>
              <th className="px-3 py-2">8D 리포트 번호</th>
              <th className="px-3 py-2">처리 상태</th>
              <th className="px-3 py-2">접수 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold">{i.claimNo}</td>
                <td className="px-3 py-2 font-medium">
                  <div>{i.customerName}</div>
                  <div className="text-[11px] text-sub">{i.productName}</div>
                </td>
                <td className="px-3 py-2 font-semibold text-red-500">{i.defectCategory}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.claimedQty} EA</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-red-500">{(i.claimCost / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 font-mono text-blue-600 font-bold">{i.eightDReportNo}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    i.claimStatus === "대책수립" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {i.claimStatus}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.receivedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
