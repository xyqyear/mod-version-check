import { useQuery } from "@tanstack/react-query";
import { fetchSyncStatus } from "@/hooks/api/sync";
import { queryKeys } from "@/lib/query-keys";

export const useSyncStatus = () =>
  useQuery({
    queryKey: queryKeys.sync.status,
    queryFn: fetchSyncStatus,
    refetchInterval: 30_000,
  });
