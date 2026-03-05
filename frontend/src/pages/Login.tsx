import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button, Card, Input, Typography, App } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from ?? "/";

  const handleSubmit = async () => {
    if (!token.trim()) return;
    setLoading(true);
    const success = await login(token.trim());
    setLoading(false);
    if (success) {
      navigate(from, { replace: true });
    } else {
      message.error("Invalid token");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <LockOutlined className="text-4xl text-blue-500 mb-2" />
          <Typography.Title level={3} className="mb-1!">
            Authentication Required
          </Typography.Title>
          <Typography.Text type="secondary">
            Enter your access token to continue
          </Typography.Text>
        </div>
        <Input.Password
          placeholder="Access token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onPressEnter={handleSubmit}
          size="large"
          className="mb-4"
        />
        <Button
          type="primary"
          block
          size="large"
          onClick={handleSubmit}
          loading={loading}
          disabled={!token.trim()}
        >
          Log In
        </Button>
      </Card>
    </div>
  );
}
