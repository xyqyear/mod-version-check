import { useCallback, useEffect, useRef, useState } from "react";
import { Button, List, Modal, Progress, Tag, Typography } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  ForwardOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import type { ModRow } from "@/types";
import {
  downloadModsForVersion,
  type DownloadPhase,
  type DownloadProgress,
  type ModDownloadState,
  type ModDownloadStatus,
} from "@/lib/download-service";

interface Props {
  open: boolean;
  onClose: () => void;
  mods: ModRow[];
  gameVersion: string;
  loader: string;
  profileName: string;
}

const PHASE_LABELS: Record<DownloadPhase, string> = {
  resolving: "Resolving mod files...",
  downloading: "Downloading mods...",
  zipping: "Creating zip archive...",
  done: "Complete!",
};

const STATUS_ICONS: Record<ModDownloadStatus, React.ReactNode> = {
  pending: <MinusCircleOutlined className="text-gray-400" />,
  resolving: <LoadingOutlined className="text-blue-500" />,
  downloading: <DownloadOutlined className="text-blue-500" />,
  done: <CheckCircleOutlined className="text-green-500" />,
  skipped: <ForwardOutlined className="text-yellow-500" />,
  error: <CloseCircleOutlined className="text-red-500" />,
};

export default function DownloadModsModal({
  open,
  onClose,
  mods,
  gameVersion,
  loader,
  profileName,
}: Props) {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);

    await downloadModsForVersion(
      mods,
      gameVersion,
      loader,
      setProgress,
      controller.signal,
    );

    setRunning(false);
  }, [mods, gameVersion, loader]);

  useEffect(() => {
    if (open) {
      setProgress(null);
      start();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [open, start]);

  const handleClose = () => {
    if (running) {
      Modal.confirm({
        title: "Cancel download?",
        content: "The download is still in progress. Are you sure you want to cancel?",
        onOk: () => {
          abortRef.current?.abort();
          setRunning(false);
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  const handleDownloadZip = () => {
    if (!progress?.zipBlob) return;
    const url = URL.createObjectURL(progress.zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profileName}-${loader}-${gameVersion}-mods.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const modStates = progress?.mods ?? [];
  const phase = progress?.phase ?? "resolving";
  const overall = progress?.overallProgress ?? 0;
  const doneCount = modStates.filter((m) => m.status === "done").length;
  const totalCount = modStates.length;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={`Download mods for ${gameVersion}`}
      footer={
        progress?.zipBlob ? (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadZip}
          >
            Download Zip ({doneCount} mods)
          </Button>
        ) : null
      }
      width={520}
      maskClosable={false}
    >
      <div className="mb-4">
        <Typography.Text type="secondary">{PHASE_LABELS[phase]}</Typography.Text>
        <Progress
          percent={Math.round(overall)}
          status={phase === "done" ? "success" : "active"}
          className="mt-1"
        />
        {phase === "done" && (
          <Typography.Text type="secondary" className="text-xs">
            {doneCount} of {totalCount} mods downloaded
          </Typography.Text>
        )}
      </div>

      <List
        size="small"
        dataSource={modStates}
        renderItem={(mod: ModDownloadState) => (
          <List.Item className="py-1!">
            <div className="flex items-center gap-2 w-full">
              {STATUS_ICONS[mod.status]}
              <span className="flex-1 truncate">{mod.modName}</span>
              {mod.status === "downloading" && (
                <Progress
                  percent={mod.progress}
                  size="small"
                  className="w-20 mb-0!"
                  showInfo={false}
                />
              )}
              {mod.status === "skipped" && (
                <Tag color="warning" className="m-0!">
                  {mod.error ?? "Skipped"}
                </Tag>
              )}
              {mod.status === "error" && (
                <Tag color="error" className="m-0!">
                  {mod.error ?? "Error"}
                </Tag>
              )}
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
}
