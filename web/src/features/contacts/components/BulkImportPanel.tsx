import { useState } from "react";
import { buildBulkImportSchema } from "../schema/contact.schema";
import type { CreateContactPayload } from "../../../services/contacts.api";
import type { ContactColumn } from "../../../services/contactColumns.api";

type BulkImportPanelProps = {
  columns: ContactColumn[];
  onImport: (payloads: CreateContactPayload[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export function BulkImportPanel({ columns, onImport, onCancel, isSubmitting }: BulkImportPanelProps) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleImport() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setError("Le texte colle n'est pas du JSON valide.");
      return;
    }

    const result = buildBulkImportSchema(columns).safeParse(parsed);
    if (!result.success) {
      const first = result.error.issues[0];
      const path = first.path.join(".") || "valeur";
      setError(`Ligne invalide (${path}) : ${first.message}`);
      return;
    }

    setError(null);
    onImport(result.data as CreateContactPayload[]);
  }

  return (
    <div className="bip-panel">
      <p className="bip-hint">
        Collez un tableau JSON de contacts, au format{" "}
        <code>{`[{ "nom": "...", "telephone": "...", "customFields": { "3": "Rennes" } }]`}</code>
      </p>

      <textarea className="bip-textarea" value={raw} onChange={(e) => setRaw(e.target.value)} rows={10} />

      {error && (
        <p className="bip-error" role="alert">
          {error}
        </p>
      )}

      <div className="bip-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleImport}
          disabled={isSubmitting || raw.trim() === ""}
        >
          Importer
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  );
}
