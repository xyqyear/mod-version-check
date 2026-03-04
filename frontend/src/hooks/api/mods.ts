import { api } from "@/lib/api";
import type { Mod, ModCreate } from "@/types";

export const fetchMods = (search?: string) => {
  const searchParams = search ? { search } : undefined;
  return api.get("mods", { searchParams }).json<Mod[]>();
};

export const fetchMod = (id: number) =>
  api.get(`mods/${id}`).json<Mod>();

export const createMod = (data: ModCreate) =>
  api.post("mods", { json: data }).json<Mod>();

export const deleteMod = (id: number) =>
  api.delete(`mods/${id}`);
