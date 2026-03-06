import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VersionCell as VersionCellType } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  cell: VersionCellType;
  synced: boolean;
}

const VERSION_STYLES: Record<string, string> = {
  release: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  beta: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  alpha: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

export default function VersionCell({ cell, synced }: Props) {
  if (!cell.available && !synced) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Skeleton className="h-[22px] w-full rounded-full" />
        </TooltipTrigger>
        <TooltipContent>Waiting for sync</TooltipContent>
      </Tooltip>
    );
  }

  if (!cell.available) {
    return (
      <Badge variant="secondary" className="w-full justify-center font-normal">
        —
      </Badge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "w-full justify-center cursor-default",
            VERSION_STYLES[cell.version_type ?? ""] ?? VERSION_STYLES.release,
          )}
        >
          {cell.version_number}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <div>{cell.version_number}</div>
          <div className="capitalize">{cell.version_type}</div>
          {cell.date_published && (
            <div>{new Date(cell.date_published).toLocaleDateString()}</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
