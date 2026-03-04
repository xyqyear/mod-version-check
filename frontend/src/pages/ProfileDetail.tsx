import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  App,
  Button,
  List,
  Avatar,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import VersionMatrix from "@/components/VersionMatrix";
import ModSearchModal from "@/components/ModSearchModal";
import { useProfile, useProfileMatrix } from "@/hooks/queries/useProfiles";
import {
  useDeleteProfile,
  useRemoveModFromProfile,
} from "@/hooks/mutations/useProfiles";

const LOADER_COLORS: Record<string, string> = {
  fabric: "blue",
  forge: "orange",
  neoforge: "red",
  quilt: "purple",
};

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const profileId = Number(id);

  const { data: profile, isLoading: profileLoading } = useProfile(profileId);
  const { data: matrix, isLoading: matrixLoading } = useProfileMatrix(profileId);
  const deleteProfile = useDeleteProfile();
  const removeMod = useRemoveModFromProfile();
  const [searchOpen, setSearchOpen] = useState(false);

  if (profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return <Typography.Text type="danger">Profile not found</Typography.Text>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/")}
            type="text"
          />
          <Typography.Title level={2} className="mb-0!">
            {profile.name}
          </Typography.Title>
          <Tag color={LOADER_COLORS[profile.loader] ?? "default"}>
            {profile.loader}
          </Tag>
        </Space>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setSearchOpen(true)}
          >
            Add Mods
          </Button>
          <Popconfirm
            title="Delete this profile?"
            onConfirm={() => {
              deleteProfile.mutate(profileId, {
                onSuccess: () => {
                  message.success("Profile deleted");
                  navigate("/");
                },
              });
            }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Typography.Title level={4} className="mt-6!">
        Version Matrix
      </Typography.Title>
      <VersionMatrix matrix={matrix} loading={matrixLoading} />

      {profile.mods.length > 0 && (
        <>
          <Typography.Title level={4} className="mt-8!">
            Mods ({profile.mods.length})
          </Typography.Title>
          <List
            dataSource={profile.mods}
            renderItem={(mod) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="remove"
                    title={`Remove ${mod.name}?`}
                    onConfirm={() =>
                      removeMod.mutate({ profileId, modId: mod.id })
                    }
                  >
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    >
                      Remove
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    mod.icon_url ? (
                      <Avatar src={mod.icon_url} shape="square" />
                    ) : undefined
                  }
                  title={mod.name}
                  description={mod.slug}
                />
              </List.Item>
            )}
          />
        </>
      )}

      <ModSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        profileId={profileId}
        profileLoader={profile.loader}
      />
    </div>
  );
}
