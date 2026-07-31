import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router";
import { Center, Loader, Stack, Text } from "@mantine/core";
import Navbar from "../component/navbar/Navbar";
import NavigationBar from "../component/chats/navigation_bar/NavigationBar";
import { useAuthStore } from "../store/auth/auth.store";
import { fetchUserDetails } from "../api/userApi";
import { ROUTES } from "../router/routes";

function DashboardLayout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessToken, setTokens, setUserDetails } = useAuthStore();
  const [checkingAccess, setCheckingAccess] = useState(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("access_token");

    if (tokenFromUrl) {
      setTokens({
        accessToken: tokenFromUrl,
        idToken: searchParams.get("id_token") ?? "",
        refreshToken: searchParams.get("refresh_token") ?? "",
      });
      setSearchParams({}, { replace: true });
      hasCheckedRef.current = false;
    }
  }, [searchParams, setTokens, setSearchParams]);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    if (!accessToken) return;

    hasCheckedRef.current = true;

    (async () => {
      setCheckingAccess(true);
      try {
        const details = await fetchUserDetails();
        setUserDetails(details);

        if (details.groups.includes("hub")) {
          navigate(ROUTES.ACCOUNTS, { replace: true });
        } else {
          navigate(`${ROUTES.DASHBOARD}/${ROUTES.CHATS}`, { replace: true });
        }
      } catch (err) {
        console.error("Could not verify user access:", err);
        navigate(`${ROUTES.DASHBOARD}/${ROUTES.CHATS}`, { replace: true });
      } finally {
        setCheckingAccess(false);
      }
    })();
  }, [accessToken, navigate, setUserDetails]);

  if (checkingAccess) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="sm">
          <Loader />
          <Text c="dimmed" size="sm">
            Setting things up...
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div>
        <Navbar />
      </div>
      <div className="grow min-h-0">
        <div className="flex h-full bg-gray-100">
          <div className="w-1/12 bg-white">
            <NavigationBar />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
