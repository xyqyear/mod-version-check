import { useMutation, useQueryClient } from "@tanstack/react-query";
import { triggerSync } from "@/hooks/api/sync";
import { queryKeys } from "@/lib/query-keys";

export const useTriggerSync = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerSync,
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.sync.status });
      }, 2000);
    },
  });
};
