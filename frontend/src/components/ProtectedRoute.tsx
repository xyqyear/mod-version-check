import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { canEdit } = useAuth();
  const location = useLocation();

  if (!canEdit) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
