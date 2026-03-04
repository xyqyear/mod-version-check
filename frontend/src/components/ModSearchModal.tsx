import { useCallback, useState } from "react";
import {
  Avatar,
  Button,
  Input,
  List,
  Modal,
  Space,
  Tag,
  Typography,
  App,
} from "antd";
import { CheckOutlined, PlusOutlined } from "@ant-design/icons";
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
  const { message } = App.useApp();
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
      message.success(`Added ${hit.name}`);
    } catch {
      message.error(`Failed to add ${hit.name}`);
    }
  };

  return (
    <Modal
      title="Search & Add Mods"
      open={open}
      onCancel={() => {
        setSearchQuery("");
        setDebouncedQuery("");
        onClose();
      }}
      footer={null}
      width={640}
    >
      <Input.Search
        placeholder="Search mods (e.g., sodium, lithium...)"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        loading={isLoading}
        className="mb-4"
        allowClear
      />

      <List
        loading={isLoading}
        dataSource={searchResult?.hits ?? []}
        locale={{ emptyText: debouncedQuery ? "No mods found" : "Type to search" }}
        renderItem={(hit) => (
          <List.Item
            actions={[
              hit.existing_mod_id ? (
                <Button
                  key="add"
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleAdd(hit)}
                  loading={addMod.isPending}
                >
                  Add
                </Button>
              ) : (
                <Button
                  key="add"
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleAdd(hit)}
                  loading={createMod.isPending || addMod.isPending}
                >
                  Add
                </Button>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={
                hit.icon_url ? (
                  <Avatar src={hit.icon_url} shape="square" />
                ) : undefined
              }
              title={
                <Space>
                  <span>{hit.name}</span>
                  <Tag>{hit.provider}</Tag>
                  {hit.existing_mod_id && (
                    <Tag color="green" icon={<CheckOutlined />}>
                      registered
                    </Tag>
                  )}
                </Space>
              }
              description={
                <Typography.Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  className="mb-0!"
                >
                  {hit.description}
                </Typography.Paragraph>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
