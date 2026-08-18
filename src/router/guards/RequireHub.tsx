import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { Center, Loader } from "@mantine/core";
import { useAuthStore, isHubAccount } from "../../store/auth/auth.store";
import { fetchUserDetails } from "../../api/userApi";
import { ROUTES } from "../routes";

export default function RequireHub() {
  const userDetails = useAuthStore((state) => state.userDetails);
  const setUserDetails = useAuthStore((state) => state.setUserDetails);
  const [checking, setChecking] = useState(!userDetails);

  useEffect(() => {
    if (userDetails) return;

    (async () => {
      try {
        const details = await fetchUserDetails();
        setUserDetails(details);
      } catch (err) {
        console.error("Could not verify hub access:", err);
      } finally {
        setChecking(false);
      }
    })();
  }, [userDetails, setUserDetails]);

  if (checking) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!isHubAccount(userDetails)) {
    return <Navigate to={`/${ROUTES.CHATS}`} replace />;
  }

  return <Outlet />;
}
