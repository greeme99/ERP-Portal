// 인쇄/PDF 공용 서식 렌더러.
//
// 브라우저 네이티브 인쇄를 쓴다 — 새 의존성이 없고 한글 폰트가 그대로 나오며
// 사용자가 인쇄 대화상자에서 "PDF로 저장"을 고를 수 있다.
// createPortal 로 body 직속에 붙이므로 @media print 에서 #root 만 숨기면 된다.
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { companyBranchStore } from "../../pages/com/CompanyBranchMaster";
import { useStore } from "../../services/store";

export interface PrintMeta {
  label: string;
  value: string;
}

export interface PrintColumn {
  key: string;
  label: string;
  align?: "right" | "center";
}

export interface PrintSection {
  heading: string;
  body: string;
}

export interface PrintDoc {
  title: string; // 예: 구매발주서
  docNo: string;
  issuedAt: string;
  /** 좌측 블록 (보통 수신처/거래처) */
  counterpartyLabel?: string;
  counterparty?: PrintMeta[];
  /** 문서 메타 (일자·담당·조건 등) */
  meta?: PrintMeta[];
  /** 품목 라인 표 */
  columns?: PrintColumn[];
  rows?: Record<string, string | number>[];
  /** 합계 블록 (공급가액/부가세/합계 등) */
  totals?: PrintMeta[];
  /** 서술형 문서(8D 등) */
  sections?: PrintSection[];
  note?: string;
  /** 결재란 칸 이름. 비우면 표시하지 않는다 */
  signatures?: string[];
}

interface Props {
  doc: PrintDoc | null;
  /** 인쇄 대화상자가 닫힌 뒤 호출된다 */
  onDone: () => void;
}

const cell = "border border-slate-400 px-2 py-1";

