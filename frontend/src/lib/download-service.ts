import { zip } from "fflate";
import { getDownloadProvider, type ModFileInfo } from "./download-providers";
import type { ModRow } from "@/types";

export type ModDownloadStatus =
  | "pending"
  | "resolving"
  | "downloading"
  | "done"
  | "skipped"
  | "error";

export interface ModDownloadState {
  modId: number;
  modName: string;
  status: ModDownloadStatus;
  progress: number;
  error?: string;
}

export type DownloadPhase = "resolving" | "downloading" | "zipping" | "done";

export interface DownloadProgress {
  mods: ModDownloadState[];
  overallProgress: number;
  phase: DownloadPhase;
  zipBlob?: Blob;
}

type ProgressCallback = (progress: DownloadProgress) => void;

interface ResolvedMod {
  modId: number;
  modName: string;
  file: ModFileInfo;
}

function getProviderForMod(
  mod: ModRow,
): { provider: ReturnType<typeof getDownloadProvider>; projectId: string } | null {
  if (mod.modrinth_id) {
    const provider = getDownloadProvider("modrinth");
    if (provider) return { provider, projectId: mod.modrinth_id };
  }
  return null;
}

export async function downloadModsForVersion(
  mods: ModRow[],
  gameVersion: string,
  loader: string,
  onProgress: ProgressCallback,
  signal?: AbortSignal,
): Promise<void> {
  const availableMods = mods.filter(
    (m) => m.versions[gameVersion]?.available,
  );

  const states: ModDownloadState[] = availableMods.map((m) => ({
    modId: m.mod_id,
    modName: m.mod_name,
    status: "pending",
    progress: 0,
  }));

  const emit = (phase: DownloadPhase, zipBlob?: Blob) => {
    const total = states.length;
    const done = states.filter(
      (s) => s.status === "done" || s.status === "skipped" || s.status === "error",
    ).length;
    const downloading = states.find((s) => s.status === "downloading");
    const downloadingProgress = downloading?.progress ?? 0;
    const overallProgress =
      total === 0 ? 100 : ((done + downloadingProgress / 100) / total) * 100;

    onProgress({
      mods: [...states],
      overallProgress: phase === "done" ? 100 : Math.min(overallProgress, 99),
      phase,
      zipBlob,
    });
  };

  // Phase 1: Resolve file URLs
  const resolved: ResolvedMod[] = [];

  for (let i = 0; i < availableMods.length; i++) {
    if (signal?.aborted) return;

    const mod = availableMods[i];
    const state = states[i];
    const match = getProviderForMod(mod);

    if (!match || !match.provider) {
      state.status = "skipped";
      state.error = "No download provider";
      emit("resolving");
      continue;
    }

    state.status = "resolving";
    emit("resolving");

    try {
      const file = await match.provider.getFileForVersion(
        match.projectId,
        loader,
        gameVersion,
      );

      if (!file) {
        state.status = "skipped";
        state.error = "File not found";
        emit("resolving");
        continue;
      }

      resolved.push({ modId: mod.mod_id, modName: mod.mod_name, file });
      state.status = "pending";
      emit("resolving");
    } catch (err) {
      state.status = "error";
      state.error = err instanceof Error ? err.message : "Resolve failed";
      emit("resolving");
    }
  }

  if (resolved.length === 0) {
    emit("done");
    return;
  }

  // Phase 2: Download files
  const files: Record<string, Uint8Array> = {};

  for (const mod of resolved) {
    if (signal?.aborted) return;

    const state = states.find((s) => s.modId === mod.modId)!;
    state.status = "downloading";
    state.progress = 0;
    emit("downloading");

    try {
      const response = await fetch(mod.file.url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        state.progress = mod.file.size > 0
          ? Math.round((received / mod.file.size) * 100)
          : 50;
        emit("downloading");
      }

      const data = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.length;
      }

      files[mod.file.filename] = data;
      state.status = "done";
      state.progress = 100;
      emit("downloading");
    } catch (err) {
      if (signal?.aborted) return;
      state.status = "error";
      state.error = err instanceof Error ? err.message : "Download failed";
      emit("downloading");
    }
  }

  if (Object.keys(files).length === 0) {
    emit("done");
    return;
  }

  // Phase 3: Create zip
  emit("zipping");

  const zipData = await new Promise<Uint8Array>((resolve, reject) => {
    const input: Record<string, [Uint8Array, { level: 0 }]> = {};
    for (const [name, data] of Object.entries(files)) {
      input[name] = [data, { level: 0 }];
    }
    zip(input, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const zipBlob = new Blob([zipData.buffer as ArrayBuffer], { type: "application/zip" });
  emit("done", zipBlob);
}
