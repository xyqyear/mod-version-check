import { api } from "@/lib/api";
import type { SearchResponse } from "@/types";

export const searchMods = (
  query: string,
  loader?: string,
  gameVersion?: string,
  provider?: string,
) => {
  const searchParams: Record<string, string> = { query };
  if (loader) searchParams.loader = loader;
  if (gameVersion) searchParams.game_version = gameVersion;
  if (provider) searchParams.provider = provider;
  return api.get("search/mods", { searchParams }).json<SearchResponse>();
};
