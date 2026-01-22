import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

export function RedirectIfAuthed() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (user) {
    const from = (location.state as any)?.from?.pathname as string | undefined;
    return <Navigate to={from ?? "/"} replace />;
  }

  return <Outlet />;
}
