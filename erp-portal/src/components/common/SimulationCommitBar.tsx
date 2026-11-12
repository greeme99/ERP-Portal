// 프론트엔드 EntityStore 인메모리 시뮬레이션 ↔ 백엔드 SQLite DB 확정(Commit) 공통 컨트롤 바
import { useState, useEffect, useMemo } from "react";
import {
  commitSimulationPlan,
  fetchSimulationHistory,
  ConfirmedTransactionRecord,
  getBackendStatus,
} from "../../services/restBackend";
import type { Entity } from "../../services/store";

interface Props {
  module: string;
  planType: string;
  planTitle: string;
  planPeriod: string;
  stores: Record<string, Entity[]>;
  defaultComment?: string;
}

export default function SimulationCommitBar({
  module,
  planType,
  planTitle,
  planPeriod,
  stores,
  defaultComment = "시뮬레이션 검토 완료 및 공식 계획 확정",
}: Props) {
  const [history, setHistory] = useState<ConfirmedTransactionRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [comment, setComment] = useState(defaultComment);
  const [committing, setCommitting] = useState(false);
  const [lastCommittedHash, setLastCommittedHash] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const currentHash = useMemo(() => {
    try {
      return JSON.stringify(stores);
    } catch {
      return String(Date.now());
    }
  }, [stores]);

  const totalRows = useMemo(
    () => Object.values(stores).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
    [stores]
  );

  const loadHistory = async () => {
    const list = await fetchSimulationHistory(module, 15);
    const filtered = list.filter((item) => item.planType === planType);
    setHistory(filtered);
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, planType]);

  const latestCommit = history[0] ?? null;
  const isDirty = lastCommittedHash === "" || lastCommittedHash !== currentHash;

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const record = await commitSimulationPlan({
        module,
        planPeriod,
        planType,
        comment: comment.trim() || defaultComment,
        stores,
      });
      setLastCommittedHash(currentHash);
      await loadHistory();
      setModalOpen(false);
      setToastMsg(
        `✅ [${planTitle}] v${record.version} 확정 완료! (트랜잭션: ${record.id} · 총 ${record.rowCount.toLocaleString()}건 DB 영속화)`
      );
      setTimeout(() => setToastMsg(null), 6000);
    } catch (err: any) {
      alert(`확정 저장 중 오류가 발생했습니다: ${err?.message ?? err}`);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="bg-panel border border-line rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[12px]">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-bold text-main flex items-center gap-1.5">
          <span>⚡ 인메모리 시뮬레이션 & DB 확정 엔진</span>
        </span>

        {isDirty ? (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 font-semibold text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            시뮬레이션 가상 상태 (미확정 변경)
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-semibold text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            SQLite DB 확정 동기화됨 (v{latestCommit?.version ?? 1})
          </span>
        )}

        {latestCommit && (
          <span className="text-[11px] text-sub">
            최근 확정: <strong className="text-main">v{latestCommit.version}</strong> ({latestCommit.id}) ·{" "}
            {latestCommit.committedBy} · {latestCommit.committedAt.slice(0, 16).replace("T", " ")}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            loadHistory();
            setHistoryOpen(true);
          }}
          className="px-2.5 py-1 rounded border border-line bg-surface text-sub hover:text-main text-[11px] font-medium transition-colors"
        >
          📜 확정 이력 ({history.length})
        </button>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3 py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5 text-[11px]"
        >
          <span>📌 계획 확정 (DB 영속화)</span>
        </button>
      </div>

      {toastMsg && (
        <div className="w-full mt-1 px-3 py-2 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold text-[11px] flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 계획 확정 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-panel border border-line rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-main">📌 시뮬레이션 결과 DB 확정 (Commit)</h3>
                <p className="text-[11px] text-sub mt-0.5">
                  브라우저 EntityStore 인메모리에서 시뮬레이션한 데이터를 백엔드 SQLite DB에 원자적(ACID) 트랜잭션으로 확정 저장합니다.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-sub hover:text-main text-lg font-bold">
                ✕
              </button>
            </div>

            <div className="bg-surface border border-line rounded-lg p-3 space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-sub">대상 업무 / 모듈:</span>
                <span className="font-bold text-main">
                  {planTitle} ({module} · {planType})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sub">계획 구간 (Horizon):</span>
                <span className="font-semibold text-main">{planPeriod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sub">영속화 대상 레코드:</span>
                <span className="font-bold text-blue-600">
                  {Object.keys(stores).length}개 스토어 / 총 {totalRows.toLocaleString()}건
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sub">예상 신규 확정 버전:</span>
                <span className="font-bold text-emerald-600">v{(latestCommit?.version ?? 0) + 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sub">저장소 엔진 상태:</span>
                <span className="font-semibold text-main">
                  {getBackendStatus() === "rest" ? "SQLite DB (WAL Mode) 실시간 트랜잭션" : "브라우저 로컬 확정 스토리지"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-sub">확정 사유 및 코멘트 (감사로그 기록용)</label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="예: 24주 Holt AI 수요예측 및 영업 조정안 최종 확정"
                className="w-full px-3 py-2 rounded border border-line bg-surface text-main text-[12px] focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3.5 py-1.5 rounded border border-line bg-surface text-sub hover:text-main text-[12px] font-medium"
              >
                취소
              </button>
              <button
                onClick={handleCommit}
                disabled={committing}
                className="px-4 py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 text-[12px]"
              >
                {committing ? "DB 트랜잭션 커밋 중..." : "✅ 원자적 트랜잭션 확정 실행"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 확정 이력 모달 */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-panel border border-line rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-main">📜 시뮬레이션 확정 이력 ({planTitle})</h3>
                <p className="text-[11px] text-sub mt-0.5">
                  SQLite `confirmed_transactions` 테이블에 기록된 버전별 확정 스냅샷 이력입니다.
                </p>
              </div>
              <button onClick={() => setHistoryOpen(false)} className="text-sub hover:text-main text-lg font-bold">
                ✕
              </button>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-sub text-[12px]">
                아직 확정된 이력이 없습니다. 우측 상단의 [📌 계획 확정] 버튼을 눌러 첫 확정 버전을 생성하세요.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto border border-line rounded-lg">
                <table className="w-full text-[11px]">
                  <thead className="bg-surface border-b border-line text-sub text-left">
                    <tr>
                      <th className="px-3 py-2">버전</th>
                      <th className="px-3 py-2">트랜잭션 ID</th>
                      <th className="px-3 py-2">계획 구간</th>
                      <th className="px-3 py-2 text-right">확정 건수</th>
                      <th className="px-3 py-2">확정자</th>
                      <th className="px-3 py-2">확정 일시</th>
                      <th className="px-3 py-2">코멘트</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id} className="border-b border-line last:border-0 hover:bg-surface">
                        <td className="px-3 py-2 font-bold text-emerald-600">v{h.version}</td>
                        <td className="px-3 py-2 font-mono text-main">{h.id}</td>
                        <td className="px-3 py-2">{h.planPeriod}</td>
                        <td className="px-3 py-2 text-right font-semibold">{h.rowCount.toLocaleString()}건</td>
                        <td className="px-3 py-2">
                          {h.committedBy} ({h.committedRole})
                        </td>
                        <td className="px-3 py-2 text-sub">{h.committedAt.slice(0, 19).replace("T", " ")}</td>
                        <td className="px-3 py-2 text-sub truncate max-w-[180px]" title={h.comment}>
                          {h.comment}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-line">
              <button
                onClick={() => setHistoryOpen(false)}
                className="px-4 py-1.5 rounded bg-accent text-white font-bold text-[12px]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

