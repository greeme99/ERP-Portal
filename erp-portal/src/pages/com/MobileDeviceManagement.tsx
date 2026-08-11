// COM-019 모바일디바이스관리 (Mobile Device & Handheld MDM Management) — 모바일 현장 태블릿 및 PDA 단말기 인가 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface MobileDeviceItem {
  id: string;
  deviceId: string;
  deviceModelName: string; // 디바이스 기종 (예: 삼성 갤럭시 탭 Active 4 Pro, 파스콘 산업용 PDA)
  osTypeVersion: string; // OS 버전 (예: Android 14.0, iOS 17.5)
  assignedUserName: string; // 단말기 사용 엔지니어 / 물류 담당자
  appVersion: string; // 모바일 ERP 앱 버전
  approvalStatus: "인가 승인 (Approved)" | "미승인 차단" | "원격 데이터 삭제 완료";
  lastConnectedTime: string;
}

export const mobileDeviceStore = createStore("com.mobile_device", [
  { id: "DEV-01", deviceId: "MDM-TAB-2026-01", deviceModelName: "삼성 갤럭시 탭 Active 4 Pro 5G", osTypeVersion: "Android 14.0 Enterprise", assignedUserName: "김동선 테크니션 (AS)", appVersion: "v2.5.0-mobile", approvalStatus: "인가 승인 (Approved)", lastConnectedTime: "2026-08-06 18:10" },
  { id: "DEV-02", deviceId: "MDM-PDA-2026-02", deviceModelName: "산업용 무선 바코드 바코드 PDA", osTypeVersion: "Android 13.0 Industrial", assignedUserName: "정창고 대리 (물류)", appVersion: "v2.5.0-mobile", approvalStatus: "인가 승인 (Approved)", lastConnectedTime: "2026-08-06 17:55" },
]);

export default function MobileDeviceManagement() {
  const items = useStore(mobileDeviceStore) as MobileDeviceItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = items.filter((i) => statusFilter === "전체" || i.approvalStatus.includes(statusFilter));

  const excel = () =>
    downloadCsv(
      "시스템_모바일디바이스_MDM_관리_대장.csv",
      ["디바이스ID", "기종명", "OS버전", "사용자", "앱버전", "인가상태", "최근접속일시"],
      filtered.map((i) => [
        i.deviceId,
        i.deviceModelName,
        i.osTypeVersion,
        i.assignedUserName,
        i.appVersion,
        i.approvalStatus,
        i.lastConnectedTime,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">모바일디바이스관리 (COM-019)</h1>
          <span className="text-[11px] text-sub">AS 현장 태블릿 및 창고 물류 바코드 PDA 모바일 단말기 MDM 인가 및 원격 보안 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">인가 승인 모바일 디바이스 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.filter((i) => i.approvalStatus.includes("Approved")).length} <span className="text-xs font-normal text-ink">대</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">최신 모바일 ERP 앱 적용 비율</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">100.0%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">원격 단말 보안 잠금 준수율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "인가 승인"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === s
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 모바일MDM Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">디바이스 ID</th>
              <th className="px-3 py-2">단말 기종명</th>
              <th className="px-3 py-2">OS 및 버전</th>
              <th className="px-3 py-2">할당 사용자</th>
              <th className="px-3 py-2">모바일 ERP 앱 버전</th>
              <th className="px-3 py-2">MDM 인가 상태</th>
              <th className="px-3 py-2">최근 접속 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.deviceId}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.deviceModelName}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.osTypeVersion}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.assignedUserName}</td>
                <td className="px-3 py-2 font-mono text-purple-600 font-bold">{i.appVersion}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {i.approvalStatus}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{i.lastConnectedTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
