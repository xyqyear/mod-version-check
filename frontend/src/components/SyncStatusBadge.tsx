import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSyncStatus } from "@/hooks/queries/useSync";
import { useTriggerSync } from "@/hooks/mutations/useSync";
import { useAuth } from "@/contexts/AuthContext";

export default function SyncStatusBadge() {
  const { data: syncStatus } = useSyncStatus();
  const { mutate: trigger, isPending } = useTriggerSync();
  const { canEdit } = useAuth();

  const isRunning = syncStatus?.status === "running";

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString();
  };

  const tooltipText = isRunning
    ? "Sync in progress..."
    : syncStatus?.completed_at
      ? `Last synced: ${formatTime(syncStatus.completed_at)}`
      : "Never synced";

  const variant =
    isRunning
      ? "secondary"
      : syncStatus?.status === "completed"
        ? "outline"
        : syncStatus?.status === "failed"
          ? "destructive"
          : "secondary";

  const label = isRunning
    ? "Syncing..."
    : syncStatus?.status === "completed"
      ? `Synced (${syncStatus.mods_checked} mods)`
      : syncStatus?.status === "failed"
        ? "Sync failed"
        : "";

  return (
    <div className="flex items-center gap-2">
      {syncStatus && label && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={variant} className="cursor-default">
              {isRunning && (
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              )}
              {label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      )}
      {canEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => trigger()}
              disabled={isRunning || isPending}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRunning || isPending ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Trigger sync</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Trigger sync</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
