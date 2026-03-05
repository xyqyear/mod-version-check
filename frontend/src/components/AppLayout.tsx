import { SyncOutlined, LoginOutlined, LogoutOutlined } from "@ant-design/icons";
import { Button, Layout, Menu, Typography } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import SyncStatusBadge from "@/components/SyncStatusBadge";
import { useAuth } from "@/contexts/AuthContext";

const { Header, Content } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthRequired, isAuthenticated, canEdit, logout } = useAuth();

  const navItems = [
    { key: "/", label: "Home" },
    ...(canEdit ? [{ key: "/settings", label: "Settings" }] : []),
  ];

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
            items={navItems}
            onClick={({ key }) => navigate(key)}
            className="border-none flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <SyncStatusBadge />
          {isAuthRequired && (
            isAuthenticated ? (
              <Button
                type="text"
                size="small"
                icon={<LogoutOutlined />}
                onClick={() => { logout(); navigate("/"); }}
                className="text-gray-300!"
              >
                Logout
              </Button>
            ) : (
              <Button
                type="text"
                size="small"
                icon={<LoginOutlined />}
                onClick={() => navigate("/login", { state: { from: location.pathname } })}
                className="text-gray-300!"
              >
                Login
              </Button>
            )
          )}
        </div>
      </Header>
      <Content className="p-6">
        <Outlet />
      </Content>
    </Layout>
  );
}
