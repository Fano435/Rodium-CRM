import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Settings2, Check, X } from "lucide-react";
import { ColumnType } from "@generated/prisma/enums";
import {
  useCreateContactColumn,
  useUpdateContactColumn,
  useDeleteContactColumn,
} from "../hooks/useContactColumnMutations";
import type { ContactColumn } from "../../../services/contactColumns.api";

type ColumnManagerMenuProps = { columns: ContactColumn[] };

const TYPE_LABELS: Record<ColumnType, string> = {
  [ColumnType.TEXT]: "Texte",
  [ColumnType.NUMBER]: "Nombre",
  [ColumnType.DATE]: "Date",
};

export function ColumnManagerMenu({ columns }: ColumnManagerMenuProps) {
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<ColumnType>(ColumnType.TEXT);
  const wrapRef = useRef<HTMLDivElement>(null);

  const createColumn = useCreateContactColumn();
  const updateColumn = useUpdateContactColumn();
  const deleteColumn = useDeleteContactColumn();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function startRename(col: ContactColumn) {
    setRenamingId(col.id);
    setRenameValue(col.label);
  }

  function commitRename(id: number) {
    const trimmed = renameValue.trim();
    if (trimmed) updateColumn.mutate({ id, payload: { label: trimmed } });
    setRenamingId(null);
  }

  function handleCreate() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    createColumn.mutate({ label: trimmed, type: newType }, { onSuccess: () => setNewLabel("") });
  }

  function handleDelete(col: ContactColumn) {
    if (
      window.confirm(
        `Supprimer la colonne "${col.label}" ? Les valeurs deja saisies pour cette colonne seront perdues.`,
      )
    ) {
      deleteColumn.mutate(col.id);
    }
  }

  return (
    <div className="cmm-wrap" ref={wrapRef}>
      <button type="button" className="btn" onClick={() => setOpen((o) => !o)}>
        <Settings2 size={14} />
        Colonnes
      </button>

      {open && (
        <div className="cmm-popover">
          <ul className="cmm-list">
            {columns.map((col) => (
              <li key={col.id} className="cmm-item">
                {renamingId === col.id ? (
                  <>
                    <input
                      className="cmm-rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(col.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="ct-icon-btn ct-icon-btn-confirm"
                      onClick={() => commitRename(col.id)}
                      aria-label="Valider"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      className="ct-icon-btn"
                      onClick={() => setRenamingId(null)}
                      aria-label="Annuler"
                    >
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="cmm-item-label">{col.label}</span>
                    <span className="cmm-item-type">{TYPE_LABELS[col.type]}</span>
                    <button
                      type="button"
                      className="ct-icon-btn"
                      onClick={() => startRename(col)}
                      aria-label={`Renommer ${col.label}`}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="ct-icon-btn ct-icon-btn-danger"
                      onClick={() => handleDelete(col)}
                      aria-label={`Supprimer ${col.label}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </li>
            ))}
            {columns.length === 0 && <li className="cmm-empty">Aucune colonne personnalisee.</li>}
          </ul>

          <div className="cmm-new">
            <input
              className="cmm-new-input"
              placeholder="Nom de la colonne"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <select
              className="cmm-new-select"
              value={newType}
              onChange={(e) => setNewType(e.target.value as ColumnType)}
            >
              {Object.values(ColumnType).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ct-icon-btn ct-icon-btn-confirm"
              onClick={handleCreate}
              disabled={!newLabel.trim()}
              aria-label="Ajouter la colonne"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
