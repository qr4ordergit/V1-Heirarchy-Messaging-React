import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Alert, Center, Loader, Stack, Text } from "@mantine/core";
import { useAuthStore, isHubAccount } from "../../store/auth/auth.store";
import { fetchUserDetails } from "../../api/userApi";
import { ROUTES } from "../../router/routes";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUserDetails = useAuthStore((state) => state.setUserDetails);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const idToken = searchParams.get("id_token");
    const refreshToken = searchParams.get("refresh_token");

    if (!accessToken) {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }

    setTokens({
      accessToken,
      idToken: idToken ?? "",
      refreshToken: refreshToken ?? "",
    });

    (async () => {
      try {
        const details = await fetchUserDetails();

        setUserDetails(details);
        if (isHubAccount(details)) {
          navigate(ROUTES.ACCOUNTS, { replace: true });
        } else {
          navigate(`/${ROUTES.CHATS}`, { replace: true });
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not verify your account. Please try logging in again.",
        );
      }
    })();
  }, [searchParams, navigate, setTokens, setUserDetails]);
  if (error) {
    return (
      <Center h="100vh">
        <Alert color="red" title="Sign-in failed" maw={420}>
          {error}
        </Alert>
      </Center>
    );
  }

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
