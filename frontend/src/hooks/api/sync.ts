import { api } from "@/lib/api";
import type { SyncStatus } from "@/types";

export const fetchSyncStatus = () =>
  api.get("sync/status").json<SyncStatus | null>();

export const triggerSync = () =>
  api.post("sync/trigger").json<{ message: string }>();
