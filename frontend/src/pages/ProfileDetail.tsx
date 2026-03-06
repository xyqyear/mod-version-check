import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Filter,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import VersionMatrix from "@/components/VersionMatrix";
import DownloadModsModal from "@/components/DownloadModsModal";
import ModSearchModal from "@/components/ModSearchModal";
import { useProfile, useProfileMatrix } from "@/hooks/queries/useProfiles";
import {
  useDeleteProfile,
  useRemoveModFromProfile,
  useUpdateProfile,
} from "@/hooks/mutations/useProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const LOADER_VARIANTS: Record<string, string> = {
  fabric: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  forge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  neoforge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  quilt: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profileId = Number(id);
  const { canEdit } = useAuth();

  const { data: profile, isLoading: profileLoading } = useProfile(profileId);
  const { data: matrix, isLoading: matrixLoading } = useProfileMatrix(profileId);
  const deleteProfile = useDeleteProfile();
  const removeMod = useRemoveModFromProfile();
  const updateProfile = useUpdateProfile();
  const [searchOpen, setSearchOpen] = useState(false);
  const [downloadVersion, setDownloadVersion] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  if (profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-destructive">Profile not found</p>;
  }

  const handleRename = () => {
    const newName = editName.trim();
    if (newName && newName !== profile.name) {
      updateProfile.mutate(
        { id: profileId, data: { name: newName } },
        { onSuccess: () => toast.success("Profile renamed") },
      );
    }
    setEditing(false);
  };

  const handleGameVersionToggle = (version: string) => {
    const current = profile.game_versions ?? [];
    const updated = current.includes(version)
      ? current.filter((v) => v !== version)
      : [...current, version];
    updateProfile.mutate({
      id: profileId,
      data: { game_versions: updated.length > 0 ? updated : null },
    });
  };

  const allGameVersions = matrix?.all_game_versions ?? [];
  const selectedGameVersions = profile.game_versions ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="h-9 w-60"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleRename}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{profile.name}</h2>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditName(profile.name);
                    setEditing(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
          <Badge
            variant="outline"
            className={cn(LOADER_VARIANTS[profile.loader])}
          >
            {profile.loader}
          </Badge>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setSearchOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Mods
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    profile and remove all associated mod assignments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteProfile.mutate(profileId, {
                        onSuccess: () => {
                          toast.success("Profile deleted");
                          navigate("/");
                        },
                      });
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Game version filter */}
      {canEdit && (
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Game Versions:</span>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-50 justify-between">
                <span className="truncate">
                  {selectedGameVersions.length > 0
                    ? `${selectedGameVersions.length} selected`
                    : "All versions"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-55 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search versions..." />
                <CommandList>
                  <CommandEmpty>No version found.</CommandEmpty>
                  <CommandGroup>
                    {[...allGameVersions]
                      .sort((a, b) => {
                        const aSelected = selectedGameVersions.includes(a);
                        const bSelected = selectedGameVersions.includes(b);
                        if (aSelected === bSelected) return 0;
                        return aSelected ? -1 : 1;
                      })
                      .map((v) => (
                      <CommandItem
                        key={v}
                        value={v}
                        onSelect={() => handleGameVersionToggle(v)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedGameVersions.includes(v) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {v}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              {selectedGameVersions.length > 0 && (
                <div className="border-t p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() =>
                      updateProfile.mutate({
                        id: profileId,
                        data: { game_versions: null },
                      })
                    }
                  >
                    Clear filter
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Version Matrix */}
      <h3 className="text-lg font-semibold mt-6 mb-3">Version Matrix</h3>
      <VersionMatrix
        matrix={matrix}
        loading={matrixLoading}
        onDownload={setDownloadVersion}
      />

      {/* Mod list */}
      {profile.mods.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-8 mb-3">
            Mods ({profile.mods.length})
          </h3>
          <div className="rounded-md border divide-y">
            {profile.mods.map((mod) => (
              <div
                key={mod.id}
                className="flex items-center gap-3 p-3"
              >
                {mod.icon_url ? (
                  <img
                    src={mod.icon_url}
                    alt=""
                    className="h-10 w-10 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{mod.name}</div>
                  <div className="text-sm text-muted-foreground">{mod.slug}</div>
                </div>
                {canEdit && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {mod.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the mod from this profile. The mod will
                          remain in the registry.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            removeMod.mutate({ profileId, modId: mod.id })
                          }
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      <ModSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        profileId={profileId}
        profileLoader={profile.loader}
      />

      {downloadVersion && matrix && (
        <DownloadModsModal
          open={!!downloadVersion}
          onClose={() => setDownloadVersion(null)}
          mods={matrix.mods}
          gameVersion={downloadVersion}
          loader={profile.loader}
          profileName={profile.name}
        />
      )}
    </div>
  );
}
