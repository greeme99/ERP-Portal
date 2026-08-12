// QM-009 8D Report — 부적합 문제해결 8D 기법(원인분석·시정조치·재발방지) 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";
import PrintableDocument, { PrintDoc } from "../../components/print/PrintableDocument";

export interface EightDItem {
  id: string;
  reportNo: string;
  title: string; // 문제 정의 (D2)
  customerName: string;
  materialCode: string;
  materialName: string;
  teamMembers: string; // 팀 구성 (D1) — 주관 부서와 참여자
  containment: string; // 임시 조치 (D3) — 확산 방지
  rootCause: string; // 근본 원인 (D4)
  correctiveAction: string; // 시정 조치 (D5)
  preventiveAction: string; // 재발 방지책 (D6)
  standardization: string; // 표준화 (D7) — 개정 문서
  closureNote: string; // 종결 (D8) — 효과 검증 결과
  status: "D1_팀구성" | "D4_원인분석" | "D6_방지책수립" | "D8_완료";
  createdAt: string;
}

// 저장 키에 v2 를 붙였다. D1·D3·D7·D8 필드를 추가했으므로 이전 키로 저장된
// 데이터를 복원하면 해당 항목이 빈 값으로 보인다. 이 화면은 조회 전용이라
// 사용자가 입력한 데이터가 없어 새 seed 로 시작하는 것이 안전하다.
export const eightDStore = createStore("qm.eight_d.v2", [
  { id: "8D-01", reportNo: "8D-2026-001", title: "소형가전 청소기 모터 동작 소음 과다 8D 리포트", customerName: "삼성전자", materialCode: "FG-1001", materialName: "소형가전 무선청소기", teamMembers: "품질보증본부 주관 · 참여: 생산기술팀 이생산, 구매 박구매, 공급사 Shenzhen Motor 품질담당", containment: "해당 LOT(L-26071) 출하 보류 · 기출하 1,200대 고객 재고 전수 선별 · 대체품 우선 공급", rootCause: "모터 베어링 유격 공차 불량", correctiveAction: "베어링 전수 조립 치수 재정렬", preventiveAction: "공급사 모터 베어링 수입검사 항목 추가 (STD-RM-004)", standardization: "검사기준서 STD-RM-004 개정(Rev.2) · 수입검사 관리계획서에 베어링 유격 항목 반영", closureNote: "시정 후 3개월 소음 불량 0건 · Cpk 1.52 확보로 효과 검증 완료, 팀 포상 후 종결", status: "D8_완료", createdAt: "2026-07-15" },
  { id: "8D-02", reportNo: "8D-2026-002", title: "로봇청소기 PCB 모듈 SMT 미납 발생 건", customerName: "LG전자", materialCode: "SF-2001", materialName: "메인 제어 PCB 모듈", teamMembers: "품질보증본부 주관 · 참여: SMT공정팀 최공정, 설비보전팀 정보전", containment: "해당 생산분 전수 X-ray 검사 · 노즐 즉시 교체 후 초물 재확인", rootCause: "SMT 크림반도 납도포 패턴 노즐 막힘", correctiveAction: "노즐 자동 세척 주기 변경(2시간→30분)", preventiveAction: "노즐 압력 자동 센서 스펙 모니터링 구축", standardization: "SMT 작업표준서 WI-SMT-007 개정 · 노즐 세척 주기 30분으로 설비 점검표 반영", closureNote: "효과 검증 진행 중 — 2주 추가 모니터링 후 종결 예정", status: "D6_방지책수립", createdAt: "2026-07-28" },
  { id: "8D-03", reportNo: "8D-2026-003", title: "공기청정기 하우징 스크래치 외관 부적합", customerName: "쿠쿠전자", materialCode: "FG-2002", materialName: "스마트 공기청정기", teamMembers: "품질보증본부 주관 · 참여: 사출공정팀 조사출, 물류팀 한물류", containment: "스크래치 발생 트레이 사용 중지 · 완제품 창고 재고 외관 재검사", rootCause: "사출 금형 이형제 과다 사용 및 운반 트레이 마찰", correctiveAction: "트레이 완충재 교체 및 이형제 살포 비율 자동화", preventiveAction: "사출 공정 표면 스크래치 자동 검사 로봇 도입", standardization: "(D7 미착수) 원인 분석 확정 후 사출 작업표준서 개정 예정", closureNote: "(D8 미착수)", status: "D4_원인분석", createdAt: "2026-08-03" },
]);

