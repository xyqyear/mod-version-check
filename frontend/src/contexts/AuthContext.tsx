import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import { fetchAuthRequired, checkAuth } from "@/hooks/api/auth";
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from "@/lib/api";

interface AuthContextValue {
  isAuthRequired: boolean;
  isAuthenticated: boolean;
  canEdit: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { required } = await fetchAuthRequired();
        setIsAuthRequired(required);

        if (required && getStoredToken()) {
          try {
            await checkAuth();
            setIsAuthenticated(true);
          } catch {
            clearStoredToken();
          }
        }
      } catch {
        // If we can't reach the server, assume no auth required
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (token: string): Promise<boolean> => {
    setStoredToken(token);
    try {
      await checkAuth();
      setIsAuthenticated(true);
      return true;
    } catch {
      clearStoredToken();
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setIsAuthenticated(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthRequired,
        isAuthenticated,
        canEdit: isAuthenticated || !isAuthRequired,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
