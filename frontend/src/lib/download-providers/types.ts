export interface ModFileInfo {
  filename: string;
  url: string;
  size: number;
}

export interface DownloadProvider {
  name: string;
  getFileForVersion(
    projectId: string,
    loader: string,
    gameVersion: string,
  ): Promise<ModFileInfo | null>;
}