export default function EightDReport() {
  const reports = useStore(eightDStore) as EightDItem[];
  const [printDoc, setPrintDoc] = useState<PrintDoc | null>(null);
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = reports.filter((r) => statusFilter === "전체" || r.status === statusFilter);

  // 8D 리포트 서식 — D1~D8 단계를 서술형 섹션으로 출력한다
  const buildEightDDoc = (r: EightDItem): PrintDoc => ({
    title: "8D 품질문제 해결 보고서",
    docNo: r.reportNo,
    issuedAt: r.createdAt,
    counterpartyLabel: "고객 / 대상 품목",
    counterparty: [
      { label: "고객명", value: r.customerName },
      { label: "품목코드", value: r.materialCode },
      { label: "품목명", value: r.materialName },
    ],
    meta: [
      { label: "리포트번호", value: r.reportNo },
      { label: "작성일", value: r.createdAt },
      { label: "진행단계", value: r.status.replace("_", " ") },
      { label: "완료여부", value: r.status === "D8_완료" ? "완료" : "진행중" },
    ],
    sections: [
      { heading: "D1. 팀 구성 (Team)", body: r.teamMembers },
      { heading: "D2. 문제 정의 (Problem Description)", body: r.title },
      { heading: "D3. 임시 조치 (Interim Containment)", body: r.containment },
      { heading: "D4. 근본 원인 (Root Cause)", body: r.rootCause },
      { heading: "D5. 시정 조치 (Corrective Action)", body: r.correctiveAction },
      { heading: "D6. 재발 방지책 (Preventive Action)", body: r.preventiveAction },
      { heading: "D7. 표준화 (Standardization)", body: r.standardization },
      { heading: "D8. 종결 및 팀 인정 (Closure)", body: r.closureNote },
    ],
    signatures: ["작성", "품질책임", "승인"],
  });

  const excel = () =>
    downloadCsv(
      "품질_8D_Report_대장.csv",
      [
        "리포트번호", "고객사", "품목코드", "품목명",
        "팀구성(D1)", "문제정의(D2)", "임시조치(D3)", "근본원인(D4)",
        "시정조치(D5)", "재발방지책(D6)", "표준화(D7)", "종결(D8)",
        "진행단계", "작성일자",
      ],
      filtered.map((r) => [
        r.reportNo,
        r.customerName,
        r.materialCode,
        r.materialName,
        r.teamMembers,
        r.title,
        r.containment,
        r.rootCause,
        r.correctiveAction,
        r.preventiveAction,
        r.standardization,
        r.closureNote,
        r.status,
        r.createdAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. Quality Management (품질관리)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">8D Report (QM-009)</h1>
          <span className="text-[11px] text-sub">8D 문제해결 기법 · 근본 원인 분석(D4) · 시정 조치(D5) 및 재발 방지책(D6)</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 8D 이슈 발행 건수</div>
          <div className="text-xl font-bold mt-1 font-mono">{reports.length} <span className="text-xs font-normal">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">8D 완료 (D8) 건수</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{reports.filter((r) => r.status === "D8_완료").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-amber-500">
          <div className="text-[11px] text-sub">조치 진행중 건수</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{reports.filter((r) => r.status !== "D8_완료").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">단계:</span>
          {["전체", "D4_원인분석", "D6_방지책수립", "D8_완료"].map((st) => (
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
          📥 8D Report Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">리포트 번호</th>
              <th className="px-3 py-2">이슈 제목</th>
              <th className="px-3 py-2">고객사 / 품목명</th>
              <th className="px-3 py-2">근본 원인 (D4)</th>
              <th className="px-3 py-2">시정 조치 (D5)</th>
              <th className="px-3 py-2">재발 방지책 (D6)</th>
              <th className="px-3 py-2">진행 단계</th>
              <th className="px-3 py-2">작성일자</th>
              <th className="px-3 py-2">서식</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{r.reportNo}</td>
                <td className="px-3 py-2 font-medium">{r.title}</td>
                <td className="px-3 py-2 text-sub">{r.customerName} ({r.materialName})</td>
                <td className="px-3 py-2 text-amber-600 font-medium text-[11px]">{r.rootCause}</td>
                <td className="px-3 py-2 text-sub text-[11px]">{r.correctiveAction}</td>
                <td className="px-3 py-2 text-emerald-600 font-medium text-[11px]">{r.preventiveAction}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.status === "D8_완료" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{r.createdAt}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setPrintDoc(buildEightDDoc(r))}
                    title="8D 리포트를 인쇄합니다. 인쇄 대화상자에서 PDF로 저장할 수 있습니다."
                    className="px-2 py-0.5 rounded border border-line text-[10px] font-semibold hover:bg-accent-soft"
                  >
                    🖨 8D
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PrintableDocument doc={printDoc} onDone={() => setPrintDoc(null)} />
    </div>
  );
}
