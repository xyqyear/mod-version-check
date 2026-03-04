import {
  App,
  Avatar,
  Button,
  Card,
  List,
  Popconfirm,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { useMods } from "@/hooks/queries/useMods";
import { useDeleteProfile } from "@/hooks/mutations/useProfiles";
import { useDeleteMod } from "@/hooks/mutations/useMods";

const LOADER_COLORS: Record<string, string> = {
  fabric: "blue",
  forge: "orange",
  neoforge: "red",
  quilt: "purple",
};

export default function Settings() {
  const { message } = App.useApp();
  const { data: profiles } = useProfiles();
  const { data: mods } = useMods();
  const deleteProfile = useDeleteProfile();
  const deleteMod = useDeleteMod();

  return (
    <div>
      <Typography.Title level={2}>Settings</Typography.Title>

      <Tabs
        items={[
          {
            key: "profiles",
            label: "Profiles",
            children: (
              <Card>
                <List
                  dataSource={profiles ?? []}
                  locale={{ emptyText: "No profiles" }}
                  renderItem={(profile) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="delete"
                          title={`Delete ${profile.name}?`}
                          onConfirm={() =>
                            deleteProfile.mutate(profile.id, {
                              onSuccess: () =>
                                message.success("Profile deleted"),
                            })
                          }
                        >
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                          >
                            Delete
                          </Button>
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            {profile.name}
                            <Tag
                              color={
                                LOADER_COLORS[profile.loader] ?? "default"
                              }
                            >
                              {profile.loader}
                            </Tag>
                          </Space>
                        }
                        description={`${profile.mod_count} mods`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ),
          },
          {
            key: "mods",
            label: "Mods Registry",
            children: (
              <Card>
                <List
                  dataSource={mods ?? []}
                  locale={{ emptyText: "No mods registered" }}
                  renderItem={(mod) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="delete"
                          title={`Delete ${mod.name}?`}
                          onConfirm={() =>
                            deleteMod.mutate(mod.id, {
                              onSuccess: () =>
                                message.success("Mod deleted"),
                            })
                          }
                        >
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                          >
                            Delete
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
                        description={
                          <Space>
                            <span>{mod.slug}</span>
                            {mod.modrinth_id && <Tag>Modrinth</Tag>}
                            {mod.curseforge_id && <Tag>CurseForge</Tag>}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
