// COM-008 알림센터 — 전사 실시간 시스템 알림·결재 요청·예외 경고 및 읽음 상태 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface SystemNotification {
  id: string;
  category: "결재요청" | "예외경고" | "재고위험" | "시스템통지";
  title: string;
  content: string;
  sender: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationStore = createStore("com.notification", [
  { id: "NTF-01", category: "결재요청", title: "구매요청 PR-2026-004 예산 초과 승인 요청", content: "RM-3004 3,835만원 구매요청건에 대한 경영진 전자결재가 수신되었습니다.", sender: "박구매 대리", isRead: false, createdAt: "2026-08-06 09:30" },
  { id: "NTF-02", category: "재고위험", title: "RM-3004 자재 재주문점 미달 (안전재고 부족)", content: "현재고 1,900개 (안전재고 2,500개 미달). MRP 전개 및 즉시 발주가 필요합니다.", sender: "SCM Control Tower", isRead: false, createdAt: "2026-08-06 08:45" },
  { id: "NTF-03", category: "예외경고", title: "SO-26078 미출하 수주 ATP 마이너스 경고", content: "FG-1001 미출하 수주 잔고로 인해 신규 수주 가능 재고(ATP)가 마이너스 상태입니다.", sender: "영업모니터링", isRead: true, createdAt: "2026-08-05 17:20" },
  { id: "NTF-04", category: "시스템통지", title: "2026년 7월 회계 월마감(Closing) 완료 통지", content: "2026-07 회계 마감 6단계 프로세스가 정상 완료되어 장부가 잠금되었습니다.", sender: "재무팀", isRead: true, createdAt: "2026-08-01 11:30" },
]);

export default function NotificationCenter() {
  const notifications = useStore(notificationStore) as SystemNotification[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = notifications.filter((n) => catFilter === "전체" || n.category === catFilter);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    notifications.forEach((n) => {
      if (!n.isRead) notificationStore.update(n.id, { isRead: true });
    });
  };

  const excel = () =>
    downloadCsv(
      "시스템_알림센터_대장.csv",
      ["알림ID", "카테고리", "제목", "내용", "발송자", "읽음여부", "발생일시"],
      filtered.map((n) => [
        n.id,
        n.category,
        n.title,
        n.content,
        n.sender,
        n.isRead ? "읽음" : "안읽음",
        n.createdAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">13. Common / Platform (공통)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">알림센터 (COM-008)</h1>
          <span className="text-[11px] text-sub">전사 실시간 시스템 알림 · 전자결재 요청 · 리스크 예외 경고 수신함</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">안 읽은 알림</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{unreadCount} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">총 알림 통지 건수</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{notifications.length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] text-sub">알림 마감 처리</div>
            <div className="text-xs text-sub mt-1">모든 읽지 않은 알림 일괄 읽음 상태 변경</div>
          </div>
          <button onClick={markAllRead} className="px-3 py-1.5 rounded bg-accent text-white font-bold text-[11px] hover:bg-accent-dark">
            ✓ 모두 읽음
          </button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">카테고리:</span>
          {["전체", "결재요청", "예외경고", "재고위험", "시스템통지"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                catFilter === cat
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 알림대장 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">카테고리</th>
              <th className="px-3 py-2">알림 제목 / 상세 내용</th>
              <th className="px-3 py-2">발송자</th>
              <th className="px-3 py-2">읽음 상태</th>
              <th className="px-3 py-2">발생 일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n) => (
              <tr key={n.id} className={`border-b border-line last:border-0 hover:bg-accent-soft ${!n.isRead ? "bg-amber-50/40" : ""}`}>
                <td className="px-3 py-2 font-bold">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    n.category === "결재요청" ? "bg-blue-100 text-blue-700" :
                    n.category === "재고위험" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                  }`}>
                    {n.category}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="font-semibold text-ink">{n.title}</div>
                  <div className="text-[11px] text-sub mt-0.5">{n.content}</div>
                </td>
                <td className="px-3 py-2 text-sub font-medium">{n.sender}</td>
                <td className="px-3 py-2">
                  {n.isRead ? (
                    <span className="text-sub text-[11px]">읽음</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">NEW</span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-sub">{n.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
