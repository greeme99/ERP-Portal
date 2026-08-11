// COM-024 글로벌시차타임존마스터 (Global Timezone & World Clock Master) — 전사 해외 법인/지점 타임존 및 서머타임 마스터
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface GlobalTimezoneItem {
  id: string;
  regionCode: string;
  regionBranchName: string; // 글로벌 사업장/지점명 (예: 서울 본사/평택 공장, 미국 법인 LA 지사, 유럽 법인 프랑크푸르트)
  timezoneCode: string; // 타임존 코드 (예: Asia/Seoul UTC+9, America/Los_Angeles UTC-7, Europe/Berlin UTC+2)
  utcOffsetHours: number; // UTC 시차 (시간)
  daylightSavingYn: "Y" | "N"; // 서머타임 적용 여부
  standardTransactionTime: string; // 각 지역 현재 기준 표준시
  status: "동기화 정상";
}

export const timezoneStore = createStore("com.timezone", [
  { id: "TZ-01", regionCode: "KR-HQ", regionBranchName: "대한민국 서울 본사 / 평택 공장", timezoneCode: "Asia/Seoul (KST)", utcOffsetHours: 9, daylightSavingYn: "N", standardTransactionTime: "2026-08-06 18:22 KST", status: "동기화 정상" },
  { id: "TZ-02", regionCode: "US-LA", regionBranchName: "미국 법인 LA 서부 물류센터", timezoneCode: "America/Los_Angeles (PDT)", utcOffsetHours: -7, daylightSavingYn: "Y", standardTransactionTime: "2026-08-06 02:22 PDT", status: "동기화 정상" },
  { id: "TZ-03", regionCode: "EU-FRA", regionBranchName: "유럽 법인 독일 프랑크푸르트 지사", timezoneCode: "Europe/Berlin (CEST)", utcOffsetHours: 2, daylightSavingYn: "Y", standardTransactionTime: "2026-08-06 11:22 CEST", status: "동기화 정상" },
]);

export default function GlobalTimezoneMaster() {
  const items = useStore(timezoneStore) as GlobalTimezoneItem[];
  const [regionFilter, setRegionFilter] = useState("전체");

  const filtered = items.filter((i) => regionFilter === "전체" || i.regionBranchName.includes(regionFilter));

  const excel = () =>
    downloadCsv(
      "시스템_글로벌_시차_타임존_마스터_대장.csv",
      ["지역코드", "사업장명", "타임존코드", "UTC시차", "서머타임여부", "현지기준시간", "상태"],
      filtered.map((i) => [
        i.regionCode,
        i.regionBranchName,
        i.timezoneCode,
        i.utcOffsetHours,
        i.daylightSavingYn,
        i.standardTransactionTime,
        i.status,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. System Common (시스템공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">글로벌시차타임존마스터 (COM-024)</h1>
          <span className="text-[11px] text-sub">해외 법인 및 유통 지사 표준 타임존(Timezone) · 서머타임(DST) 및 거래 전표 시간 동기화 마스터</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">동기화 글로벌 지사 수</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{items.length} <span className="text-xs font-normal text-ink">개 사업장</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">서머타임(DST) 적용 사업장</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{items.filter((i) => i.daylightSavingYn === "Y").length} <span className="text-xs font-normal text-ink">개 지사</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">전표 일시 서버 동기화율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">100.0%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">지역:</span>
          {["전체", "대한민국", "미국", "유럽"].map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                regionFilter === r
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 타임존 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">지역 코드</th>
              <th className="px-3 py-2">글로벌 사업장 / 지사명</th>
              <th className="px-3 py-2">표준 타임존 코드</th>
              <th className="px-3 py-2 text-right">UTC 시차</th>
              <th className="px-3 py-2">서머타임 (DST)</th>
              <th className="px-3 py-2">현지 거래 기준 일시</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.regionCode}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.regionBranchName}</td>
                <td className="px-3 py-2 font-semibold text-purple-700 text-[11px]">{i.timezoneCode}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">UTC {i.utcOffsetHours >= 0 ? `+${i.utcOffsetHours}` : i.utcOffsetHours}시간</td>
                <td className="px-3 py-2 font-bold font-mono text-sub">{i.daylightSavingYn}</td>
                <td className="px-3 py-2 font-mono text-sub text-[11px]">{i.standardTransactionTime}</td>
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
