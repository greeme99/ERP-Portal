// SV-007 고객만족도 (Customer Satisfaction Survey) — A/S 및 서비스 완료 고객 대상 CSAT/NPS 평점 및 VOC 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface CsatSurveyItem {
  id: string;
  surveyCode: string;
  customerName: string;
  repairOrderNo: string; // 서비스/수리 접수번호
  productName: string;
  csatScore: number; // CSAT 평점 (1.0 ~ 5.0)
  npsScore: number; // NPS 점수 (0 ~ 10)
  serviceCategory: "방문수리" | "택배수리" | "원격진단";
  vocComment: string; // 고객 평가 의견
  status: "매우만족" | "만족" | "개선필요";
  surveyDate: string;
}

export const csatSurveyStore = createStore("sv.csat_survey", [
  { id: "CSAT-01", surveyCode: "VOC-2026-081", customerName: "삼성전자 경기센터", repairOrderNo: "RE-2026-003", productName: "소형가전 무선청소기 FG-1001", csatScore: 4.9, npsScore: 10, serviceCategory: "방문수리", vocComment: "기사님이 정해진 약속시간에 정확히 방문하고 모터 부속품 수리를 깔끔하게 처리해주셨습니다.", status: "매우만족", surveyDate: "2026-08-05" },
  { id: "CSAT-02", surveyCode: "VOC-2026-082", customerName: "쿠쿠전자 인천공장", repairOrderNo: "RE-2026-004", productName: "전자기판 모듈 SF-2001", csatScore: 4.5, npsScore: 9, serviceCategory: "택배수리", vocComment: "택배 수리 입고 후 2일 만에 수리 완료 및 재배송되어 만족스럽습니다.", status: "만족", surveyDate: "2026-08-04" },
  { id: "CSAT-03", surveyCode: "VOC-2026-083", customerName: "한일전기 창원지점", repairOrderNo: "RE-2026-005", productName: "로봇청소기 FG-1002", csatScore: 3.2, npsScore: 6, serviceCategory: "방문수리", vocComment: "센서 교체 자재가 재고 부족으로 하루 지연되어 다소 아쉬웠습니다.", status: "개선필요", surveyDate: "2026-08-02" },
]);

export default function CustomerSatisfaction() {
  const surveys = useStore(csatSurveyStore) as CsatSurveyItem[];
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = surveys.filter((s) => statusFilter === "전체" || s.status === statusFilter);

  const avgCsat = (surveys.reduce((acc, s) => acc + s.csatScore, 0) / (surveys.length || 1)).toFixed(2);
  const avgNps = (surveys.reduce((acc, s) => acc + s.npsScore, 0) / (surveys.length || 1)).toFixed(1);

  const excel = () =>
    downloadCsv(
      "서비스_고객만족도_조사대장.csv",
      ["설문코드", "고객사명", "수리접수번호", "제품명", "CSAT평점(5.0)", "NPS점수(10)", "서비스구분", "VOC의견", "상태", "조사일자"],
      filtered.map((s) => [
        s.surveyCode,
        s.customerName,
        s.repairOrderNo,
        s.productName,
        s.csatScore,
        s.npsScore,
        s.serviceCategory,
        s.vocComment,
        s.status,
        s.surveyDate,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">11. Service Management (서비스/AS)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">고객만족도 (SV-007)</h1>
          <span className="text-[11px] text-sub">A/S 처리 고객 CSAT 평점(5점 만점) · NPS 지수 분석 및 VOC 개선 피드백</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">평균 CSAT 만족도 평점</div>
          <div className="text-xl font-bold mt-1 font-mono text-emerald-600">{avgCsat} <span className="text-xs font-normal text-ink">/ 5.0</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-blue-500">
          <div className="text-[11px] text-sub">평균 NPS 순고객추천지수</div>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">{avgNps} <span className="text-xs font-normal text-ink">/ 10</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-purple-500">
          <div className="text-[11px] text-sub">매우만족 / 만족 고객 비율</div>
          <div className="text-xl font-bold text-purple-600 mt-1 font-mono">
            {(((surveys.filter((s) => s.status !== "개선필요").length) / (surveys.length || 1)) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">상태:</span>
          {["전체", "매우만족", "만족", "개선필요"].map((st) => (
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
          📥 만족도 조사 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">설문 코드</th>
              <th className="px-3 py-2">고객사 / 제품명</th>
              <th className="px-3 py-2">서비스 구분</th>
              <th className="px-3 py-2 text-right">CSAT 평점</th>
              <th className="px-3 py-2 text-right">NPS 점수</th>
              <th className="px-3 py-2">고객 평가 VOC</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">조사 일자</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono font-medium">{s.surveyCode}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{s.customerName}</div>
                  <div className="text-[11px] text-sub">{s.productName} ({s.repairOrderNo})</div>
                </td>
                <td className="px-3 py-2 text-sub font-medium">{s.serviceCategory}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">{s.csatScore.toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">{s.npsScore}점</td>
                <td className="px-3 py-2 text-ink text-[11px] font-medium max-w-xs truncate">{s.vocComment}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.status === "매우만족" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    s.status === "만족" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{s.surveyDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
