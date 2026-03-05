import type { DownloadProvider, ModFileInfo } from "./types";

const MODRINTH_API = "https://api.modrinth.com/v2";
const VERSION_TYPE_PRIORITY: Record<string, number> = {
  release: 0,
  beta: 1,
  alpha: 2,
};

interface ModrinthFile {
  url: string;
  filename: string;
  primary: boolean;
  size: number;
}

interface ModrinthVersion {
  version_type: string;
  date_published: string;
  files: ModrinthFile[];
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const modrinthProvider: DownloadProvider = {
  name: "modrinth",

  async getFileForVersion(
    projectId: string,
    loader: string,
    gameVersion: string,
  ): Promise<ModFileInfo | null> {
    const params = new URLSearchParams({
      loaders: JSON.stringify([loader]),
      game_versions: JSON.stringify([gameVersion]),
    });

    await delay(200);

    const res = await fetch(
      `${MODRINTH_API}/project/${projectId}/version?${params}`,
    );
    if (!res.ok) return null;

    const versions: ModrinthVersion[] = await res.json();
    if (versions.length === 0) return null;

    const best = versions.reduce((a, b) => {
      const pa = VERSION_TYPE_PRIORITY[a.version_type] ?? 3;
      const pb = VERSION_TYPE_PRIORITY[b.version_type] ?? 3;
      if (pa !== pb) return pa < pb ? a : b;
      return new Date(a.date_published) >= new Date(b.date_published) ? a : b;
    });

    const file = best.files.find((f) => f.primary) ?? best.files[0];
    if (!file) return null;

    return { filename: file.filename, url: file.url, size: file.size };
  },
};
