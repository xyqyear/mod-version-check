import { Tag, Tooltip } from "antd";
import type { VersionCell as VersionCellType } from "@/types";

interface Props {
  cell: VersionCellType;
}

export default function VersionCell({ cell }: Props) {
  if (!cell.available) {
    return (
      <Tag color="default" className="w-full text-center">
        —
      </Tag>
    );
  }

  const color =
    cell.version_type === "release"
      ? "success"
      : cell.version_type === "beta"
        ? "warning"
        : "error";

  return (
    <Tooltip
      title={
        <>
          <div>{cell.version_number}</div>
          <div>{cell.version_type}</div>
          {cell.date_published && (
            <div>{new Date(cell.date_published).toLocaleDateString()}</div>
          )}
        </>
      }
    >
      <Tag color={color} className="w-full text-center cursor-default">
        {cell.version_number}
      </Tag>
    </Tooltip>
  );
}