export default function PrintableDocument({ doc, onDone }: Props) {
  const companies = useStore(companyBranchStore);
  // 사업장 마스터의 운영중 첫 법인을 공급자로 쓴다 (없으면 표시를 비운다)
  const issuer = companies.find((c) => String(c.status ?? "").startsWith("운영중")) ?? companies[0];

  useEffect(() => {
    if (!doc) return;
    // 서식이 DOM 에 반영된 뒤 인쇄 대화상자를 띄운다
    const id = requestAnimationFrame(() => {
      window.print();
      onDone();
    });
    return () => cancelAnimationFrame(id);
    // onDone 은 매 렌더마다 새 함수일 수 있어 의존성에서 제외한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  if (!doc) return null;

  return createPortal(
    <div className="print-root bg-white text-black" style={{ fontFamily: "system-ui, 'Malgun Gothic', sans-serif" }}>
      <div className="text-[11px] leading-relaxed">
        {/* 표제 */}
        <h1 className="text-center text-[20px] font-bold tracking-[0.3em] mb-3">{doc.title}</h1>

        <div className="flex justify-between items-end mb-2 text-[10px]">
          <span>
            문서번호: <b className="font-mono">{doc.docNo}</b>
          </span>
          <span>발행일: {doc.issuedAt}</span>
        </div>

        {/* 공급자 / 수신처 */}
        <div className="flex gap-3 mb-3">
          {doc.counterparty && doc.counterparty.length > 0 && (
            <div className="flex-1 border border-slate-400">
              <div className="bg-slate-100 border-b border-slate-400 px-2 py-1 font-bold">
                {doc.counterpartyLabel ?? "거래처"}
              </div>
              <table className="w-full">
                <tbody>
                  {doc.counterparty.map((m) => (
                    <tr key={m.label}>
                      <th className="bg-slate-50 border-t border-slate-300 px-2 py-1 text-left w-24 font-semibold">{m.label}</th>
                      <td className="border-t border-slate-300 px-2 py-1">{m.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex-1 border border-slate-400">
            <div className="bg-slate-100 border-b border-slate-400 px-2 py-1 font-bold">공급자</div>
            <table className="w-full">
              <tbody>
                <tr>
                  <th className="bg-slate-50 px-2 py-1 text-left w-24 font-semibold">법인명</th>
                  <td className="px-2 py-1">{String(issuer?.companyName ?? "")}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 border-t border-slate-300 px-2 py-1 text-left font-semibold">사업자번호</th>
                  <td className="border-t border-slate-300 px-2 py-1 font-mono">{String(issuer?.businessRegistrationNo ?? "")}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 border-t border-slate-300 px-2 py-1 text-left font-semibold">대표자</th>
                  <td className="border-t border-slate-300 px-2 py-1">{String(issuer?.representativeName ?? "")}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 border-t border-slate-300 px-2 py-1 text-left font-semibold">소재지</th>
                  <td className="border-t border-slate-300 px-2 py-1">{String(issuer?.branchLocationAddress ?? "")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 문서 메타 — 2열로 배치한다 */}
        {doc.meta && doc.meta.length > 0 && (
          <table className="w-full border-collapse mb-3">
            <tbody>
              {Array.from({ length: Math.ceil(doc.meta.length / 2) }, (_, r) => {
                const left = doc.meta![r * 2];
                const right = doc.meta![r * 2 + 1];
                return (
                  <tr key={`meta-${r}`}>
                    <th className={`${cell} bg-slate-50 text-left w-28 font-semibold`}>{left.label}</th>
                    <td className={cell}>{left.value}</td>
                    <th className={`${cell} bg-slate-50 text-left w-28 font-semibold`}>{right?.label ?? ""}</th>
                    <td className={cell}>{right?.value ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 품목 라인 */}
        {doc.columns && doc.rows && (
          <table className="w-full border-collapse mb-3">
            <thead>
              <tr className="bg-slate-100">
                {doc.columns.map((c) => (
                  <th key={c.key} className={`${cell} font-bold ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.rows.length === 0 ? (
                <tr>
                  <td className={`${cell} text-center text-slate-500`} colSpan={doc.columns.length}>
                    표시할 품목이 없습니다.
                  </td>
                </tr>
              ) : (
                doc.rows.map((r, i) => (
                  <tr key={i}>
                    {doc.columns!.map((c) => (
                      <td key={c.key} className={`${cell} ${c.align === "right" ? "text-right font-mono" : c.align === "center" ? "text-center" : ""}`}>
                        {typeof r[c.key] === "number" ? Number(r[c.key]).toLocaleString() : String(r[c.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 합계 */}
        {doc.totals && doc.totals.length > 0 && (
          <table className="border-collapse mb-3 ml-auto" style={{ minWidth: "45%" }}>
            <tbody>
              {doc.totals.map((t, i) => (
                <tr key={t.label} className={i === doc.totals!.length - 1 ? "font-bold" : ""}>
                  <th className={`${cell} bg-slate-50 text-left w-28 font-semibold`}>{t.label}</th>
                  <td className={`${cell} text-right font-mono`}>{t.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 서술형 섹션 (8D 등) */}
        {doc.sections && doc.sections.length > 0 && (
          <div className="mb-3">
            {doc.sections.map((s) => (
              <div key={s.heading} className="print-section border border-slate-400 border-b-0 last:border-b">
                <div className="bg-slate-100 border-b border-slate-300 px-2 py-1 font-bold">{s.heading}</div>
                <div className="px-2 py-1.5 whitespace-pre-wrap min-h-[32px]">{s.body || "-"}</div>
              </div>
            ))}
          </div>
        )}

        {doc.note && <p className="mb-3 text-[10px] text-slate-700 whitespace-pre-wrap">{doc.note}</p>}

        {/* 결재란 */}
        {doc.signatures && doc.signatures.length > 0 && (
          <table className="border-collapse ml-auto mt-4">
            <thead>
              <tr>
                {doc.signatures.map((s) => (
                  <th key={s} className={`${cell} bg-slate-50 text-center w-24 font-semibold`}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {doc.signatures.map((s) => (
                  <td key={s} className={cell} style={{ height: "42px" }} />
                ))}
              </tr>
            </tbody>
          </table>
        )}

        <p className="mt-5 text-center text-[9px] text-slate-500">
          본 문서는 AX-ERP Portal 에서 발행되었습니다. (프로토타입 · 합성 데이터)
        </p>
      </div>
    </div>,
    document.body
  );
}
