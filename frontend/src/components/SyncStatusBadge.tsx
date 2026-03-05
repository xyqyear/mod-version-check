import { Badge, Button, Space, Tooltip, Typography } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { useSyncStatus } from "@/hooks/queries/useSync";
import { useTriggerSync } from "@/hooks/mutations/useSync";
import { useAuth } from "@/contexts/AuthContext";

export default function SyncStatusBadge() {
  const { data: syncStatus } = useSyncStatus();
  const { mutate: trigger, isPending } = useTriggerSync();
  const { canEdit } = useAuth();

  const isRunning = syncStatus?.status === "running";

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString();
  };

  return (
    <Space>
      {syncStatus && (
        <Tooltip
          title={
            isRunning
              ? "Sync in progress..."
              : syncStatus.completed_at
                ? `Last synced: ${formatTime(syncStatus.completed_at)}`
                : "Never synced"
          }
        >
          <Badge
            status={
              isRunning
                ? "processing"
                : syncStatus.status === "completed"
                  ? "success"
                  : syncStatus.status === "failed"
                    ? "error"
                    : "default"
            }
            text={
              <Typography.Text className="text-gray-300! text-sm">
                {isRunning
                  ? "Syncing..."
                  : syncStatus.status === "completed"
                    ? `Synced (${syncStatus.mods_checked} mods)`
                    : syncStatus.status === "failed"
                      ? "Sync failed"
                      : ""}
              </Typography.Text>
            }
          />
        </Tooltip>
      )}
      {canEdit && (
        <Button
          type="text"
          size="small"
          icon={<SyncOutlined spin={isRunning || isPending} />}
          onClick={() => trigger()}
          disabled={isRunning || isPending}
          className="text-gray-300!"
        />
      )}
    </Space>
  );
}
