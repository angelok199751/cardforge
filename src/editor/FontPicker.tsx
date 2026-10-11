import { useEffect, useMemo, useRef, useState } from "react";
import { BASE_FONTS, displayFontName, loadLocalFonts, supportsLocalFonts } from "../renderer/fonts";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function FontPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [local, setLocal] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [triedLocal, setTriedLocal] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = displayFontName(value);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function loadLocal() {
    setTriedLocal(true);
    try {
      const fonts = await loadLocalFonts();
      setLocal(fonts);
      setMsg("");
    } catch {
      setMsg("Доступ к шрифтам не разрешён");
    }
  }

  function openList() {
    setOpen(true);
    setQuery("");
    if (supportsLocalFonts() && !triedLocal) void loadLocal();
  }

  const all = useMemo(() => Array.from(new Set([...BASE_FONTS, ...local])), [local]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((f) => f.toLowerCase().includes(q)) : all;
  }, [all, query]);

  function pick(f: string) {
    onChange(f);
    setOpen(false);
  }

  return (
    <div className="field font-picker" ref={rootRef}>
      <span className="field-label">Шрифт</span>
      <input
        className="text-input"
        value={open ? query : current}
        placeholder={open ? "Поиск шрифта…" : "Название шрифта"}
        style={open ? undefined : { fontFamily: `"${current}", sans-serif` }}
        onFocus={openList}
        onClick={() => !open && openList()}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) pick(filtered[0] ?? query.trim());
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (
        <div className="font-picker-list">
          {filtered.map((f) => (
            <button
              type="button"
              key={f}
              className={"font-picker-item" + (f === current ? " is-active" : "")}
              style={{ fontFamily: `"${f}", sans-serif` }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(f)}
            >
              {f}
            </button>
          ))}
          {filtered.length === 0 && query.trim() && (
            <button type="button" className="font-picker-item" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(query.trim())}>
              Использовать «{query.trim()}»
            </button>
          )}
        </div>
      )}
      {open && !supportsLocalFonts() && (
        <span className="field-hint">Ваш браузер не отдаёт список установленных шрифтов — введите название вручную</span>
      )}
      {open && supportsLocalFonts() && local.length === 0 && (
        <button type="button" className="btn" style={{ marginTop: 6 }} onMouseDown={(e) => e.preventDefault()} onClick={loadLocal}>
          Загрузить мои шрифты
        </button>
      )}
      {msg && <span className="field-hint">{msg}</span>}
    </div>
  );
}
