// PP-005 공정/라우팅 (Routing & Work Center Master) — 제품 품목별 생산 공정 순서(Op Step)·작업장·표준 공수(Setup/Run time) 관리
import { useState } from "react";
import { useStore, createStore, nextId } from "../../services/store";
import MassUpdateBar, { MassColumn } from "../../components/common/MassUpdateBar";

export interface RoutingStepItem {
  id: string;
  materialCode: string;
  materialName: string;
  opSeq: number; // 공정 순서 (10, 20, 30, ...)
  opName: string; // 공정명 (예: SMT 부품실장, 메인 수조립)
  workCenterCode: string; // 작업장 코드 (예: WC-SMT-01, WC-ASSY-02)
  workCenterName: string;
  setupTimeMin: number; // 셋업 시간 (분)
  runTimeMinPerPc: number; // 개당 생산 타량 시간 (분/개)
  stdYieldPct: number; // 표준 수율 (%)
  status: "사용중" | "개정중";
}

export const routingMasterStore = createStore("pp.routing_master", [
  { id: "RUT-01", materialCode: "FG-1001", materialName: "소형가전 무선청소기", opSeq: 10, opName: "ABS 프레스 외관 사출", workCenterCode: "WC-PRESS-01", workCenterName: "1번 사출 프레스 작업장", setupTimeMin: 30, runTimeMinPerPc: 0.8, stdYieldPct: 99.5, status: "사용중" },
  { id: "RUT-02", materialCode: "FG-1001", materialName: "소형가전 무선청소기", opSeq: 20, opName: "SMT 회로기판 자재 실장", workCenterCode: "WC-SMT-01", workCenterName: "자동 SMT 라인 1호기", setupTimeMin: 45, runTimeMinPerPc: 1.2, stdYieldPct: 99.8, status: "사용중" },
  { id: "RUT-03", materialCode: "FG-1001", materialName: "소형가전 무선청소기", opSeq: 30, opName: "모터/하우징 최종 수조립", workCenterCode: "WC-ASSY-01", workCenterName: "메인 조립 A라인", setupTimeMin: 15, runTimeMinPerPc: 3.5, stdYieldPct: 98.0, status: "사용중" },
  { id: "RUT-04", materialCode: "FG-1002", materialName: "스마트 로봇청소기", opSeq: 10, opName: "센서 모듈 정밀 테스트", workCenterCode: "WC-TEST-01", workCenterName: "품질 에이징 테스트실", setupTimeMin: 20, runTimeMinPerPc: 2.0, stdYieldPct: 99.0, status: "사용중" },
]);

export default function RoutingMaster() {
  const routings = useStore(routingMasterStore) as RoutingStepItem[];
  const [matFilter, setMatFilter] = useState("전체");

  const filtered = routings.filter((r) => matFilter === "전체" || r.materialCode === matFilter);

  // 기준정보 일괄 다운로드/업로드 컬럼
  const massColumns: MassColumn[] = [
    { key: "materialCode", label: "품목코드", required: true },
    { key: "materialName", label: "품목명" },
    { key: "opSeq", label: "공정순서", type: "number", required: true },
    { key: "opName", label: "공정명", required: true },
    { key: "workCenterCode", label: "작업장코드" },
    { key: "workCenterName", label: "작업장명" },
    { key: "setupTimeMin", label: "셋업시간(분)", type: "number" },
    { key: "runTimeMinPerPc", label: "개당생산시간(분)", type: "number" },
    { key: "stdYieldPct", label: "표준수율(%)", type: "number" },
    { key: "status", label: "상태", type: "select", options: ["사용중", "개정중"] },
  ];

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. Production Planning (생산관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공정/라우팅 (PP-005)</h1>
          <span className="text-[11px] text-sub">생산 품목별 공정 순서(Routing Op Step) · 작업장 할당 · 표준 타량 공수(Tact Time)</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 등록 라우팅 공정 단계</div>
          <div className="text-xl font-bold mt-1 font-mono">{routings.length} <span className="text-xs font-normal">단계</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">평균 공정 표준 수율</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {(routings.reduce((acc, r) => acc + r.stdYieldPct, 0) / (routings.length || 1)).toFixed(1)}%
          </div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">등록 제품 수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
            {new Set(routings.map((r) => r.materialCode)).size} <span className="text-xs font-normal text-ink">종</span>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">품목:</span>
          {["전체", "FG-1001", "FG-1002"].map((m) => (
            <button
              key={m}
              onClick={() => setMatFilter(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                matFilter === m
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <MassUpdateBar
            title="라우팅 마스터"
            filename="생산_라우팅_공정마스터_대장.csv"
            store={routingMasterStore}
            rows={filtered}
            columns={massColumns}
            newRow={() => ({ id: nextId("RT"), materialCode: "", materialName: "", opSeq: 10, opName: "", workCenterCode: "", workCenterName: "", setupTimeMin: 0, runTimeMinPerPc: 0, stdYieldPct: 100, status: "사용중" })}
            keyOf={(r) => `${r.materialCode}|${r.opSeq}`}
            keyLabel="품목코드+공정순서"
          />
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">품목코드 / 명</th>
              <th className="px-3 py-2 text-center">공정 순서</th>
              <th className="px-3 py-2">공정명</th>
              <th className="px-3 py-2">작업장 코드 / 명</th>
              <th className="px-3 py-2 text-right">셋업시간</th>
              <th className="px-3 py-2 text-right">개당 생산시간</th>
              <th className="px-3 py-2 text-right">표준 수율</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{r.materialCode} — {r.materialName}</td>
                <td className="px-3 py-2 text-center font-mono font-bold text-blue-600">Op {r.opSeq}</td>
                <td className="px-3 py-2 font-semibold text-ink">{r.opName}</td>
                <td className="px-3 py-2 text-sub">{r.workCenterCode} ({r.workCenterName})</td>
                <td className="px-3 py-2 text-right font-mono text-sub">{r.setupTimeMin}분</td>
                <td className="px-3 py-2 text-right font-mono font-medium">{r.runTimeMinPerPc}분/개</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{r.stdYieldPct.toFixed(1)}%</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {r.status}
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
