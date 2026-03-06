import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import VersionCell from "@/components/VersionCell";
import type { ModRow, VersionMatrix as VersionMatrixType } from "@/types";

interface Props {
  matrix: VersionMatrixType | undefined;
  loading: boolean;
  onDownload?: (gameVersion: string) => void;
}

export default function VersionMatrix({ matrix, loading, onDownload }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!matrix || matrix.mods.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground">
        No mods added to this profile yet. Add mods to see version availability.
      </p>
    );
  }

  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-background min-w-[200px]">
              Mod
            </TableHead>
            {matrix.game_versions.map((gv) => (
              <TableHead key={gv} className="text-center min-w-[140px]">
                <div className="flex flex-col items-center gap-1">
                  <span>{gv}</span>
                  {onDownload && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(gv);
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download mods for {gv}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrix.mods.map((mod: ModRow) => (
            <TableRow key={mod.mod_id}>
              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                <div className="flex items-center gap-2">
                  {mod.icon_url && (
                    <img
                      src={mod.icon_url}
                      alt=""
                      className="h-6 w-6 rounded object-cover"
                    />
                  )}
                  <span>{mod.mod_name}</span>
                </div>
              </TableCell>
              {matrix.game_versions.map((gv) => {
                const cell = mod.versions[gv] ?? { available: false };
                return (
                  <TableCell key={gv} className="text-center">
                    <VersionCell cell={cell} />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
