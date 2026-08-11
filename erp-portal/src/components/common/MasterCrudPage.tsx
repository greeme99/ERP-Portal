// 마스터 CRUD 표준 화면 — 설정(fields) 기반으로 그리드+폼 자동 구성
import { ReactNode, useMemo, useState } from "react";
import { Entity, EntityStore, useStore } from "../../services/store";
import MassUpdateBar from "./MassUpdateBar";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "date";
  options?: string[];
  required?: boolean;
  align?: "right";
  render?: (row: Entity) => ReactNode;
  hideInForm?: boolean;
}

interface Props {
  moduleLabel: string; // 예: "12. 기준정보 (Master Data)"
  title: string;
  store: EntityStore;
  fields: FieldDef[];
  newRow: () => Entity;
  searchKeys?: string[];
  keyField?: string; // 일괄 업로드 매칭 키 (기본: 첫 번째 필드 = 코드)
}

export default function MasterCrudPage({ moduleLabel, title, store, fields, newRow, searchKeys, keyField }: Props) {
  const rows = useStore(store);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [isNew, setIsNew] = useState(false);

  const keys = searchKeys ?? ["code", "name"];
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        q.trim() === "" ? true : keys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))
      ),
    [rows, q]
  );

  const toggleAll = (on: boolean) => setSelected(on ? filtered.map((r) => r.id) : []);
  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = () => {
    if (!editing) return;
    for (const f of fields) {
      if (f.required && !String(editing[f.key] ?? "").trim()) {
        alert(`${f.label}은(는) 필수입니다.`);
        return;
      }
    }
    if (isNew) store.create(editing);
    else store.update(editing.id, editing);
    setEditing(null);
  };

  const remove = () => {
    if (selected.length === 0) return alert("삭제할 행을 선택하세요.");
    if (confirm(`${selected.length}건을 삭제할까요?`)) {
      store.remove(selected);
      setSelected([]);
    }
  };

  // 일괄 업로드 대상 컬럼 — 계산 컬럼(hideInForm)은 원본 값이 없으므로 제외해 그대로 재업로드 가능하게 한다
  const ioFields = useMemo(() => fields.filter((f) => !f.hideInForm), [fields]);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">{moduleLabel}</div>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>

      {/* 필터 + 액션 */}
      <div className="bg-panel border border-line rounded-lg p-3 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 코드/명칭 검색"
          className="px-3 py-1.5 rounded border border-line bg-surface text-[12px] w-56 outline-none focus:border-accent"
        />
        <span className="text-[11px] text-sub">{filtered.length}건</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => { setEditing(newRow()); setIsNew(true); }}
            className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold"
          >
            ＋ 신규
          </button>
          <button onClick={remove} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">🗑 삭제</button>
          <MassUpdateBar
            title={title}
            store={store}
            rows={filtered}
            columns={ioFields}
            newRow={newRow}
            keyKey={keyField}
          />
        </div>
      </div>

      {/* 그리드 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2 w-10">
                <input type="checkbox" checked={selected.length > 0 && selected.length === filtered.length} onChange={(e) => toggleAll(e.target.checked)} />
              </th>
              {fields.map((f) => (
                <th key={f.key} className={`px-3 py-2 ${f.align === "right" ? "text-right" : ""}`}>{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                onDoubleClick={() => { setEditing({ ...r }); setIsNew(false); }}
                className="border-b border-line last:border-0 hover:bg-accent-soft cursor-pointer"
                title="더블클릭: 수정"
              >
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} onClick={(e) => e.stopPropagation()} />
                </td>
                {fields.map((f) => (
                  <td key={f.key} className={`px-3 py-2 ${f.align === "right" ? "text-right" : ""}`}>
                    {f.render ? f.render(r) : f.type === "number" ? Number(r[f.key] ?? 0).toLocaleString() : r[f.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-sub border-t border-line">더블클릭으로 행 수정</div>
      </div>

      {/* 폼 모달 */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-panel border border-line rounded-lg w-[480px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">
              {title} — {isNew ? "신규 등록" : "수정"}
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {fields.filter((f) => !f.hideInForm).map((f) => (
                <label key={f.key} className="text-[11px] text-sub">
                  {f.label}{f.required && <span className="text-red-500"> *</span>}
                  {f.type === "select" ? (
                    <select
                      value={editing[f.key] ?? ""}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                      className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink"
                    >
                      <option value="">선택</option>
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      value={editing[f.key] ?? ""}
                      onChange={(e) =>
                        setEditing({ ...editing, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })
                      }
                      className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
