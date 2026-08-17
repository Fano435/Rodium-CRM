import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, X } from "lucide-react";
import { StatutContact, ColumnType } from "@generated/prisma/enums";
import { EditableCell } from "./EditableCell";
import { ColumnHeaderFilter } from "./ColumnHeaderFilter";
import type { Contact } from "../../../services/contacts.api";
import type { ContactColumn } from "../../../services/contactColumns.api";

export type FixedFieldKey = "nom" | "entreprise" | "telephone" | "score" | "statut";
export type FieldRef = { kind: "fixed"; key: FixedFieldKey } | { kind: "custom"; columnId: number };
export type SaveTarget = { type: "draft" } | { type: "existing"; id: number };
export type SortKey = FixedFieldKey | `custom:${number}`;
export type FilterKey = SortKey;

type DraftContact = {
  nom?: string;
  entreprise?: string | null;
  telephone?: string;
  score?: number | null;
  statut?: StatutContact;
  customFields?: Record<string, string | number | null>;
};

type ContactsTableProps = {
  contacts: Contact[];
  columns: ContactColumn[]; // deja triees par `order`
  sortKey: SortKey;
  sortOrder: "asc" | "desc";
  onSort: (key: SortKey) => void;
  filters: Record<string, string>;
  onFilterChange: (key: FilterKey, value: string) => void;
  draft: DraftContact | null;
  draftSaving?: boolean;
  onCancelDraft: () => void;
  onSaveField: (target: SaveTarget, field: FieldRef, value: string | number | null) => Promise<void>;
  onDelete: (id: number) => void;
  onReorderColumns: (orderedIds: number[]) => void;
};

const MIN_COLUMN_WIDTH = 140;
const ROW_HEIGHT = 40;
const ACTIONS_WIDTH = 56;

const FIXED_COLUMNS: { key: FixedFieldKey; label: string }[] = [
  { key: "nom", label: "Nom" },
  { key: "entreprise", label: "Entreprise" },
  { key: "telephone", label: "Telephone" },
  { key: "score", label: "Score" },
  { key: "statut", label: "Statut" },
];

function customValue(customFields: Record<string, string | number | null> | undefined, columnId: number) {
  return customFields?.[String(columnId)] ?? null;
}

function DraggableColumnHeader({
  column,
  isSorted,
  sortDirection,
  onSort,
  filterValue,
  onFilterChange,
}: {
  column: ContactColumn;
  isSorted: boolean;
  sortDirection: "asc" | "desc";
  onSort: () => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="columnheader"
      className="ct-header-cell ct-header-cell-draggable"
      {...attributes}
      {...listeners}
    >
      <button type="button" className="ct-sort-btn" onClick={onSort}>
        {column.label} {isSorted ? (sortDirection === "asc" ? "▲" : "▼") : ""}
      </button>
      <ColumnHeaderFilter kind="text" value={filterValue} onChange={onFilterChange} />
    </div>
  );
}

