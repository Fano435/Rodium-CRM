import type { ContactModel } from "@generated/prisma/models";

export type FixedFieldKey = keyof Omit<ContactModel, "id" | "createdAt" | "customFields">;

export type ColumnKey = FixedFieldKey | `custom:${number}`;

export function isCustomColumnKey(key: ColumnKey): key is `custom:${number}` {
  return key.startsWith("custom:");
}
export function customColumnId(key: `custom:${number}`): number {
  return Number(key.slice("custom:".length));
}
export function customColumnKey(columnId: number): `custom:${number}` {
  return `custom:${columnId}`;
}

export type SaveTarget = { type: "draft" } | { type: "existing"; id: number };