import { useQuery } from "@tanstack/react-query";
import { searchMods } from "@/hooks/api/search";
import { queryKeys } from "@/lib/query-keys";

export const useSearchMods = (query: string, loader?: string) =>
  useQuery({
    queryKey: queryKeys.search.mods(query),
    queryFn: () => searchMods(query, loader),
    enabled: query.length >= 2,
  });
