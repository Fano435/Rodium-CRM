import { useMemo, useState } from "react";
import { StatutContact } from "@generated/prisma/enums";
import { useContacts } from "./hooks/useContacts";
import { useContactColumns } from "./hooks/useContactColumns";
import {
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useBulkCreateContacts,
} from "./hooks/useContactMutations";
import { ContactsToolbar } from "./components/ContactsToolbar";
import {
  ContactsTable,
  type FieldRef,
  type SaveTarget,
  type SortKey,
  type FilterKey,
} from "./components/ContactsTable";
import { BulkImportPanel } from "./components/BulkImportPanel";
import { validateFieldValue } from "./schema/contact.schema";
import "./contacts.css";
import type { Contact, CustomFields } from "../../services/contacts.api";
import { useReorderContactColumns } from "./hooks/useContactColumnMutations";

type DraftContact = {
  nom?: string;
  entreprise?: string | null;
  telephone?: string;
  score?: number | null;
  statut?: StatutContact;
  customFields?: CustomFields;
};


function getSortValue(contact: Contact, key: SortKey) {
  if (key.startsWith("custom:")) {
    const columnId = key.slice("custom:".length);
    return contact.customFields[columnId] ?? "";
  }
  return contact[key as "nom" | "entreprise" | "telephone" | "score" | "statut"] ?? "";
}

export function ContactsView() {
  const { data: contacts = [], isLoading, isError } = useContacts();
  const { data: columns = [] } = useContactColumns();

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const bulkCreateContacts = useBulkCreateContacts();
  const reorderColumns = useReorderContactColumns();

  const [sortKey, setSortKey] = useState<SortKey>("nom");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const [draftContact, setDraftContact] = useState<DraftContact | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  function handleFilterChange(key: FilterKey, value: string) {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === "") delete next[key];
      else next[key] = value;
      return next;
    });
  }

  const filteredContacts = useMemo(() => {
    let rows = contacts.filter((c) =>
      Object.entries(filters).every(([key, filterValue]) => {
        const actual = getSortValue(c, key as SortKey);
        if (key === "statut") return actual === filterValue;
        return String(actual).toLowerCase().includes(filterValue.toLowerCase());
      }),
    );

    rows = [...rows].sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).toLowerCase().localeCompare(String(bv).toLowerCase(), "fr") * dir;
    });

    return rows;
  }, [contacts, filters, sortKey, sortOrder]);

  function handleSort(key: SortKey) {
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

  async function saveField(target: SaveTarget, field: FieldRef, rawValue: string | number | null) {
    const parsedValue = validateFieldValue(field, columns, rawValue);

    if (target.type === "draft") {
      const merged: DraftContact = { ...(draftContact ?? {}) };
      if (field.kind === "fixed") {
        (merged as Record<string, unknown>)[field.key] = parsedValue;
      } else {
        merged.customFields = {
          ...(merged.customFields ?? {}),
          [String(field.columnId)]: parsedValue,
        };
      }
      setDraftContact(merged);

      if (merged.nom && merged.telephone) {
        setDraftSaving(true);
        try {
          await createContact.mutateAsync({
            nom: merged.nom,
            telephone: merged.telephone,
            entreprise: merged.entreprise ?? undefined,
            score: merged.score ?? undefined,
            statut: merged.statut,
            customFields: merged.customFields,
          });
          setDraftContact(null);
        } finally {
          setDraftSaving(false);
        }
      }
      return;
    }

    // Contact existant : PATCH immediat, un champ a la fois.
    const contact = contacts.find((c) => c.id === target.id);
    if (!contact) return;

    if (field.kind === "fixed") {
      await updateContact.mutateAsync({ id: target.id, payload: { [field.key]: parsedValue } });
    } else {
      // customFields est un JSON remplace en entier par le backend — on
      // fusionne donc avec les valeurs existantes avant d'envoyer, sinon
      // modifier UNE colonne dynamique effacerait toutes les autres.
      const mergedCustomFields: CustomFields = {
        ...contact.customFields,
        [String(field.columnId)]: parsedValue,
      };
      await updateContact.mutateAsync({
        id: target.id,
        payload: { customFields: mergedCustomFields },
      });
    }
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
