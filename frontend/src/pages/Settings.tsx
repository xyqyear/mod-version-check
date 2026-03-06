import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useProfiles } from "@/hooks/queries/useProfiles";
import { useMods } from "@/hooks/queries/useMods";
import { useDeleteProfile } from "@/hooks/mutations/useProfiles";
import { useDeleteMod } from "@/hooks/mutations/useMods";
import { cn } from "@/lib/utils";

const LOADER_VARIANTS: Record<string, string> = {
  fabric: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  forge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  neoforge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  quilt: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

export default function Settings() {
  const { data: profiles } = useProfiles();
  const { data: mods } = useMods();
  const deleteProfile = useDeleteProfile();
  const deleteMod = useDeleteMod();

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-6">Settings</h2>

      <Tabs defaultValue="profiles">
        <TabsList>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="mods">Mods Registry</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          <Card>
            <CardContent>
              {(!profiles || profiles.length === 0) ? (
                <p className="text-center py-8 text-muted-foreground">No profiles</p>
              ) : (
                <div className="divide-y">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{profile.name}</span>
                          <Badge
                            variant="outline"
                            className={cn(LOADER_VARIANTS[profile.loader])}
                          >
                            {profile.loader}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {profile.mod_count} mods
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {profile.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteProfile.mutate(profile.id, {
                                  onSuccess: () => toast.success("Profile deleted"),
                                })
                              }
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mods">
          <Card>
            <CardContent>
              {(!mods || mods.length === 0) ? (
                <p className="text-center py-8 text-muted-foreground">
                  No mods registered
                </p>
              ) : (
                <div className="divide-y">
                  {mods.map((mod) => (
                    <div key={mod.id} className="flex items-center gap-3 py-3">
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{mod.slug}</span>
                          {mod.modrinth_id && <Badge variant="secondary">Modrinth</Badge>}
                          {mod.curseforge_id && <Badge variant="secondary">CurseForge</Badge>}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {mod.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteMod.mutate(mod.id, {
                                  onSuccess: () => toast.success("Mod deleted"),
                                })
                              }
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
