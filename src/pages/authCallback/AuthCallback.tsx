import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Center, Loader, Stack, Text } from "@mantine/core";
import { useAuthStore } from "../../store/auth/auth.store";
import { ROUTES } from "../../router/routes";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setTokens = useAuthStore((state) => state.setTokens);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const idToken = searchParams.get("id_token");
    const refreshToken = searchParams.get("refresh_token");

    if (accessToken) {
      setTokens({
        accessToken,
        idToken: idToken ?? "",
        refreshToken: refreshToken ?? "",
      });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } else {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [searchParams, navigate, setTokens]);

  return (
    <Center h="100vh">
      <Stack align="center" gap="sm">
        <Loader />
        <Text c="dimmed" size="sm">
          Signing you in...
        </Text>
      </Stack>
    </Center>
  );
}
