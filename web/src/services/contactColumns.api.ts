import { httpClient } from "./httpClient";
import type { ColumnType } from "@generated/prisma/enums";

export type ContactColumn = {
  id: number;
  label: string;
  type: ColumnType;
  order: number;
  createdAt: string;
};

export type CreateContactColumnPayload = {
  label: string;
  type: ColumnType;
};

export type UpdateContactColumnPayload = {
  label: string;
};

export function fetchContactColumns(): Promise<ContactColumn[]> {
  return httpClient.get<ContactColumn[]>("/contact-columns");
}

export function createContactColumn(payload: CreateContactColumnPayload): Promise<ContactColumn> {
  return httpClient.post<ContactColumn>("/contact-columns", payload);
}

export function updateContactColumn(id: number, payload: UpdateContactColumnPayload): Promise<ContactColumn> {
  return httpClient.patch<ContactColumn>(`/contact-columns/${id}`, payload);
}

export function deleteContactColumn(id: number): Promise<void> {
  return httpClient.delete(`/contact-columns/${id}`);
}

export function reorderContactColumns(orderedIds: number[]): Promise<ContactColumn[]> {
  return httpClient.patch<ContactColumn[]>("/contact-columns/reorder", { orderedIds });
}
