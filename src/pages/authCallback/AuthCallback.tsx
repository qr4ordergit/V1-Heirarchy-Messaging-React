import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Center, Loader, Stack, Text } from "@mantine/core";
import { ROUTES } from "../../router/routes";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const idToken = searchParams.get("id_token");
    const refreshToken = searchParams.get("refresh_token");

    console.log("accessToken", accessToken);
    if (accessToken) {
      sessionStorage.setItem("access_token", accessToken);
      sessionStorage.setItem("id_token", idToken ?? "");
      sessionStorage.setItem("refresh_token", refreshToken ?? "");
      navigate(ROUTES.DASHBOARD, { replace: true });
    } else {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [searchParams, navigate]);

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
