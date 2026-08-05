// AI Copilot — Agent 5종 rule-based 실동작 (Sprint 5)
import { useState } from "react";
import { AI_AGENTS, routeQuestion } from "../../services/insights";

interface Msg {
  role: "user" | "ai";
  text: string;
}

export default function CopilotPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "ERP AI Copilot입니다. Agent 버튼을 누르거나 질문해 보세요.\n예: \"부족 자재 알려줘\", \"이번 달 손익은?\"" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const push = (m: Msg) => setMsgs((p) => [...p, m]);

  const runAgent = (name: string) => {
    const agent = AI_AGENTS.find((a) => a.name === name);
    if (!agent || busy) return;
    push({ role: "user", text: `${agent.name} 실행` });
    setBusy(true);
    setTimeout(() => {
      push({ role: "ai", text: agent.run() });
      setBusy(false);
    }, 300);
  };

  const ask = (text: string) => {
    if (!text.trim() || busy) return;
    push({ role: "user", text });
    setInput("");
    setBusy(true);
    setTimeout(() => {
      push({ role: "ai", text: routeQuestion(text) });
      setBusy(false);
    }, 300);
  };

  return (
    <aside className="w-72 shrink-0 border-l border-line bg-panel flex flex-col">
      <div className="px-4 py-3 border-b border-line font-bold">
        🤖 AI Copilot <span className="text-[10px] text-sub font-normal">rule-based (모델 연동: 마스터플랜 4단계)</span>
      </div>

      <div className="px-3 py-2 border-b border-line">
        <div className="text-[11px] text-sub mb-1">AI Agents — 실시간 데이터 분석</div>
        <div className="flex flex-wrap gap-1">
          {AI_AGENTS.map((a) => (
            <button key={a.name} title={a.desc} onClick={() => runAgent(a.name)} disabled={busy}
              className="px-2 py-1 rounded-full border border-line text-[11px] hover:bg-accent-soft disabled:opacity-50">
              {a.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {msgs.map((m, i) => (
          <div key={i}
            className={`max-w-[92%] px-3 py-2 rounded-lg text-[12px] whitespace-pre-line ${
              m.role === "user" ? "ml-auto bg-accent text-white" : "bg-accent-soft text-ink"
            }`}>
            {m.text}
          </div>
        ))}
        {busy && <div className="text-[11px] text-sub px-2">분석 중…</div>}
      </div>

      <div className="p-3 border-t border-line flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(input)}
          placeholder="질문 입력 (예: 부족 자재?)"
          className="flex-1 px-3 py-1.5 rounded border border-line bg-surface text-[12px] outline-none focus:border-accent"
        />
        <button onClick={() => ask(input)} disabled={busy}
          className="px-3 py-1.5 rounded bg-accent text-white text-[12px] disabled:opacity-50">
          전송
        </button>
      </div>
    </aside>
  );
}
