// PLM-006 기술문서관리 (Tech Document Management) — 회로도·도면·시험성적서·인증서 Revision 및 보안등급 관리
import { useState } from "react";
import { useStore, downloadCsv, createStore } from "../../services/store";

export interface TechDocumentItem {
  id: string;
  docCode: string;
  docName: string;
  category: "회로도" | "기구도면" | "시험성적서" | "안전인증서";
  revision: string; // Revision 버젼 (예: v1.0, v2.1)
  targetProduct: string;
  securityLevel: "전사공개" | "대외비(Confidential)" | "극비(Top Secret)";
  author: string;
  status: "승인완료" | "검토중";
  updatedAt: string;
}

export const techDocumentStore = createStore("plm.tech_document", [
  { id: "DOC-01", docCode: "DOC-SCH-1001", docName: "무선청소기 메인 PCB 회로 설계도", category: "회로도", revision: "v2.0", targetProduct: "FG-1001 무선청소기", securityLevel: "대외비(Confidential)", author: "김연구 수석", status: "승인완료", updatedAt: "2026-07-28" },
  { id: "DOC-02", docCode: "DOC-CAD-2001", docName: "로봇청소기 메인 사출 하우징 3D CAD 도면", category: "기구도면", revision: "v1.2", targetProduct: "FG-1002 로봇청소기", securityLevel: "극비(Top Secret)", author: "박설계 책임", status: "승인완료", updatedAt: "2026-08-02" },
  { id: "DOC-03", docCode: "DOC-TST-3001", docName: "Li-Ion 배터리 모듈 안전성 EMC 시험성적서", category: "시험성적서", revision: "v1.0", targetProduct: "RM-3004 / FG-1001", securityLevel: "전사공개", author: "최인증 선임", status: "승인완료", updatedAt: "2026-08-03" },
]);

export default function TechDocumentManagement() {
  const docs = useStore(techDocumentStore) as TechDocumentItem[];
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = docs.filter((d) => catFilter === "전체" || d.category === catFilter);

  const excel = () =>
    downloadCsv(
      "연구개발_기술문서_관리대장.csv",
      ["문서코드", "문서명", "카테고리", "리비전", "대상품목", "보안등급", "작성자", "상태", "최종수정일"],
      filtered.map((d) => [
        d.docCode,
        d.docName,
        d.category,
        d.revision,
        d.targetProduct,
        d.securityLevel,
        d.author,
        d.status,
        d.updatedAt,
      ])
    );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">07. Engineering Management (연구개발)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">기술문서관리 (PLM-006)</h1>
          <span className="text-[11px] text-sub">회로도 · CAD 도면 · KC/EMC 시험성적서 Revision 버전 및 보안등급 중앙 관리</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-line p-3 rounded-lg">
          <div className="text-[11px] text-sub">총 등록 중앙 기술문서</div>
          <div className="text-xl font-bold mt-1 font-mono">{docs.length} <span className="text-xs font-normal">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-red-500">
          <div className="text-[11px] text-sub">대외비 / 극비 보안문서</div>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{docs.filter((d) => d.securityLevel !== "전사공개").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
        <div className="bg-panel border border-line p-3 rounded-lg border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-sub">승인 완료 문서</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{docs.filter((d) => d.status === "승인완료").length} <span className="text-xs font-normal text-ink">건</span></div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-sub">카테고리:</span>
          {["전체", "회로도", "기구도면", "시험성적서"].map((cat) => (
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
          📥 기술문서 Excel
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left bg-surface">
              <th className="px-3 py-2">문서 코드 / 명</th>
              <th className="px-3 py-2">카테고리</th>
              <th className="px-3 py-2">Revision</th>
              <th className="px-3 py-2">대상 품목</th>
              <th className="px-3 py-2">보안 등급</th>
              <th className="px-3 py-2">작성자</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">최종 수정일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-medium">{d.docCode} — {d.docName}</td>
                <td className="px-3 py-2 text-sub font-medium">{d.category}</td>
                <td className="px-3 py-2 font-mono font-bold text-blue-600">{d.revision}</td>
                <td className="px-3 py-2 text-sub">{d.targetProduct}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    d.securityLevel.includes("극비") ? "bg-red-100 text-red-700 border border-red-200" :
                    d.securityLevel.includes("대외비") ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {d.securityLevel}
                  </span>
                </td>
                <td className="px-3 py-2 text-sub">{d.author}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {d.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sub">{d.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
