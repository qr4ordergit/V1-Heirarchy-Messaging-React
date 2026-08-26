import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ROUTES } from "../../router/routes";

export default function InviteRedirectHandler() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem("group_invite_code", code);
    }
    navigate(ROUTES.REGISTER, { replace: true });
  }, [code, navigate]);

  return null;
}
