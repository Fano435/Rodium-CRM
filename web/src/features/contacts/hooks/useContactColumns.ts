import { useQuery } from "@tanstack/react-query";
import { fetchContactColumns } from "../../../services/contactColumns.api";

export function useContactColumns() {
  return useQuery({
    queryKey: ["contact-columns"],
    queryFn: fetchContactColumns,
  });
}
