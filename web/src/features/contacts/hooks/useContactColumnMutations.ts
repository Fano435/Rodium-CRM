import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createContactColumn,
  updateContactColumn,
  deleteContactColumn,
  reorderContactColumns,
  type CreateContactColumnPayload,
  type UpdateContactColumnPayload,
} from "../../../services/contactColumns.api";

export function useCreateContactColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContactColumnPayload) => createContactColumn(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contact-columns"] }),
  });
}

export function useUpdateContactColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateContactColumnPayload }) =>
      updateContactColumn(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contact-columns"] }),
  });
}

export function useDeleteContactColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteContactColumn(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contact-columns"] }),
  });
}

export function useReorderContactColumns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => reorderContactColumns(orderedIds),
    // Mise a jour optimiste ici, exception a la regle "pas d'optimistic
    // update" qu'on s'etait fixee : sans ca, un drag-and-drop de colonne
    // reviendrait visuellement a sa position de depart le temps du
    // round-trip reseau avant de sauter a sa position finale — un
    // va-et-vient assez génant pour ce geste précis, contrairement au
    // clic simple sur un bouton.
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["contact-columns"] });
      const previous = queryClient.getQueryData<import("../../../services/contactColumns.api").ContactColumn[]>([
        "contact-columns",
      ]);
      if (previous) {
        const byId = new Map(previous.map((c) => [c.id, c]));
        const reordered = orderedIds
          .map((id, index) => {
            const col = byId.get(id);
            return col ? { ...col, order: index } : null;
          })
          .filter((c): c is NonNullable<typeof c> => c !== null);
        queryClient.setQueryData(["contact-columns"], reordered);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["contact-columns"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["contact-columns"] }),
  });
}
