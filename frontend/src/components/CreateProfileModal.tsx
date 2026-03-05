import { Form, Input, Modal, Select } from "antd";
import type { LoaderType, ProfileCreate } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProfileCreate) => void;
  loading?: boolean;
}

const LOADER_OPTIONS: { value: LoaderType; label: string }[] = [
  { value: "fabric", label: "Fabric" },
  { value: "forge", label: "Forge" },
  { value: "neoforge", label: "NeoForge" },
  { value: "quilt", label: "Quilt" },
];

export default function CreateProfileModal({ open, onClose, onSubmit, loading }: Props) {
  const [form] = Form.useForm<ProfileCreate>();

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Create Profile"
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      confirmLoading={loading}
      okText="Create"
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="name"
          label="Profile Name"
          rules={[{ required: true, message: "Please enter a profile name" }]}
        >
          <Input placeholder="e.g., My Server" />
        </Form.Item>
        <Form.Item
          name="loader"
          label="Mod Loader"
          rules={[{ required: true, message: "Please select a mod loader" }]}
        >
          <Select options={LOADER_OPTIONS} placeholder="Select a loader" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
