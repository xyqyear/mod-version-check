import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";

const LOADER_VARIANTS: Record<string, string> = {
  fabric: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  forge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  neoforge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  quilt: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

interface Props {
  profile: Profile;
}

export default function ProfileCard({ profile }: Props) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => navigate(`/profiles/${profile.id}`)}
    >
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-lg">{profile.name}</span>
          <Badge
            variant="outline"
            className={cn(LOADER_VARIANTS[profile.loader])}
          >
            {profile.loader}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {profile.mod_count} {profile.mod_count === 1 ? "mod" : "mods"}
        </p>
      </CardContent>
    </Card>
  );
}
