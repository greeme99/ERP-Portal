import { useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { MODULES } from "../../data/menu";
import { useAuthz } from "../../services/authz";

export default function Gnb() {
  const { moduleId } = useParams();
  const authz = useAuthz();
  // 권한이 "없음"인 모듈은 메뉴에서 감춘다
  const visibleModules = MODULES.filter((m) => authz.canView(m.id));
  const [open, setOpen] = useState<Record<string, boolean>>(
    moduleId ? { [moduleId]: true } : {}
  );

  const toggle = (id: string) =>
    setOpen((p) => ({ ...p, [id]: !p[id] }));

  return (
    <aside className="w-60 shrink-0 border-r border-line bg-panel overflow-y-auto">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `block px-4 py-3 font-bold border-b border-line ${
            isActive ? "text-accent" : "text-ink"
          }`
        }
      >
        🏠 메인 포탈
      </NavLink>
      <nav className="py-1">
        {visibleModules.map((m) => (
          <div key={m.id}>
            <button
              onClick={() => toggle(m.id)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-accent-soft text-left"
            >
              <span className="font-semibold">
                {m.icon} {m.code}. {m.name}
                <span className="ml-1 text-sub text-[11px]">{m.nameEn}</span>
              </span>
              <span className="text-sub text-[10px]">{open[m.id] ? "▾" : "▸"}</span>
            </button>
            {open[m.id] && (
              <ul className="pb-1">
                {m.items.map((it) => (
                  <li key={it.slug}>
                    <NavLink
                      to={`/m/${m.id}/${it.slug}`}
                      className={({ isActive }) =>
                        `block pl-10 pr-3 py-1.5 text-[12px] hover:bg-accent-soft ${
                          isActive
                            ? "text-accent font-semibold bg-accent-soft border-r-2 border-accent"
                            : "text-sub"
                        }`
                      }
                    >
                      {it.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
