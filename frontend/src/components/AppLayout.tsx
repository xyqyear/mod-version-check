import { SyncOutlined } from "@ant-design/icons";
import { Layout, Menu, Typography } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import SyncStatusBadge from "@/components/SyncStatusBadge";

const { Header, Content } = Layout;

const NAV_ITEMS = [
  { key: "/", label: "Home" },
  { key: "/settings", label: "Settings" },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = location.pathname.startsWith("/settings")
    ? "/settings"
    : "/";

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SyncOutlined className="text-white text-xl" />
          <Typography.Text strong className="text-white! text-lg mb-0!">
            Mod Version Checker
          </Typography.Text>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={NAV_ITEMS}
            onClick={({ key }) => navigate(key)}
            className="border-none flex-1"
          />
        </div>
        <SyncStatusBadge />
      </Header>
      <Content className="p-6">
        <Outlet />
      </Content>
    </Layout>
  );
}
