import { Card, Tag, Typography } from "antd";
import { useNavigate } from "react-router";
import type { Profile } from "@/types";

const LOADER_COLORS: Record<string, string> = {
  fabric: "blue",
  forge: "orange",
  neoforge: "red",
  quilt: "purple",
};

interface Props {
  profile: Profile;
}

export default function ProfileCard({ profile }: Props) {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      onClick={() => navigate(`/profiles/${profile.id}`)}
      className="cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <Typography.Text strong className="text-lg">
          {profile.name}
        </Typography.Text>
        <Tag color={LOADER_COLORS[profile.loader] ?? "default"}>
          {profile.loader}
        </Tag>
      </div>
      <Typography.Text type="secondary">
        {profile.mod_count} {profile.mod_count === 1 ? "mod" : "mods"}
      </Typography.Text>
    </Card>
  );
}
