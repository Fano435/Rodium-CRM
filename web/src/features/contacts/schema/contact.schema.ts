import { z } from "zod";
import { StatutContact, ColumnType } from "@generated/prisma/enums";
import { normalizePhone, normalizeTitleCase } from "../utils/normalize";
import { type ColumnKey, type FixedFieldKey, isCustomColumnKey, customColumnId } from "../types";
import type { ContactColumn } from "../../../services/contactColumns.api";

const baseContactSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire").transform(normalizeTitleCase),

  telephone: z
    .string()
    .trim()
    .min(1, "Le telephone est obligatoire")
    .transform((val, ctx) => {
      try {
        return normalizePhone(val);
      } catch (e) {
        ctx.addIssue({ code: "custom", message: e instanceof Error ? e.message : "Numero invalide" });
        return z.NEVER;
      }
    }),

  entreprise: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),

  score: z.number().int().min(0).default(0),
  statut: z.enum(StatutContact).default(StatutContact.PROSPECT),
});

function zodForColumnType(type: ColumnType) {
  switch (type) {
    case ColumnType.NUMBER:
      return z.number({ error: "Doit etre un nombre" }).nullable();
    case ColumnType.DATE:
      return z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ)")
        .nullable();
    case ColumnType.TEXT:
    default:
      return z.string().nullable();
  }
}

export function buildContactSchema(columns: ContactColumn[]) {
  const customFieldsShape: Record<string, z.ZodTypeAny> = {};
  for (const col of columns) {
    customFieldsShape[String(col.id)] = zodForColumnType(col.type).optional();
  }
  return baseContactSchema.extend({
    customFields: z.object(customFieldsShape).default({}),
  });
}

export function buildBulkImportSchema(columns: ContactColumn[]) {
  return z.array(buildContactSchema(columns)).min(1, "Le tableau est vide");
}

export function fieldSchemaFor(key: FixedFieldKey) {
  return baseContactSchema.shape[key];
}

export function customFieldSchemaFor(column: ContactColumn) {
  return zodForColumnType(column.type);
}

export function validateFieldValue(
  field: ColumnKey,
  columns: ContactColumn[],
  rawValue: string | number | null,
): string | number | null {
  try {
    if (isCustomColumnKey(field)) {
      const columnId = customColumnId(field);
      const column = columns.find((c) => c.id === columnId);
      if (!column) throw new Error("Colonne introuvable");
      return customFieldSchemaFor(column).parse(rawValue);
    }
    return fieldSchemaFor(field).parse(rawValue);
  } catch (e) {
    if (e instanceof z.ZodError) throw new Error(e.issues[0]?.message ?? "Valeur invalide");
    throw e;
  }
}
