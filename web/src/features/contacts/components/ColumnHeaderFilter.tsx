import { useEffect, useRef, useState } from "react";
import { Filter } from "lucide-react";

type ColumnHeaderFilterProps =
  | { kind: "text"; value: string; onChange: (value: string) => void }
  | { kind: "enum"; value: string; options: readonly string[]; onChange: (value: string) => void };

export function ColumnHeaderFilter(props: ColumnHeaderFilterProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isActive = props.value !== "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="chf-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`chf-trigger ${isActive ? "active" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Filtrer cette colonne"
      >
        <Filter size={14} />
      </button>

      {open && (
        <div className="chf-popover">
          {props.kind === "enum" ? (
            <select
              className="chf-input"
              value={props.value}
              onChange={(e) => props.onChange(e.target.value)}
              autoFocus
            >
              <option value="">Tous</option>
              {props.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="chf-input"
              type="text"
              value={props.value}
              onChange={(e) => props.onChange(e.target.value)}
              placeholder="Filtrer..."
              autoFocus
            />
          )}
        </div>
      )}
    </div>
  );
}
