import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Alert, Center, Loader, Stack, Text } from "@mantine/core";

import { useAuthStore, isAdminAccount } from "../../store/auth/auth.store";
import { fetchUserDetails } from "../../api/userApi";
import { establishSession } from "../../utils/authFlow";
import { ROUTES } from "../../router/routes";
import { useTranslation } from "../../store/language/language.store";
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const setUserDetails = useAuthStore((state) => state.setUserDetails);

  const [error, setError] = useState<string | null>(null);
  const { translation } = useTranslation();
  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const idToken = searchParams.get("id_token");
    const refreshToken = searchParams.get("refresh_token");

    if (!accessToken) {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }

    const completeAuthentication = async () => {
      try {
        const session = await establishSession({
          accessToken,
          idToken: idToken ?? "",
          refreshToken: refreshToken ?? "",
        });

        if (session.status === "limit_reached") {
          navigate(ROUTES.SESSIONS, { replace: true });
          return;
        }

        const details = await fetchUserDetails();

        setUserDetails(details);

        navigate(isAdminAccount(details) ? ROUTES.ADMIN : ROUTES.ACCOUNTS, {
          replace: true,
        });
      } catch (err) {
        console.error("Authentication failed:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Could not verify your account. Please try logging in again.",
        );
      }
    };

    void completeAuthentication();
  }, [searchParams, navigate, setUserDetails]);

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
          {translation("signin.title", "Signing you in...")}
        </Text>
      </Stack>
    </Center>
  );
}
