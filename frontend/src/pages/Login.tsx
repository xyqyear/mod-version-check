import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      toast.error("Invalid token");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Authentication Required</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your access token to continue
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Access token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!token.trim() || loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
