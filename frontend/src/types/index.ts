export type LoaderType = "forge" | "fabric" | "neoforge" | "quilt";

export interface Profile {
  id: number;
  name: string;
  loader: LoaderType;
  mod_count: number;
  created_at: string;
}

export interface ProfileDetail {
  id: number;
  name: string;
  loader: LoaderType;
  created_at: string;
  updated_at: string;
  mods: ModSummary[];
}

export interface ModSummary {
  id: number;
  name: string;
  slug: string;
  icon_url: string | null;
}

export interface Mod {
  id: number;
  name: string;
  slug: string;
  icon_url: string | null;
  modrinth_id: string | null;
  curseforge_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface SearchModHit {
  provider: string;
  project_id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string | null;
  downloads: number;
  loaders: string[];
  game_versions: string[];
  existing_mod_id: number | null;
}

export interface SearchResponse {
  hits: SearchModHit[];
  total_hits: number;
  offset: number;
  limit: number;
}

export interface VersionCell {
  available: boolean;
  version_number?: string;
  version_type?: string;
  date_published?: string;
}

export interface ModRow {
  mod_id: number;
  mod_name: string;
  icon_url: string | null;
  versions: Record<string, VersionCell>;
}

export interface VersionMatrix {
  game_versions: string[];
  mods: ModRow[];
  last_synced_at: string | null;
}

export interface SyncStatus {
  id: number;
  started_at: string;
  completed_at: string | null;
  mods_checked: number;
  status: string;
  error_message: string | null;
}

export interface ProfileCreate {
  name: string;
  loader: LoaderType;
}

export interface ProfileUpdate {
  name?: string;
  loader?: LoaderType;
}

export interface ModCreate {
  name: string;
  slug: string;
  icon_url?: string | null;
  modrinth_id?: string | null;
  curseforge_id?: number | null;
}
