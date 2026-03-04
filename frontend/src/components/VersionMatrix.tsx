import { Avatar, Spin, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import VersionCell from "@/components/VersionCell";
import type { ModRow, VersionMatrix as VersionMatrixType } from "@/types";

interface Props {
  matrix: VersionMatrixType | undefined;
  loading: boolean;
}

export default function VersionMatrix({ matrix, loading }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!matrix || matrix.mods.length === 0) {
    return (
      <Typography.Text type="secondary" className="block text-center py-8">
        No mods added to this profile yet. Add mods to see version availability.
      </Typography.Text>
    );
  }

  const columns: ColumnsType<ModRow> = [
    {
      title: "Mod",
      dataIndex: "mod_name",
      key: "mod_name",
      fixed: "left",
      width: 200,
      render: (name: string, record: ModRow) => (
        <div className="flex items-center gap-2">
          {record.icon_url && (
            <Avatar src={record.icon_url} size="small" shape="square" />
          )}
          <Typography.Text strong>{name}</Typography.Text>
        </div>
      ),
    },
    ...matrix.game_versions.map((gv) => ({
      title: gv,
      key: gv,
      width: 140,
      align: "center" as const,
      render: (_: unknown, record: ModRow) => {
        const cell = record.versions[gv] ?? { available: false };
        return <VersionCell cell={cell} />;
      },
    })),
  ];

  return (
    <Table
      columns={columns}
      dataSource={matrix.mods}
      rowKey="mod_id"
      pagination={false}
      scroll={{ x: 200 + matrix.game_versions.length * 140 }}
      size="middle"
    />
  );
}
