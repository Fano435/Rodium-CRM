import { useMemo, useState } from "react";
import { useContacts } from "./hooks/useContacts";
import { useContactColumns } from "./hooks/useContactColumns";
import {
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useBulkCreateContacts,
} from "./hooks/useContactMutations";
import { ContactsToolbar } from "./components/ContactsToolbar";
import { ContactsTable } from "./components/ContactsTable";
import { BulkImportPanel } from "./components/BulkImportPanel";
import { validateFieldValue } from "./schema/contact.schema";
import { type ColumnKey, type SaveTarget, isCustomColumnKey, customColumnId } from "./types";
import type { Contact, CustomFields, UpdateContactPayload } from "../../services/contacts.api";
import { useReorderContactColumns } from "./hooks/useContactColumnMutations";
import "./contacts.css";

function getSortValue(contact: Contact, key: ColumnKey) {
  if (isCustomColumnKey(key)) {
    return contact.customFields[String(customColumnId(key))] ?? "";
  }
  return contact[key] ?? "";
}

export function ContactsView() {
  const { data: contacts = [], isLoading, isError } = useContacts();
  const { data: columns = [] } = useContactColumns();

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const bulkCreateContacts = useBulkCreateContacts();
  const reorderColumns = useReorderContactColumns();

  const [sortKey, setSortKey] = useState<ColumnKey>("nom");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const [draftContact, setDraftContact] = useState<UpdateContactPayload | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  function handleFilterChange(key: ColumnKey, value: string) {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === "") delete next[key];
      else next[key] = value;
      return next;
    });
  }

  const filteredContacts = useMemo(() => {
    const rows = contacts.filter((c) =>
      Object.entries(filters).every(([key, filterValue]) => {
        const actual = getSortValue(c, key as ColumnKey);
        if (key === "statut") return actual === filterValue;
        return String(actual).toLowerCase().includes(filterValue.toLowerCase());
      }),
    );

    return rows.sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).toLowerCase().localeCompare(String(bv).toLowerCase(), "fr") * dir;
    });
  }, [contacts, filters, sortKey, sortOrder]);

  function handleSort(key: ColumnKey) {
    if (key === sortKey) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortOrder("asc");
    }
  }

  function startDraft() {
    setImportOpen(false);
    setDraftContact({});
  }

  function cancelDraft() {
    setDraftContact(null);
  }

  function buildFieldPayload(
    field: ColumnKey,
    value: string | number | null,
    customFields?: CustomFields,
  ): UpdateContactPayload {
    if (isCustomColumnKey(field)) {
      return {
        customFields: {
          ...customFields,
          [String(customColumnId(field))]: value,
        },
      };
    }
    return { [field]: value } as UpdateContactPayload;
  }

  async function saveField(target: SaveTarget, field: ColumnKey, rawValue: string | number | null) {
    const value = validateFieldValue(field, columns, rawValue);

    if (target.type === "draft") {
      const payload = buildFieldPayload(field, value, draftContact?.customFields);
      const merged = { ...(draftContact ?? {}), ...payload };
      setDraftContact(merged);

      if (merged.nom && merged.telephone) {
        setDraftSaving(true);
        try {
          await createContact.mutateAsync(merged);
          setDraftContact(null);
        } finally {
          setDraftSaving(false);
        }
      }
      return;
    }

    const contact = contacts.find((c) => c.id === target.id);
    if (!contact) return;

    await updateContact.mutateAsync({
      id: target.id,
      payload: buildFieldPayload(field, value, contact.customFields),
    });
  }

  function handleDelete(id: number) {
    if (window.confirm("Supprimer ce contact ?")) {
      deleteContact.mutate(id);
    }
  }

  if (isLoading) return <p>Chargement des contacts...</p>;
  if (isError) return <p>Impossible de charger les contacts.</p>;

  return (
    <div className="cv-root">
      <ContactsToolbar
        columns={columns}
        onNewContact={startDraft}
        onOpenImport={() => {
          setDraftContact(null);
          setImportOpen(true);
        }}
      />

      {importOpen && (
        <BulkImportPanel
          columns={columns}
          onImport={(payloads) => bulkCreateContacts.mutate(payloads, { onSuccess: () => setImportOpen(false) })}
          onCancel={() => setImportOpen(false)}
          isSubmitting={bulkCreateContacts.isPending}
        />
      )}

      <ContactsTable
        contacts={filteredContacts}
        columns={columns}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        filters={filters}
        onFilterChange={handleFilterChange}
        draft={draftContact}
        draftSaving={draftSaving}
        onCancelDraft={cancelDraft}
        onSaveField={saveField}
        onDelete={handleDelete}
        onReorderColumns={(orderedIds) => reorderColumns.mutate(orderedIds)}
      />
    </div>
  );
}
