// 기준정보 일괄 유지보수 공통 바 — 조건 필터가 적용된 다운로드 + 같은 양식 재업로드(Upsert)
import { useRef, useState } from "react";
import { Entity, EntityStore, downloadCsv, readCsvFile } from "../../services/store";
import { useModuleAuthz } from "../../services/authz";

export interface MassColumn {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "date";
  options?: string[];
  required?: boolean;
}

interface Props {
  title: string; // 모달 제목 및 기본 파일명
  store: EntityStore;
  rows: Entity[]; // 화면 필터가 적용된 행 — 다운로드 대상
  columns: MassColumn[];
  newRow: () => Entity; // 신규 등록 시 기본값
  keyKey?: string; // 매칭 키 (기본: 첫 번째 컬럼)
  keyOf?: (row: Entity) => string; // 복합키 화면용 (예: BOM 은 모품목+자품목)
  keyLabel?: string; // keyOf 사용 시 오류 메시지에 쓸 이름
  filename?: string;
  // 컬럼 단위로 판정할 수 없는 규칙(다른 마스터와의 정합 등)을 검사한다.
  // 오류 메시지를 반환하면 해당 행은 반영하지 않는다.
  validateRow?: (row: Entity) => string | null;
}

interface UploadPlan {
  updates: { row: Entity; patch: Entity; changed: string[] }[];
  creates: Entity[];
  errors: string[];
  ignoredColumns: string[];
}

