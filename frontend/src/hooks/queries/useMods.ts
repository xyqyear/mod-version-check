import { useQuery } from "@tanstack/react-query";
import { fetchMods } from "@/hooks/api/mods";
import { queryKeys } from "@/lib/query-keys";

export const useMods = () =>
  useQuery({
    queryKey: queryKeys.mods.all,
    queryFn: () => fetchMods(),
  });
