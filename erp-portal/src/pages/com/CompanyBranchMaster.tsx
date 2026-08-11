// COM-022 법인및사업장마스터 (Company Legal Entity & Branch Master) — 본사 법인 및 전국 제조 공장/지점 마스터
import { useState } from "react";
import { useStore, createStore, nextId } from "../../services/store";
import MassUpdateBar, { MassColumn } from "../../components/common/MassUpdateBar";

export interface CompanyBranchItem {
  id: string;
  companyCode: string;
  companyName: string; // 법인/사업장명 (예: (주)헤르메스 전자 본사, 평택 제1 스마트공장, 광주 제2 공장)
  businessRegistrationNo: string; // 사업자등록번호
  representativeName: string; // 대표자 성명
  businessCategoryType: string; // 업태 / 종목 (예: 제조업 / 소형가전제품 및 전자부품)
  branchLocationAddress: string; // 사업장 소재지 주소
  taxOfficeJurisdiction: string; // 관할 세무서 (예: 평택세무서, 서초세무서)
  status: "운영중 (Active)";
}

export const companyBranchStore = createStore("com.company_branch", [
  { id: "CMP-01", companyCode: "COMP-1000", companyName: "(주)헤르메스 전자 서울 본사", businessRegistrationNo: "124-81-56789", representativeName: "김대표 회장", businessCategoryType: "제조업 및 도소매 / 소형가전제품", branchLocationAddress: "서울특별시 서초구 반포대로 123 헤르메스타워 10층", taxOfficeJurisdiction: "서초세무서", status: "운영중 (Active)" },
  { id: "CMP-02", companyCode: "PLANT-2000", companyName: "평택 제1 스마트 생산공장", businessRegistrationNo: "124-85-12345", representativeName: "김대표 회장", businessCategoryType: "제조업 / 소형가전 청소기·모터 어셈블리", branchLocationAddress: "경기도 평택시 포승읍 산업단지로 45", taxOfficeJurisdiction: "평택세무서", status: "운영중 (Active)" },
]);

export default function CompanyBranchMaster() {
  const items = useStore(companyBranchStore) as CompanyBranchItem[];
  const [typeFilter, setTypeFilter] = useState("전체");

  const filtered = items.filter((i) => typeFilter === "전체" || i.companyName.includes(typeFilter));

  // 기준정보 일괄 다운로드/업로드 컬럼
  const massColumns: MassColumn[] = [
    { key: "companyCode", label: "법인/사업장코드", required: true },
    { key: "companyName", label: "법인/사업장명", required: true },
    { key: "businessRegistrationNo", label: "사업자등록번호" },
    { key: "representativeName", label: "대표자" },
    { key: "businessCategoryType", label: "업태/종목" },
    { key: "branchLocationAddress", label: "소재지" },
    { key: "taxOfficeJurisdiction", label: "관할세무서" },
  ];

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">법인및사업장마스터 (COM-022)</h1>
          <span className="text-[11px] text-sub">전사 헤르메스 법인 구조 · 본사 및 제조 생산 공장/지점 사업자 마스터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">등록 법인 및 사업장 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">개 사업장</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">주요 생산 공장 사업장</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">1 <span className="text-xs font-normal text-ink">개 공장</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">전자세금계산서 주계약 법인</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">사업장:</span>
          {["전체", "본사", "공장"].map((t) => (
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
        <div className="flex gap-1">
          <MassUpdateBar
            title="사업장마스터"
            filename="공통_법인사업장_마스터.csv"
            store={companyBranchStore}
            rows={filtered}
            columns={massColumns}
            newRow={() => ({ id: nextId("CB"), companyCode: "", companyName: "", businessRegistrationNo: "", representativeName: "", businessCategoryType: "", branchLocationAddress: "", taxOfficeJurisdiction: "", status: "운영중 (Active)" })}
          />
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">사업장 코드</th>
              <th className="px-3 py-2">법인 / 사업장명</th>
              <th className="px-3 py-2">사업자등록번호</th>
              <th className="px-3 py-2">대표자 성명</th>
              <th className="px-3 py-2">업태 / 종목</th>
              <th className="px-3 py-2">사업장 소재지 주소</th>
              <th className="px-3 py-2">관할 세무서</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.companyCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.companyName}</td>
                <td className="px-3 py-2 font-mono font-bold text-purple-600">{i.businessRegistrationNo}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.representativeName}</td>
                <td className="px-3 py-2 text-sub font-medium text-[11px]">{i.businessCategoryType}</td>
                <td className="px-3 py-2 text-sub text-[11px]">{i.branchLocationAddress}</td>
                <td className="px-3 py-2 text-emerald-600 font-bold text-[11px]">{i.taxOfficeJurisdiction}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.status}
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
