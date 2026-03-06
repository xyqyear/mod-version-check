import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMod, deleteMod } from "@/hooks/api/mods";
import { queryKeys } from "@/lib/query-keys";
import type { ModCreate } from "@/types";

export const useCreateMod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ModCreate) => createMod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mods.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sync.status });
    },
  });
};

export const useDeleteMod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mods.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sync.status });
    },
  });
};
