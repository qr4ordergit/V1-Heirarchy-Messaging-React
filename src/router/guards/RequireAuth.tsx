import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../../store/auth/auth.store";
import { ROUTES } from "../routes";

export default function RequireAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const sessionPending = useAuthStore((state) => state.sessionPending);

  if (!accessToken) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (sessionPending) {
    return <Navigate to={ROUTES.SESSIONS} replace />;
  }

  return <Outlet />;
}