export function ContactsTable({
  contacts,
  columns,
  sortKey,
  sortOrder,
  onSort,
  filters,
  onFilterChange,
  draft,
  draftSaving,
  onCancelDraft,
  onSaveField,
  onDelete,
  onReorderColumns,
}: ContactsTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const virtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const totalDataColumns = FIXED_COLUMNS.length + columns.length;
  const gridTemplateColumns = `repeat(${totalDataColumns}, minmax(${MIN_COLUMN_WIDTH}px, 1fr)) ${ACTIONS_WIDTH}px`;
  const rowMinWidth = totalDataColumns * MIN_COLUMN_WIDTH + ACTIONS_WIDTH;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = columns.findIndex((c) => c.id === active.id);
    const newIndex = columns.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderColumns(arrayMove(columns, oldIndex, newIndex).map((c) => c.id));
  }

  function renderFixedCell(target: SaveTarget, source: DraftContact | Contact, key: FixedFieldKey, disabled?: boolean) {
    const field: FieldRef = { kind: "fixed", key };

    if (key === "statut") {
      return (
        <EditableCell
          kind="enum"
          value={source.statut ?? StatutContact.PROSPECT}
          options={Object.values(StatutContact)}
          onSave={(v) => onSaveField(target, field, v)}
          disabled={disabled}
        />
      );
    }
    if (key === "score") {
      return (
        <EditableCell
          kind="number"
          value={source.score ?? null}
          onSave={(v) => onSaveField(target, field, v)}
          disabled={disabled}
        />
      );
    }
    return (
      <EditableCell
        kind="text"
        value={(source[key] as string | null | undefined) ?? ""}
        onSave={(v) => onSaveField(target, field, v)}
        disabled={disabled}
      />
    );
  }

  function renderCustomCell(
    target: SaveTarget,
    source: DraftContact | Contact,
    column: ContactColumn,
    disabled?: boolean,
  ) {
    const field: FieldRef = { kind: "custom", columnId: column.id };
    const value = customValue(source.customFields, column.id);

    if (column.type === ColumnType.NUMBER) {
      return (
        <EditableCell
          kind="number"
          value={typeof value === "number" ? value : null}
          onSave={(v) => onSaveField(target, field, v)}
          disabled={disabled}
        />
      );
    }
    if (column.type === ColumnType.DATE) {
      return (
        <EditableCell
          kind="date"
          value={typeof value === "string" ? value : null}
          onSave={(v) => onSaveField(target, field, v)}
          disabled={disabled}
        />
      );
    }
    return (
      <EditableCell
        kind="text"
        value={typeof value === "string" ? value : ""}
        onSave={(v) => onSaveField(target, field, v)}
        disabled={disabled}
      />
    );
  }

  return (
    <div role="table" aria-rowcount={contacts.length}>
      <div ref={scrollRef} className="table-scroll">
        <div role="row" className="ct-header-row" style={{ gridTemplateColumns, minWidth: rowMinWidth }}>
          {FIXED_COLUMNS.map((col) => (
            <div key={col.key} role="columnheader" className="ct-header-cell">
              <button type="button" className="ct-sort-btn" onClick={() => onSort(col.key)}>
                {col.label} {sortKey === col.key ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </button>
              {col.key === "statut" ? (
                <ColumnHeaderFilter
                  kind="enum"
                  options={Object.values(StatutContact)}
                  value={filters.statut ?? ""}
                  onChange={(v) => onFilterChange("statut", v)}
                />
              ) : (
                <ColumnHeaderFilter
                  kind="text"
                  value={filters[col.key] ?? ""}
                  onChange={(v) => onFilterChange(col.key, v)}
                />
              )}
            </div>
          ))}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
              {columns.map((col) => (
                <DraggableColumnHeader
                  key={col.id}
                  column={col}
                  isSorted={sortKey === `custom:${col.id}`}
                  sortDirection={sortOrder}
                  onSort={() => onSort(`custom:${col.id}`)}
                  filterValue={filters[`custom:${col.id}`] ?? ""}
                  onFilterChange={(v) => onFilterChange(`custom:${col.id}`, v)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div role="columnheader" />
        </div>

        {draft && (
          <div
            role="row"
            className="ct-row ct-row-draft ct-row-draft-sticky"
            style={{ gridTemplateColumns, minWidth: rowMinWidth }}
          >
            {FIXED_COLUMNS.map((col) => (
              <div key={col.key} role="cell">
                {renderFixedCell({ type: "draft" }, draft, col.key, draftSaving)}
              </div>
            ))}
            {columns.map((col) => (
              <div key={col.id} role="cell">
                {renderCustomCell({ type: "draft" }, draft, col, draftSaving)}
              </div>
            ))}
            <div role="cell" className="ct-row-actions">
              <button type="button" className="ct-icon-btn" onClick={onCancelDraft} aria-label="Annuler la creation">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div style={{ height: virtualizer.getTotalSize(), position: "relative", minWidth: rowMinWidth }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const contact = contacts[virtualRow.index];
            const target: SaveTarget = { type: "existing", id: contact.id };

            return (
              <div
                key={contact.id}
                role="row"
                className="ct-row ct-row-virtual"
                style={{ gridTemplateColumns, transform: `translateY(${virtualRow.start}px)` }}
              >
                {FIXED_COLUMNS.map((col) => (
                  <div key={col.key} role="cell">
                    {renderFixedCell(target, contact, col.key)}
                  </div>
                ))}
                {columns.map((col) => (
                  <div key={col.id} role="cell">
                    {renderCustomCell(target, contact, col)}
                  </div>
                ))}
                <div role="cell" className="ct-row-actions">
                  <button
                    type="button"
                    className="ct-icon-btn ct-icon-btn-danger"
                    onClick={() => onDelete(contact.id)}
                    aria-label={`Supprimer ${contact.nom}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
