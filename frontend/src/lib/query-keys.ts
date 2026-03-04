export const queryKeys = {
  profiles: {
    all: ["profiles"] as const,
    detail: (id: number) => ["profiles", id] as const,
    matrix: (id: number) => ["profiles", id, "matrix"] as const,
  },
  mods: {
    all: ["mods"] as const,
    detail: (id: number) => ["mods", id] as const,
  },
  search: {
    mods: (query: string) => ["search", "mods", query] as const,
  },
  sync: {
    status: ["sync", "status"] as const,
  },
};
