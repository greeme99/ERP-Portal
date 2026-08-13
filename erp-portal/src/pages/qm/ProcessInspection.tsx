// QM-003 공정검사 — 작업지시 공정 단계 검사, 불합격 시 부적합(NC) 발행
import { useState } from "react";
import { materialStore } from "../../data/mock/master";
import { woStore } from "../../data/mock/production";
import { procInspStore, ncStore } from "../../data/mock/quality2";
import { useStore, nextId, downloadCsv } from "../../services/store";
import { nextDocCode } from "../../services/docNumber";

const TODAY = "2026-07-03";
const PROCESSES = ["SMT", "조립", "검사", "포장"];

const RESULT_STYLE: Record<string, string> = {
  합격: "bg-emerald-100 text-emerald-700",
  불합격: "bg-red-100 text-red-700",
};

export default function ProcessInspection() {
  const insps = useStore(procInspStore);
  const wos = useStore(woStore);
  const mats = useStore(materialStore);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ wo: "", process: "조립", sample: 50, defects: 0 });

  const activeWos = wos.filter((w) => w.status === "진행" || w.status === "완료");

  const save = async () => {
    if (!form.wo) return alert("작업지시를 선택하세요.");
    const wo = wos.find((w) => w.code === form.wo);
    const result = form.defects === 0 ? "합격" : form.defects <= Math.floor(form.sample * 0.02) ? "합격" : "불합격";
    const code = await nextDocCode("PQ", procInspStore.getAll().map((x) => String(x.code)));
    procInspStore.create({
      id: code, code, wo: form.wo, material: wo?.material ?? "", process: form.process,
      sample: form.sample, defects: form.defects, result, date: TODAY,
    });
    if (result === "불합격") {
      const ncCode = nextId("NC");
      ncStore.create({
        id: ncCode, code: ncCode, source: "공정검사", ref: form.wo, material: wo?.material ?? "", vendor: "-",
        qty: form.defects, defectType: "공정불량", severity: "중", dStep: 1, capa: "", status: "진행", date: TODAY,
        desc: `${form.process} 공정 불합격 (샘플 ${form.sample} 중 불량 ${form.defects})`,
      });
      alert(`❌ 불합격 → 부적합 ${ncCode} 자동 발행 (부적합/8D 화면에서 처리)`);
    }
    setCreating(false);
    setForm({ wo: "", process: "조립", sample: 50, defects: 0 });
  };

  const excel = () =>
    downloadCsv("공정검사.csv", ["검사번호", "작업지시", "품목", "공정", "샘플", "불량", "판정", "일자"],
      insps.map((i) => [i.code, i.wo, i.material, i.process, i.sample, i.defects, i.result, i.date]));

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. 품질관리 (Quality)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">공정검사 (QM-003)</h1>
          <span className="text-[11px] text-sub">작업지시 공정 검사 · 불합격 시 부적합(NC) 자동 발행</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-2">
        <span className="text-[11px] text-sub">{insps.length}건</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">＋ 공정검사</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">검사번호</th>
              <th className="px-3 py-2">작업지시</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2">공정</th>
              <th className="px-3 py-2 text-right">샘플</th>
              <th className="px-3 py-2 text-right">불량</th>
              <th className="px-3 py-2">판정</th>
              <th className="px-3 py-2">일자</th>
            </tr>
          </thead>
          <tbody>
            {insps.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{i.code}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.wo}</td>
                <td className="px-3 py-2">{i.material} — {mats.find((m) => m.code === i.material)?.name ?? ""}</td>
                <td className="px-3 py-2">{i.process}</td>
                <td className="px-3 py-2 text-right">{i.sample}</td>
                <td className={`px-3 py-2 text-right ${i.defects > 0 ? "text-red-500 font-semibold" : ""}`}>{i.defects}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${RESULT_STYLE[i.result] ?? ""}`}>{i.result}</span>
                </td>
                <td className="px-3 py-2 text-sub">{i.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-panel border border-line rounded-lg w-[440px]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-line font-bold">공정검사 등록</div>
            <div className="p-4 space-y-3">
              <label className="text-[11px] text-sub block">
                작업지시 (진행/완료)
                <select value={form.wo} onChange={(e) => setForm({ ...form, wo: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                  <option value="">선택</option>
                  {activeWos.map((w) => <option key={w.code} value={w.code}>{w.code} — {w.material} [{w.status}]</option>)}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="text-[11px] text-sub">
                  공정
                  <select value={form.process} onChange={(e) => setForm({ ...form, process: e.target.value })}
                    className="block mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink">
                    {PROCESSES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-sub">
                  샘플수
                  <input type="number" value={form.sample} onChange={(e) => setForm({ ...form, sample: Number(e.target.value) })}
                    className="block w-24 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
                <label className="text-[11px] text-sub">
                  불량수
                  <input type="number" value={form.defects} onChange={(e) => setForm({ ...form, defects: Number(e.target.value) })}
                    className="block w-24 mt-1 px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink" />
                </label>
              </div>
              <div className="text-[11px] text-sub bg-accent-soft rounded p-2">
                허용 불량 {Math.floor(form.sample * 0.02)}개 (2%) 초과 시 불합격 → 부적합(NC) 자동 발행
              </div>
            </div>
            <div className="px-4 py-3 border-t border-line flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded border border-line text-[12px]">취소</button>
              <button onClick={save} className="px-4 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">💾 판정</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
