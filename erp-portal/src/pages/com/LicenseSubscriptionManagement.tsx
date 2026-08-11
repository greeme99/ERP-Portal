// COM-026 라이선스및구독관리 (SaaS License & Enterprise Cloud Subscription Management) — 전사 소프트웨어 라이선스 및 SaaS 서브스크립션 대장
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface LicenseSubscriptionItem {
  id: string;
  subscriptionCode: string;
  softwareVendorName: string; // 솔루션/벤더명 (예: Google Antigravity AI Agent Engine, AWS Cloud Infrastructure, SAP Crystal Reports)
  licenseType: "SaaS 월간 구독 (Subscription)" | "기업 전용 라이선스 (Perpetual)";
  purchasedLicenseCount: number; // 구매 라이선스 수 (User/Seat)
  assignedActiveUserCount: number; // 현재 실제 할당 활성 사용자 수
  monthlySubscriptionFee: number; // 월 구독 비용 (KRW)
  renewalDueDate: string; // 갱신 만료 예정일
  status: "구독 사용중 (Active)" | "갱신 대기";
}

export const licenseSubStore = createStore("com.license_sub", [
  { id: "LIC-01", subscriptionCode: "SUB-AGY-01", softwareVendorName: "Google Antigravity Enterprise AI Agent Engine", licenseType: "SaaS 월간 구독 (Subscription)", purchasedLicenseCount: 50, assignedActiveUserCount: 48, monthlySubscriptionFee: 3500000, renewalDueDate: "2026-12-31", status: "구독 사용중 (Active)" },
  { id: "LIC-02", subscriptionCode: "SUB-GCP-02", softwareVendorName: "Google Cloud Platform (GCP) ERP DB & Storage", licenseType: "SaaS 월간 구독 (Subscription)", purchasedLicenseCount: 1, assignedActiveUserCount: 1, monthlySubscriptionFee: 5800000, renewalDueDate: "2026-12-31", status: "구독 사용중 (Active)" },
]);

export default function LicenseSubscriptionManagement() {
  const items = useStore(licenseSubStore) as LicenseSubscriptionItem[];
  const [vendorFilter, setVendorFilter] = useState("전체");

  const filtered = items.filter((i) => vendorFilter === "전체" || i.softwareVendorName.includes(vendorFilter));

  const totalMonthlyFee = filtered.reduce((acc, i) => acc + i.monthlySubscriptionFee, 0);

  const excel = () =>
    downloadCsv(
      "시스템_소프트웨어_라이선스_구독_대장.csv",
      ["구독코드", "솔루션벤더명", "라이선스유형", "구매수량", "할당사용자", "월구독료(원)", "갱신예정일", "상태"],
      filtered.map((i) => [
        i.subscriptionCode,
        i.softwareVendorName,
        i.licenseType,
        i.purchasedLicenseCount,
        i.assignedActiveUserCount,
        i.monthlySubscriptionFee,
        i.renewalDueDate,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">라이선스및구독관리 (COM-026)</h1>
          <span className="text-[11px] text-sub">Google Antigravity AI 엔진 · GCP 클라우드 SaaS 서브스크립션 및 소프트웨어 라이선스 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">월 총 SaaS 구독 비용</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{(totalMonthlyFee / 10000).toLocaleString()} <span className="text-xs font-normal text-ink">만원</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">구독 라이선스 유효 할당률</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {((items.reduce((acc, i) => acc + i.assignedActiveUserCount, 0) / (items.reduce((acc, i) => acc + i.purchasedLicenseCount, 0) || 1)) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">관리 엔터프라이즈 솔루션 수</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">{items.length} <span className="text-xs font-normal text-ink">개 솔루션</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">벤더:</span>
          {["전체", "Google", "GCP"].map((v) => (
            <button
              key={v}
              onClick={() => setVendorFilter(v)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                vendorFilter === v
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 라이선스구독 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">구독 코드</th>
              <th className="px-3 py-2">솔루션 벤더명</th>
              <th className="px-3 py-2">라이선스 유형</th>
              <th className="px-3 py-2 text-right">구매 수량</th>
              <th className="px-3 py-2 text-right">할당 활성 사용자</th>
              <th className="px-3 py-2 text-right">월 서브스크립션 비용</th>
              <th className="px-3 py-2">갱신 예정일</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.subscriptionCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.softwareVendorName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.licenseType}</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{i.purchasedLicenseCount}개</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.assignedActiveUserCount}명</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-purple-600">{(i.monthlySubscriptionFee / 10000).toLocaleString()}만원</td>
                <td className="px-3 py-2 font-mono text-sub">{i.renewalDueDate}</td>
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
