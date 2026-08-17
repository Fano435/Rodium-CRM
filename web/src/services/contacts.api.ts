import { httpClient } from "./httpClient";
import type { ContactModel } from "@generated/prisma/models";
import type { StatutContact } from "@generated/prisma/enums";

export type CustomFieldValue = string | number | null;
export type CustomFields = Record<string, CustomFieldValue>;

export type Contact = Omit<ContactModel, "createdAt" | "customFields"> & {
  createdAt: string;
  customFields: CustomFields;
};

export type CreateContactPayload = {
  nom: string;
  telephone: string;
  entreprise?: string | null;
  score?: number;
  statut?: StatutContact;
  customFields?: CustomFields;
};

export type UpdateContactPayload = Partial<CreateContactPayload>;

export function fetchContacts(): Promise<Contact[]> {
  return httpClient.get<Contact[]>("/contacts");
}

export function createContact(payload: CreateContactPayload): Promise<Contact> {
  return httpClient.post<Contact>("/contacts", payload);
}

export function updateContact(id: number, payload: UpdateContactPayload): Promise<Contact> {
  return httpClient.patch<Contact>(`/contacts/${id}`, payload);
}

export function deleteContact(id: number): Promise<void> {
  return httpClient.delete(`/contacts/${id}`);
}

export function bulkCreateContacts(payloads: CreateContactPayload[]): Promise<Contact[]> {
  return httpClient.post<Contact[]>("/contacts/bulk", payloads);
}
