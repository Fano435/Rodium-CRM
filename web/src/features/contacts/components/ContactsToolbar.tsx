import type { ContactColumn } from "../../../services/contactColumns.api";
import { ColumnManagerMenu } from "./ColumnManagerMenu";

type ContactsToolbarProps = {
  columns: ContactColumn[];
  onNewContact: () => void;
  onOpenImport: () => void;
};

export function ContactsToolbar({ columns, onNewContact, onOpenImport }: ContactsToolbarProps) {
  return (
    <div className="ctb-toolbar">
      <ColumnManagerMenu columns={columns} />
      <button type="button" className="btn" onClick={onOpenImport}>
        Importer
      </button>
      <button type="button" className="btn btn-primary" onClick={onNewContact}>
        Nouveau contact
      </button>
    </div>
  );
}
