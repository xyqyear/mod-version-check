import type { DownloadProvider } from "./types";
import { modrinthProvider } from "./modrinth";

export type { DownloadProvider, ModFileInfo } from "./types";

const providers: Record<string, DownloadProvider> = {
  modrinth: modrinthProvider,
};

export function getDownloadProvider(
  name: string,
): DownloadProvider | undefined {
  return providers[name];
}
