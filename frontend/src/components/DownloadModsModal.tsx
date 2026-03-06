import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Download,
  FastForward,
  Loader2,
  MinusCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ModRow } from "@/types";
import {
  downloadModsForVersion,
  type DownloadPhase,
  type DownloadProgress,
  type ModDownloadState,
  type ModDownloadStatus,
} from "@/lib/download-service";

interface Props {
  open: boolean;
  onClose: () => void;
  mods: ModRow[];
  gameVersion: string;
  loader: string;
  profileName: string;
}

const PHASE_LABELS: Record<DownloadPhase, string> = {
  resolving: "Resolving mod files...",
  downloading: "Downloading mods...",
  zipping: "Creating zip archive...",
  done: "Complete!",
};

function StatusIcon({ status }: { status: ModDownloadStatus }) {
  switch (status) {
    case "pending":
      return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
    case "resolving":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "downloading":
      return <Download className="h-4 w-4 text-blue-500" />;
    case "done":
      return <Check className="h-4 w-4 text-green-500" />;
    case "skipped":
      return <FastForward className="h-4 w-4 text-yellow-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
}

export default function DownloadModsModal({
  open,
  onClose,
  mods,
  gameVersion,
  loader,
  profileName,
}: Props) {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [running, setRunning] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);

    await downloadModsForVersion(
      mods,
      gameVersion,
      loader,
      setProgress,
      controller.signal,
    );

    setRunning(false);
  }, [mods, gameVersion, loader]);

  useEffect(() => {
    if (open) {
      setProgress(null);
      start();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [open, start]);

  const handleClose = () => {
    if (running) {
      setConfirmCancel(true);
    } else {
      onClose();
    }
  };

  const handleConfirmCancel = () => {
    abortRef.current?.abort();
    setRunning(false);
    setConfirmCancel(false);
    onClose();
  };

  const handleDownloadZip = () => {
    if (!progress?.zipBlob) return;
    const url = URL.createObjectURL(progress.zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profileName}-${loader}-${gameVersion}-mods.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const modStates = progress?.mods ?? [];
  const phase = progress?.phase ?? "resolving";
  const overall = progress?.overallProgress ?? 0;
  const doneCount = modStates.filter((m) => m.status === "done").length;
  const totalCount = modStates.length;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="sm:max-w-[520px]" onInteractOutside={(e) => running && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Download mods for {gameVersion}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {PHASE_LABELS[phase]}
            </p>
            <Progress value={Math.round(overall)} />
            {phase === "done" && (
              <p className="text-xs text-muted-foreground">
                {doneCount} of {totalCount} mods downloaded
              </p>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {modStates.map((mod: ModDownloadState) => (
              <div
                key={mod.modName}
                className="flex items-center gap-2 py-1 px-1"
              >
                <StatusIcon status={mod.status} />
                <span className="flex-1 truncate text-sm">{mod.modName}</span>
                {mod.status === "downloading" && (
                  <Progress
                    value={mod.progress}
                    className="w-20 h-2"
                  />
                )}
                {mod.status === "skipped" && (
                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                    {mod.error ?? "Skipped"}
                  </Badge>
                )}
                {mod.status === "error" && (
                  <Badge variant="destructive" className="text-xs">
                    {mod.error ?? "Error"}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {progress?.zipBlob && (
            <DialogFooter>
              <Button onClick={handleDownloadZip}>
                <Download className="mr-2 h-4 w-4" />
                Download Zip ({doneCount} mods)
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel download?</AlertDialogTitle>
            <AlertDialogDescription>
              The download is still in progress. Are you sure you want to cancel?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              Cancel Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
