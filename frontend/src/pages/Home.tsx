import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileCard from "@/components/ProfileCard";
import CreateProfileModal from "@/components/CreateProfileModal";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { useCreateProfile } from "@/hooks/mutations/useProfiles";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { data: profiles, isLoading } = useProfiles();
  const createProfile = useCreateProfile();
  const [modalOpen, setModalOpen] = useState(false);
  const { canEdit } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Profiles</h2>
        {canEdit && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Profile
          </Button>
        )}
      </div>

      {profiles && profiles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <p className="text-center py-12 text-muted-foreground">
          No profiles yet. Create one to start tracking mod versions.
        </p>
      )}

      <CreateProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          createProfile.mutate(data, {
            onSuccess: () => setModalOpen(false),
          });
        }}
        loading={createProfile.isPending}
      />
    </div>
  );
}
