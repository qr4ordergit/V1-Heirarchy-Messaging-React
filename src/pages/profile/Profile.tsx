import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Avatar,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronRight,
  IconLogout,
  IconPencil,
  IconSwitch3,
  IconX,
} from "@tabler/icons-react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth/auth.store";
import { logout } from "../../api/authApi";
import { ROUTES } from "../../router/routes";
import { API_ENDPOINTS, withTargetUser } from "../../utils/constant";
import { notifications } from "@mantine/notifications";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearTokens = useAuthStore((state) => state.clearTokens);
  const userDetails = useAuthStore((state) => state.userDetails);
  const setUserDetails = useAuthStore((state) => state.setUserDetails);
  const setTargetUser = useAuthStore((state) => state.setTargetUser);
  const target_user = useAuthStore((state) => state.target_user);
  const token = useAuthStore((state) => state.accessToken);

  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
  const [adjacencyList, setAdjacencyList] = useState<string[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isSubRoute = ["/privacy", "/help", "/about"].includes(
    location.pathname,
  );

  const getHeaders = (): Record<string, string> => ({
    Authorization: token ?? "",
    "Content-Type": "application/json",
  });

  const fetchAdjacencyList = async () => {
    setLoadingAccounts(true);
    try {
      const response = await fetch(
        withTargetUser(API_ENDPOINTS.ADJACENCY_LIST),
        {
          method: "GET",
          headers: getHeaders(),
        },
      );

      const data = await response.json();

      if (response.ok && (data.adjacencylist || data.data)) {
        const list = data.adjacencylist || data.data || [];
        setAdjacencyList(list);
      } else {
        notifications.show({
          title: "",
          message: data.message || "Failed to fetch accounts list.",
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error fetching account list: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAdjacencyList();
  }, []);

  const handlePencilClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const patchUrl = withTargetUser(API_ENDPOINTS.USER_HOME);
      const patchPayload = {
        display_name: target_user || userDetails?.username || "",
        profile_picture: file.name,
      };

      const response = await fetch(patchUrl, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(patchPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        notifications.show({
          title: "",
          message: data.message || "Failed to initiate profile update.",
          color: "red",
          icon: <IconX size={18} />,
        });
        return;
      }

      const presignedUrl = data.profile_picture_upload_url.upload_url;

      if (presignedUrl) {
        const s3Response = await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "image/png",
          },
          body: file,
        });

        if (!s3Response.ok) {
          notifications.show({
            title: "",
            message: "Failed to upload image file to storage.",
            color: "red",
            icon: <IconX size={18} />,
          });
          return;
        }
      }

      const localPreviewUrl = URL.createObjectURL(file);
      if (userDetails) {
        setUserDetails({
          ...userDetails,
          profile_url: localPreviewUrl,
        });
      }

      notifications.show({
        title: "Success",
        message: data.message || "Profile picture updated successfully.",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error uploading profile picture: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setUploadingImage(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleToggleSwitchAccount = () => {
    setSwitchAccountOpen((prev) => !prev);
  };

  const handleSwitchToAccount = (selectedUsername: string) => {
    setTargetUser(selectedUsername);
    navigate(`/${ROUTES.CHATS}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearTokens();
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  const username = target_user || userDetails?.username || "";
  const userInitials =
    username
      .split("-")
      .map((part: string) => part[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "M";

  const otherAccounts = adjacencyList.filter(
    (accUsername) => accUsername !== username,
  );

  if (isSubRoute) {
    return (
      <div className="w-full px-1 h-full">
        <div className="w-full md:w-7/12 bg-white p-4 sm:p-6">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-1 h-full">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/jpg"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-100px)] overflow-hidden bg-white">
        <div className="w-full md:w-7/12 bg-white flex flex-col justify-between px-4 pt-4 sm:px-6 sm:pt-6 sm:pb-1 relative">
          <Stack gap="md" className="w-full">
            <div className="flex flex-col items-center justify-center pt-2 pb-2 gap-2">
              <div className="relative inline-block">
                <Avatar
                  src={userDetails?.profile_url || null}
                  color="indigo"
                  radius="xl"
                  size={84}
                  className="text-2xl font-bold shadow-sm"
                >
                  {!userDetails?.profile_url && userInitials}
                </Avatar>

                <UnstyledButton
                  onClick={handlePencilClick}
                  disabled={uploadingImage}
                  className="absolute top-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition-all cursor-pointer border-2 border-white"
                  title="Upload new profile picture"
                >
                  {uploadingImage ? (
                    <Loader size={12} color="white" />
                  ) : (
                    <IconPencil size={14} />
                  )}
                </UnstyledButton>
              </div>

              <Text
                fw={700}
                size="lg"
                className="mt-2 text-gray-800 tracking-wide"
              >
                {username}
              </Text>
            </div>

            <div className="w-full space-y-3">
              <Card
                withBorder
                radius="lg"
                p={0}
                className="w-full transition-all duration-200 border-gray-200/90 shadow-xs hover:shadow-sm bg-white"
              >
                <UnstyledButton
                  onClick={handleToggleSwitchAccount}
                  className="w-full px-5 py-4 cursor-pointer"
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <div className="p-2 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <IconSwitch3 size={20} className="text-indigo-600" />
                      </div>
                      <Text fw={600} size="md" className="text-gray-800">
                        Switch Account
                      </Text>
                    </Group>
                    {switchAccountOpen ? (
                      <IconChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <IconChevronRight size={18} className="text-gray-400" />
                    )}
                  </Group>
                </UnstyledButton>

                {switchAccountOpen && (
                  <div className="px-5 pb-4 pt-2 border-t border-gray-100 space-y-2 animate-fadeIn">
                    {loadingAccounts ? (
                      <div className="flex justify-center items-center py-3">
                        <Loader size="sm" color="indigo" />
                      </div>
                    ) : otherAccounts.length > 0 ? (
                      otherAccounts.map((accUsername) => {
                        const initials =
                          accUsername
                            .split("-")
                            .map((p) => p[0]?.toUpperCase() || "")
                            .join("")
                            .slice(0, 2) || "U";

                        return (
                          <UnstyledButton
                            key={accUsername}
                            onClick={() => handleSwitchToAccount(accUsername)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
                          >
                            <Group gap="sm">
                              <Avatar color="gray" radius="xl" size={32}>
                                {initials}
                              </Avatar>
                              <div>
                                <Text
                                  size="sm"
                                  fw={500}
                                  className="text-gray-700"
                                >
                                  {accUsername}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  Tap to switch
                                </Text>
                              </div>
                            </Group>
                          </UnstyledButton>
                        );
                      })
                    ) : (
                      <div className="py-2 text-center">
                        <Text size="xs" c="dimmed" fw={500}>
                          No other accounts available to switch.
                        </Text>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Card
                withBorder
                radius="lg"
                p={0}
                className="w-full border-gray-200/90 shadow-xs bg-white hover:bg-red-50/40 hover:border-red-200 transition-all duration-200"
              >
                <UnstyledButton
                  onClick={handleLogout}
                  className="w-full px-5 py-4 cursor-pointer"
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <div className="p-2 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                        <IconLogout size={20} />
                      </div>
                      <Text fw={600} size="md" className="text-red-500">
                        Logout
                      </Text>
                    </Group>
                  </Group>
                </UnstyledButton>
              </Card>
            </div>
          </Stack>

          <div className="mt-auto pt-6 hidden md:flex justify-center items-center gap-6">
            <button
              onClick={() => navigate("/privacy")}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate("/help")}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Help & Support
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              About
            </button>
          </div>

          <div className="md:hidden fixed bottom-16.25 left-0 right-0 bg-white py-2 flex justify-center items-center gap-6 z-10 shadow-xs">
            <button
              onClick={() => navigate("/privacy")}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate("/help")}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Help & Support
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              About
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
