// BOM 마스터 — 다단계 트리 조회 + 라인 추가/삭제
import { useState } from "react";
import { bomStore, materialStore } from "../../data/mock/master";
import { Entity, useStore, nextId } from "../../services/store";
import MassUpdateBar, { MassColumn } from "../../components/common/MassUpdateBar";

interface TreeRowProps {
  parent: string;
  level: number;
  boms: Entity[];
  mats: Entity[];
  onRemove: (id: string) => void;
}

function TreeRows({ parent, level, boms, mats, onRemove }: TreeRowProps) {
  const children = boms.filter((b) => b.parent === parent);
  return (
    <>
      {children.map((b) => {
        const mat = mats.find((m) => m.code === b.child);
        return (
          <TreeNode key={b.id} bom={b} mat={mat} level={level} boms={boms} mats={mats} onRemove={onRemove} />
        );
      })}
    </>
  );
}

function TreeNode({ bom, mat, level, boms, mats, onRemove }: { bom: Entity; mat?: Entity; level: number } & Pick<TreeRowProps, "boms" | "mats" | "onRemove">) {
  const hasChildren = boms.some((b) => b.parent === bom.child);
  return (
    <>
      <tr className="border-b border-line hover:bg-accent-soft">
        <td className="px-3 py-2 font-mono" style={{ paddingLeft: `${12 + level * 24}px` }}>
          {hasChildren ? "📦" : "🔩"} {bom.child}
        </td>
        <td className="px-3 py-2">{mat?.name ?? "-"}</td>
        <td className="px-3 py-2 text-sub">{mat?.type ?? "-"}</td>
        <td className="px-3 py-2 text-right">{bom.qty}</td>
        <td className="px-3 py-2">{bom.uom}</td>
        <td className="px-3 py-2 text-sub">Lv.{level}</td>
        <td className="px-3 py-2">
          <button onClick={() => onRemove(bom.id)} className="text-[11px] text-red-500 hover:underline">삭제</button>
        </td>
      </tr>
      <TreeRows parent={bom.child} level={level + 1} boms={boms} mats={mats} onRemove={onRemove} />
    </>
  );
}

export default function BomMaster() {
  const boms = useStore(bomStore);
  const mats = useStore(materialStore);
  const parents = mats.filter((m) => m.type === "완제품" || m.type === "반제품");
  const [parent, setParent] = useState("FG-1001");
  const [child, setChild] = useState("");
  const [qty, setQty] = useState(1);

  const parentMat = mats.find((m) => m.code === parent);

  const addLine = () => {
    if (!child) return alert("구성품목을 선택하세요.");
    if (child === parent) return alert("자기 자신은 추가할 수 없습니다.");
    if (boms.some((b) => b.parent === parent && b.child === child)) return alert("이미 등록된 구성품입니다.");
    const mat = mats.find((m) => m.code === child);
    bomStore.create({ id: nextId("B"), parent, child, qty, uom: mat?.uom ?? "EA" });
    setChild("");
    setQty(1);
  };

  const remove = (id: string) => {
    if (confirm("이 BOM 라인을 삭제할까요? (하위 구조는 유지)")) bomStore.remove([id]);
  };

  // 화면에 전개된 상위품목 기준 다단계 BOM 라인 (다운로드 대상 = 트리에 보이는 범위)
  const explodedLines = (() => {
    const acc: Entity[] = [];
    const walk = (code: string, guard: Set<string>) => {
      if (guard.has(code)) return; // 순환 BOM 방어
      guard.add(code);
      for (const b of boms.filter((x) => x.parent === code)) {
        acc.push(b);
        walk(String(b.child), guard);
      }
    };
    walk(parent, new Set());
    return acc;
  })();

  // 기준정보 일괄 다운로드/업로드 컬럼 (매칭 키: 모품목+자품목 복합키)
  const massColumns: MassColumn[] = [
    { key: "parent", label: "모품목코드", required: true },
    { key: "child", label: "자품목코드", required: true },
    { key: "qty", label: "소요량", type: "number", required: true },
    { key: "uom", label: "단위", type: "select", options: ["EA", "KG", "M", "SET"] },
  ];

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">12. 기준정보 (Master Data)</div>
        <h1 className="text-lg font-bold">BOM 마스터</h1>
      </div>

      {/* 상위품목 선택 + 라인 추가 */}
      <div className="bg-panel border border-line rounded-lg p-3 flex flex-wrap items-end gap-3">
        <label className="text-[11px] text-sub">
          상위 품목 (완제품/반제품)
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="block mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink w-64"
          >
            {parents.map((m) => (
              <option key={m.code} value={m.code}>{m.code} — {m.name}</option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex items-end gap-2">
          <label className="text-[11px] text-sub">
            구성품목 추가
            <select value={child} onChange={(e) => setChild(e.target.value)} className="block mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink w-56">
              <option value="">선택</option>
              {mats.filter((m) => m.code !== parent).map((m) => (
                <option key={m.code} value={m.code}>{m.code} — {m.name}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-sub">
            소요량
            <input type="number" value={qty} min={0.001} onChange={(e) => setQty(Number(e.target.value))} className="block mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink w-20" />
          </label>
          <button onClick={addLine} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 추가</button>
          <MassUpdateBar
            title="BOM 마스터"
            filename="기준정보_BOM_구성_대장.csv"
            store={bomStore}
            rows={explodedLines}
            columns={massColumns}
            keyOf={(r) => `${r.parent}|${r.child}`}
            keyLabel="모품목+자품목"
            newRow={() => ({ id: nextId("B"), parent: "", child: "", qty: 1, uom: "EA" })}
          />
        </div>
      </div>

      {/* BOM 트리 */}
      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-line font-semibold">
          🏭 {parentMat?.code} — {parentMat?.name} <span className="text-[11px] text-sub ml-2">다단계 BOM 전개</span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">구성품목</th>
              <th className="px-3 py-2">품목명</th>
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2 text-right">소요량</th>
              <th className="px-3 py-2">단위</th>
              <th className="px-3 py-2">레벨</th>
              <th className="px-3 py-2 w-14"></th>
            </tr>
          </thead>
          <tbody>
            <TreeRows parent={parent} level={1} boms={boms} mats={mats} onRemove={remove} />
          </tbody>
        </table>
        {boms.filter((b) => b.parent === parent).length === 0 && (
          <div className="px-4 py-6 text-center text-sub text-[12px]">등록된 BOM이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
