import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../../store/auth/auth.store";
import { ROUTES } from "../routes";

export default function RequireAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!accessToken) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}
