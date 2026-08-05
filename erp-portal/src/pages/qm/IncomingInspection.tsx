// QM-001 수입검사 — 입고 LOT 검사, 불합격 시 LOT 보류
import { materialStore } from "../../data/mock/master";
import { lotStore } from "../../data/mock/logistics";
import { inspStore, sampleSize, acceptLimit } from "../../data/mock/quality";
import { useStore, nextId, downloadCsv } from "../../services/store";

const TODAY = "2026-07-03";

const RESULT_STYLE: Record<string, string> = {
  대기: "bg-amber-100 text-amber-700",
  합격: "bg-emerald-100 text-emerald-700",
  불합격: "bg-red-100 text-red-700",
};

export default function IncomingInspection() {
  const insps = useStore(inspStore);
  const lots = useStore(lotStore);
  const mats = useStore(materialStore);

  // 미검사 원자재/부자재 LOT 동기화
  const uninspected = lots.filter(
    (l) => !l.material.startsWith("FG-") && !l.material.startsWith("SF-") && l.vendor !== "-" &&
      !insps.some((i) => i.lot === l.code)
  );

  const sync = () => {
    if (uninspected.length === 0) return alert("검사 대상 신규 LOT이 없습니다.");
    uninspected.forEach((l) => {
      const code = nextId("IQ");
      inspStore.create({
        id: code, code, lot: l.code, material: l.material, vendor: l.vendor,
        qty: l.qty, sample: sampleSize(l.qty), defects: 0, result: "대기", date: "-",
      });
    });
  };

  const judge = (insp: any, defects: number) => {
    const limit = acceptLimit(insp.sample);
    const result = defects <= limit ? "합격" : "불합격";
    inspStore.update(insp.id, { defects, result, date: TODAY });
    if (result === "불합격") {
      const lot = lots.find((l) => l.code === insp.lot);
      if (lot) lotStore.update(lot.id, { status: "보류" });
      alert(`❌ 불합격 — ${insp.lot} 보류 처리. 부적합관리/8D 절차 진행 필요.`);
    }
  };

  const process = (insp: any) => {
    const input = prompt(`${insp.lot} 검사 결과 — 샘플 ${insp.sample}개 중 불량 수량 입력 (허용 ${acceptLimit(insp.sample)}개 이하 합격):`, "0");
    if (input === null) return;
    const defects = Number(input);
    if (isNaN(defects) || defects < 0) return alert("숫자를 입력하세요.");
    judge(insp, defects);
  };

  const excel = () =>
    downloadCsv("수입검사.csv", ["검사번호", "LOT", "품목", "공급사", "수량", "샘플", "불량", "판정", "검사일"],
      insps.map((i) => [i.code, i.lot, i.material, i.vendor, i.qty, i.sample, i.defects, i.result, i.date]));

  const waiting = insps.filter((i) => i.result === "대기").length;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] text-sub">06. 품질관리 (Quality)</div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">수입검사 (QM-001)</h1>
          <span className="text-[11px] text-sub">AQL 샘플링 · 불합격 시 LOT 보류</span>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-3 flex items-center gap-3">
        <span className="text-[11px] text-sub">{insps.length}건</span>
        {waiting > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">검사 대기 {waiting}건</span>
        )}
        {uninspected.length > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">미등록 입고 LOT {uninspected.length}건</span>
        )}
        <div className="ml-auto flex gap-1">
          <button onClick={sync} className="px-3 py-1.5 rounded bg-accent text-white text-[12px] font-semibold">↻ 검사대상 동기화</button>
          <button onClick={excel} className="px-3 py-1.5 rounded border border-line text-[12px] hover:bg-accent-soft">📥 Excel</button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-sub text-left">
              <th className="px-3 py-2">검사번호</th>
              <th className="px-3 py-2">LOT</th>
              <th className="px-3 py-2">품목</th>
              <th className="px-3 py-2">공급사</th>
              <th className="px-3 py-2 text-right">수량</th>
              <th className="px-3 py-2 text-right">샘플</th>
              <th className="px-3 py-2 text-right">불량</th>
              <th className="px-3 py-2">판정</th>
              <th className="px-3 py-2">검사일</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody>
            {insps.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0 hover:bg-accent-soft">
                <td className="px-3 py-2 font-mono">{i.code}</td>
                <td className="px-3 py-2 font-mono text-sub">{i.lot}</td>
                <td className="px-3 py-2">{i.material} — {mats.find((m) => m.code === i.material)?.name ?? ""}</td>
                <td className="px-3 py-2 text-sub">{i.vendor}</td>
                <td className="px-3 py-2 text-right">{i.qty.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{i.sample}</td>
                <td className={`px-3 py-2 text-right ${i.defects > 0 ? "text-red-500 font-semibold" : ""}`}>{i.defects}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${RESULT_STYLE[i.result] ?? ""}`}>{i.result}</span>
                </td>
                <td className="px-3 py-2 text-sub">{i.date}</td>
                <td className="px-3 py-2">
                  {i.result === "대기" && (
                    <button onClick={() => process(i)} className="px-2 py-0.5 rounded bg-accent text-white text-[10px] font-semibold">🔍 검사</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
