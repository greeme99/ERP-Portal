// SV-008 필드서비스 AI기술지원 (Field Service AI Technical Support) — 현장 엔지니어 전용 AI 고장 진단 및 수리 가이드
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface AiSupportItem {
  id: string;
  ticketNo: string;
  modelName: string; // 대상 가전 모델 (예: 무선청소기 V11 PRO, UV 살균 공기청정기)
  faultSymptom: string; // 현장 고장 증상 키워드
  aiDiagnosedCause: string; // AI 진단 가설 원인
  recommendedPart: string; // 추천 교체 부품 코드/명
  repairDifficulty: "쉬움 (10분)" | "보통 (30분)" | "고난도 (60분 이상)";
  aiConfidencePct: number; // AI 진단 신뢰도 (%)
}

export const fieldAiStore = createStore("sv.field_ai", [
  { id: "FAI-01", ticketNo: "AS-2026-0801", modelName: "프리미엄 무선청소기 V11", faultSymptom: "흡입 모터 작동 후 5초 뒤 자동 정지 및 빨간색 LED 점등", aiDiagnosedCause: "메인 싸이클론 분진 필터 막힘 및 BLDC 모터 과열 보호 서미스터 작동", recommendedPart: "PART-FLT-102 (싸이클론 H13 헤파필터)", repairDifficulty: "쉬움 (10분)", aiConfidencePct: 96.5 },
  { id: "FAI-02", ticketNo: "AS-2026-0802", modelName: "로봇청소기 AI-V12", faultSymptom: "좌측 바퀴 회전 불량 및 휠 모터 과전류 에러 C-04", aiDiagnosedCause: "좌측 구동 기어박스 이물질 끼임 및 감속기어 마모", recommendedPart: "PART-GEAR-005 (구동 휠 모터 어셈블리)", repairDifficulty: "보통 (30분)", aiConfidencePct: 92.0 },
]);

export default function FieldServiceAiSupport() {
  const items = useStore(fieldAiStore) as AiSupportItem[];
  const [modelFilter, setModelFilter] = useState("전체");

  const filtered = items.filter((i) => modelFilter === "전체" || i.modelName.includes(modelFilter));

  const excel = () =>
    downloadCsv(
      "서비스_필드서비스_AI진단_가이드_대장.csv",
      ["접수번호", "모델명", "고장증상", "AI진단원인", "추천교체부품", "수리난이도", "AI신뢰도(%)"],
      filtered.map((i) => [
        i.ticketNo,
        i.modelName,
        i.faultSymptom,
        i.aiDiagnosedCause,
        i.recommendedPart,
        i.repairDifficulty,
        `${i.aiConfidencePct}%`,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">10. Customer Service (고객서비스)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">필드서비스 AI기술지원 (SV-008)</h1>
          <span className="text-[11px] text-sub">AS 현장 서비스 엔지니어 모바일 AI 고장 수리 진단 및 부품 자동 추천 매뉴얼</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">AI 고장 진단 평균 정확도</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">94.3%</div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">현장 평균 수리 소요시간 단축</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">15 <span className="text-xs font-normal text-ink">분 단축</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">재방문 수리율 감소</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">-4.5%</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">모델:</span>
          {["전체", "무선청소기", "로봇청소기"].map((m) => (
            <button
              key={m}
              onClick={() => setModelFilter(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                modelFilter === m
                  ? "bg-accent text-white font-bold"
                  : "bg-surface border border-line text-ink hover:bg-accent-soft"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">
          📥 AI기술지원 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">접수 번호</th>
              <th className="px-3 py-2">대상 모델명</th>
              <th className="px-3 py-2">현장 증상 키워드</th>
              <th className="px-3 py-2">AI 추정 고장 원인</th>
              <th className="px-3 py-2">추천 교체 부품</th>
              <th className="px-3 py-2">수리 난이도</th>
              <th className="px-3 py-2 text-right">AI 신뢰도</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{i.ticketNo}</td>
                <td className="px-3 py-2 font-medium text-ink">{i.modelName}</td>
                <td className="px-3 py-2 text-red-500 font-semibold text-[11px]">{i.faultSymptom}</td>
                <td className="px-3 py-2 font-medium text-emerald-600 text-[11px]">{i.aiDiagnosedCause}</td>
                <td className="px-3 py-2 font-mono text-purple-600 font-bold text-[11px]">{i.recommendedPart}</td>
                <td className="px-3 py-2 text-sub font-medium">{i.repairDifficulty}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{i.aiConfidencePct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
