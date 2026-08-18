import { useEffect, useRef, useState } from "react";

type BaseProps = { disabled?: boolean };

type TextCellProps = BaseProps & {
  kind: "text";
  value: string;
  onSave: (value: string) => void | Promise<void>;
};

type NumberCellProps = BaseProps & {
  kind: "number";
  value: number | null;
  onSave: (value: number | null) => void | Promise<void>;
};

type DateCellProps = BaseProps & {
  kind: "date";
  value: string | null;
  onSave: (value: string | null) => void | Promise<void>;
};

type EnumCellProps = BaseProps & {
  kind: "enum";
  value: string;
  options: readonly string[];
  onSave: (value: string) => void | Promise<void>;
};

export type EditableCellProps = TextCellProps | NumberCellProps | DateCellProps | EnumCellProps;

function toDisplayValue(props: EditableCellProps): string {
  if (props.kind === "date") return props.value ?? "";
  return String(props.value ?? "");
}

export function EditableCell(props: EditableCellProps) {
  const { kind, disabled } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => toDisplayValue(props));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (!isEditing) setDraft(toDisplayValue(props));
  }, [props.value]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  function startEdit() {
    if (disabled) return;
    setError(null);
    setDraft(toDisplayValue(props));
    setIsEditing(true);
  }

  function cancel() {
    setError(null);
    setIsEditing(false);
    setDraft(toDisplayValue(props));
  }

  async function commit(rawValue: string) {
    setError(null);
    setIsSaving(true);
    try {
      if (kind === "text") await props.onSave(rawValue.trim());
      else if (kind === "number") {
        const trimmed = rawValue.trim();
        if (trimmed === "") {
          await props.onSave(null);
        } else {
          const n = Number(trimmed);
          if (Number.isNaN(n)) throw new Error("Nombre invalide");
          await props.onSave(n);
        }
      } else if (kind === "date") await props.onSave(rawValue === "" ? null : rawValue);
      else await props.onSave(rawValue);
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Valeur invalide");
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(draft);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  if (!isEditing) {
    return (
      <button type="button" className="ec-display" onClick={startEdit} disabled={disabled}>
        {toDisplayValue(props) || <span className="ec-empty">—</span>}
      </button>
    );
  }

  if (kind === "enum") {
    return (
      <div className="ec-wrap">
        <select
          ref={inputRef as React.Ref<HTMLSelectElement>}
          className={`ec-input ${error ? "has-error" : ""}`}
          value={draft}
          onChange={(e) => commit(e.target.value)}
          onBlur={cancel}
          disabled={isSaving}
        >
          {props.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && (
          <span className="ec-error" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="ec-wrap">
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        className={`ec-input ${error ? "has-error" : ""}`}
        type={kind === "number" ? "number" : kind === "date" ? "date" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        title={error ?? undefined}
      />
    </div>
  );
}
