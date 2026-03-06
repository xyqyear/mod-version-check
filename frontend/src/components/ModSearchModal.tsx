import { useCallback, useState } from "react";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchMods } from "@/hooks/queries/useSearch";
import { useCreateMod } from "@/hooks/mutations/useMods";
import { useAddModToProfile } from "@/hooks/mutations/useProfiles";
import type { SearchModHit } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  profileId: number;
  profileLoader: string;
}

export default function ModSearchModal({
  open,
  onClose,
  profileId,
  profileLoader,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout>>();

  const { data: searchResult, isLoading } = useSearchMods(debouncedQuery, profileLoader);
  const createMod = useCreateMod();
  const addMod = useAddModToProfile();

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => setDebouncedQuery(value), 400);
      setDebounceTimer(timer);
    },
    [debounceTimer],
  );

  const handleAdd = async (hit: SearchModHit) => {
    try {
      let modId = hit.existing_mod_id;

      if (!modId) {
        const mod = await createMod.mutateAsync({
          name: hit.name,
          slug: hit.slug,
          icon_url: hit.icon_url,
          modrinth_id: hit.provider === "modrinth" ? hit.project_id : undefined,
        });
        modId = mod.id;
      }

      await addMod.mutateAsync({ profileId, modId });
      toast.success(`Added ${hit.name}`);
    } catch {
      toast.error(`Failed to add ${hit.name}`);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Search & Add Mods</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search mods (e.g., sodium, lithium...)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && !debouncedQuery && (
            <p className="text-center py-8 text-muted-foreground text-sm">
              Type to search
            </p>
          )}
          {!isLoading && debouncedQuery && searchResult?.hits.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">
              No mods found
            </p>
          )}
          {searchResult?.hits.map((hit) => (
            <div
              key={`${hit.provider}-${hit.project_id}`}
              className="flex items-center gap-3 rounded-md p-3 hover:bg-accent/50"
            >
              {hit.icon_url ? (
                <img
                  src={hit.icon_url}
                  alt=""
                  className="h-10 w-10 rounded object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{hit.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {hit.provider}
                  </Badge>
                  {hit.existing_mod_id && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      registered
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {hit.description}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleAdd(hit)}
                disabled={createMod.isPending || addMod.isPending}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
