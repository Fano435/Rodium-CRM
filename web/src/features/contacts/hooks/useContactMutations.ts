import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkCreateContacts, createContact, deleteContact, updateContact, type CreateContactPayload, type UpdateContactPayload } from "../../../services/contacts.api";

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContactPayload) => createContact(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateContactPayload }) => updateContact(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteContact(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useBulkCreateContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payloads: CreateContactPayload[]) => bulkCreateContacts(payloads),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}