export default function MassUpdateBar({ title, store, rows, columns, newRow, keyKey, keyOf, keyLabel, filename, validateRow }: Props) {
  const authz = useModuleAuthz();
  const [plan, setPlan] = useState<UploadPlan | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const key = keyKey ?? columns[0].key;
  const label = keyLabel ?? columns.find((c) => c.key === key)?.label ?? key;
  const identify = keyOf ?? ((row: Entity) => String(row[key] ?? "").trim());

  const download = () =>
    downloadCsv(
      filename ?? `${title}.csv`,
      columns.map((c) => c.label),
      rows.map((r) => columns.map((c) => r[c.key] ?? ""))
    );

  // 업로드 파일을 검토해 신규/변경/오류로 분류한다 (이 단계에서는 store 를 건드리지 않는다)
  const buildPlan = (table: string[][]): UploadPlan => {
    const result: UploadPlan = { updates: [], creates: [], errors: [], ignoredColumns: [] };
    const header = table[0] ?? [];
    const cols = header.map((h) => columns.find((c) => c.label === h.trim()) ?? null);
    header.forEach((h, i) => { if (!cols[i]) result.ignoredColumns.push(h.trim() || `(${i + 1}번째 열)`); });

    if (!keyOf && !cols.some((c) => c?.key === key)) {
      result.errors.push(`매칭 키 컬럼 "${label}"이 없습니다. 먼저 기준정보를 다운로드해 헤더를 유지한 채 수정하세요.`);
      return result;
    }
    if (table.length < 2) {
      result.errors.push("헤더만 있고 데이터 행이 없습니다.");
      return result;
    }

    const all = store.getAll();
    const seen = new Set<string>();

    for (let i = 1; i < table.length; i++) {
      const cells = table[i];
      const line = i + 1;
      const patch: Entity = {} as Entity;
      let rowError = false;

      cols.forEach((c, idx) => {
        if (!c) return;
        const raw = (cells[idx] ?? "").trim();
        if (c.type === "number") {
          if (raw === "") { patch[c.key] = 0; return; }
          const n = Number(raw.replace(/,/g, ""));
          if (Number.isNaN(n)) { result.errors.push(`${line}행 "${c.label}": 숫자가 아닙니다 (${raw})`); rowError = true; return; }
          patch[c.key] = n;
        } else if (c.type === "select" && raw !== "" && c.options && !c.options.includes(raw)) {
          result.errors.push(`${line}행 "${c.label}": 허용값이 아닙니다 (${raw}) — ${c.options.join("/")}`);
          rowError = true;
        } else {
          patch[c.key] = raw;
        }
      });
      if (rowError) continue;

      const keyValue = identify(patch);
      if (!keyValue) { result.errors.push(`${line}행: ${label}이(가) 비어 있습니다.`); continue; }
      if (seen.has(keyValue)) { result.errors.push(`${line}행: ${label} "${keyValue}"이(가) 파일 안에서 중복됩니다.`); continue; }
      seen.add(keyValue);

      const missing = columns.filter((c) => c.required && cols.includes(c) && !String(patch[c.key] ?? "").trim());
      if (missing.length > 0) {
        result.errors.push(`${line}행: 필수값 누락 — ${missing.map((c) => c.label).join(", ")}`);
        continue;
      }

      const ruleError = validateRow?.(patch);
      if (ruleError) { result.errors.push(`${line}행: ${ruleError}`); continue; }

      const existing = all.find((r) => identify(r) === keyValue);
      if (existing) {
        const changed = Object.keys(patch).filter((k) => String(existing[k] ?? "") !== String(patch[k] ?? ""));
        if (changed.length > 0) result.updates.push({ row: existing, patch, changed });
      } else {
        const missingOnCreate = columns.filter((c) => c.required && !String(patch[c.key] ?? "").trim());
        if (missingOnCreate.length > 0) {
          result.errors.push(`${line}행: 신규 등록 필수값 누락 — ${missingOnCreate.map((c) => c.label).join(", ")}`);
          continue;
        }
        result.creates.push({ ...newRow(), ...patch });
      }
    }
    return result;
  };

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    try {
      setPlan(buildPlan(await readCsvFile(file)));
    } catch (err) {
      alert(`업로드 실패: ${err instanceof Error ? err.message : "파일 형식을 확인하세요."}`);
    }
  };

  // 검토한 변경을 한 번에 반영한다. store.replaceAll 이라 REST 모드에서도
  // 단건 요청 N개가 아니라 PUT 한 번으로 나가 부분 반영이 생기지 않는다.
  const applyPlan = () => {
    if (!plan) return;
    const patched = new Map(plan.updates.map((u) => [u.row.id, u.patch]));
    const next = store.getAll().map((r) => {
      const patch = patched.get(r.id);
      return patch ? { ...r, ...patch, id: r.id } : r;
    });
    // 신규는 기존 create() 와 같이 앞쪽에 쌓는다.
    store.replaceAll([...plan.creates.slice().reverse(), ...next]);
    setPlan(null);
  };

  return (
    <>
      <button
        onClick={download}
        title="현재 검색 조건이 적용된 기준정보를 내려받습니다. 수정 후 그대로 일괄 업로드할 수 있습니다."
        className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft"
      >
        📥 기준정보 다운로드
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={!authz.canEditHere}
        title={
          authz.canEditHere
            ? `다운로드한 CSV 를 수정해 올리면 ${label} 기준으로 일괄 반영합니다.`
            : "이 모듈에 편집 권한이 없어 업로드할 수 없습니다."
        }
        className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed"
      >
        📤 일괄 업로드
      </button>
      <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" onChange={pickFile} className="hidden" />

      {/* 일괄 업로드 확인 모달 — 승인 전에는 데이터를 변경하지 않는다 */}
      {plan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPlan(null)}>
          <div className="bg-panel border border-line rounded-lg w-[560px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">{title} — 일괄 업로드 검토</div>
            <div className="p-4 space-y-3 text-[12px]">
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-accent-soft">신규 {plan.creates.length}건</span>
                <span className="px-2 py-1 rounded bg-accent-soft">변경 {plan.updates.length}건</span>
                <span className={`px-2 py-1 rounded ${plan.errors.length > 0 ? "bg-red-100 text-red-700" : "bg-accent-soft"}`}>
                  오류 {plan.errors.length}건
                </span>
              </div>

              {plan.ignoredColumns.length > 0 && (
                <div className="text-[11px] text-sub">무시된 컬럼: {plan.ignoredColumns.join(", ")}</div>
              )}

              {plan.errors.length > 0 && (
                <div className="border border-line rounded p-2 max-h-40 overflow-y-auto">
                  <div className="font-semibold mb-1 text-red-600">오류 (해당 행은 반영되지 않습니다)</div>
                  {plan.errors.map((e, i) => <div key={i} className="text-[11px] text-sub">· {e}</div>)}
                </div>
              )}

              {plan.updates.length > 0 && (
                <div className="border border-line rounded p-2 max-h-40 overflow-y-auto">
                  <div className="font-semibold mb-1">변경 대상</div>
                  {plan.updates.map((u, i) => (
                    <div key={i} className="text-[11px] text-sub">
                      · {identify(u.row)} — {u.changed.map((k) => columns.find((c) => c.key === k)?.label ?? k).join(", ")}
                    </div>
                  ))}
                </div>
              )}

              {plan.creates.length > 0 && (
                <div className="border border-line rounded p-2 max-h-40 overflow-y-auto">
                  <div className="font-semibold mb-1">신규 등록 대상</div>
                  {plan.creates.map((c, i) => (
                    <div key={i} className="text-[11px] text-sub">· {identify(c)} {String(c[columns[1]?.key] ?? "")}</div>
                  ))}
                </div>
              )}

              {plan.updates.length === 0 && plan.creates.length === 0 && (
                <div className="text-sub">반영할 변경 사항이 없습니다.</div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setPlan(null)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button
                onClick={applyPlan}
                disabled={plan.updates.length === 0 && plan.creates.length === 0}
                className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold disabled:opacity-40"
              >
                ✅ {plan.updates.length + plan.creates.length}건 반영
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
