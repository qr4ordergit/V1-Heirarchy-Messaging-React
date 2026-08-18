import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronRight,
  IconLogout,
  IconPencil,
  IconPlus,
  IconSwitch3,
  IconTag,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth/auth.store";
import { logout } from "../../api/authApi";
import { ROUTES } from "../../router/routes";
import {
  API_ENDPOINTS,
  getHeaders,
  withTargetUser,
} from "../../utils/constant";
import { notifications } from "@mantine/notifications";

interface TagItem {
  tag_id?: string;
  tag_name?: string;
  id?: string;
  name?: string;
  _id?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearTokens = useAuthStore((state) => state.clearTokens);
  const userDetails = useAuthStore((state) => state.userDetails);
  const setUserDetails = useAuthStore((state) => state.setUserDetails);
  const setTargetUser = useAuthStore((state) => state.setTargetUser);
  const target_user = useAuthStore((state) => state.target_user);

  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
  const [adjacencyList, setAdjacencyList] = useState<string[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagsList, setTagsList] = useState<TagItem[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  const isSubRoute = ["/privacy", "/help", "/about"].includes(
    location.pathname,
  );

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

  const fetchTagsList = async () => {
    setLoadingTags(true);
    try {
      const response = await fetch(withTargetUser(API_ENDPOINTS.TAGS), {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        const tags =
          data.tags || data.data || (Array.isArray(data) ? data : []);
        setTagsList(tags);
      } else {
        notifications.show({
          title: "",
          message: data.message || "Failed to fetch tags list.",
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error fetching tags: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setLoadingTags(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      notifications.show({
        title: "",
        message: "Please enter a tag name.",
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    setCreatingTag(true);
    try {
      const response = await fetch(withTargetUser(API_ENDPOINTS.TAGS), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ tag_name: newTagName.trim() }),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        notifications.show({
          title: "Success",
          message: data.message || "Tag created successfully.",
          color: "green",
        });
        setNewTagName("");
        fetchTagsList();
      } else {
        notifications.show({
          title: "",
          message: data.message || "Failed to create tag.",
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error creating tag: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setCreatingTag(false);
    }
  };

  const handleDeleteTag = async (tagIdentifier: string) => {
    setDeletingTagId(tagIdentifier);
    try {
      const response = await fetch(withTargetUser(API_ENDPOINTS.TAGS), {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify({ tag_id: tagIdentifier }),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        notifications.show({
          title: "Success",
          message: data.message || "Tag deleted successfully.",
          color: "green",
        });
        fetchTagsList();
      } else {
        notifications.show({
          title: "",
          message: data.message || "Failed to delete tag.",
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error deleting tag: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setDeletingTagId(null);
    }
  };

  useEffect(() => {
    fetchAdjacencyList();
    fetchTagsList();
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

      const presignedUrl = data.profile_picture_upload_url;

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
          profile_picture: localPreviewUrl,
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

  const handleToggleTags = () => {
    const nextState = !tagsOpen;
    setTagsOpen(nextState);
    if (nextState) {
      fetchTagsList();
    }
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
        <div className="w-full md:w-7/12 bg-white flex flex-col justify-between px-4 pt-4 sm:px-6 sm:pt-6 sm:pb-1 relative overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          <Stack gap="md" className="w-full">
            <div className="flex flex-col items-center justify-center pt-2 pb-2 gap-2">
              <div className="relative inline-block">
                <Avatar
                  src={userDetails?.profile_picture || null}
                  color="indigo"
                  radius="xl"
                  size={84}
                  className="text-2xl font-bold shadow-sm"
                >
                  {!userDetails?.profile_picture && userInitials}
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
                    {/* Active User Item */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/60 border border-indigo-200">
                      <Group gap="sm">
                        <Avatar color="indigo" radius="xl" size={32}>
                          {userInitials}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={600} className="text-indigo-900">
                            {username}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Active Account
                          </Text>
                        </div>
                      </Group>
                    </div>

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
                className="w-full transition-all duration-200 border-gray-200/90 shadow-xs hover:shadow-sm bg-white"
              >
                <UnstyledButton
                  onClick={handleToggleTags}
                  className="w-full px-5 py-4 cursor-pointer"
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <div className="p-2 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <IconTag size={20} className="text-indigo-600" />
                      </div>
                      <Text fw={600} size="md" className="text-gray-800">
                        Tags List
                      </Text>
                    </Group>
                    {tagsOpen ? (
                      <IconChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <IconChevronRight size={18} className="text-gray-400" />
                    )}
                  </Group>
                </UnstyledButton>

                {tagsOpen && (
                  <div className="px-5 pb-4 pt-2 border-t border-gray-100 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <TextInput
                        placeholder="Enter new tag name..."
                        size="sm"
                        className="flex-1"
                        value={newTagName}
                        disabled={creatingTag}
                        onChange={(e) => setNewTagName(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateTag();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        color="indigo"
                        leftSection={<IconPlus size={16} />}
                        loading={creatingTag}
                        onClick={handleCreateTag}
                        className="cursor-pointer shrink-0"
                      ></Button>
                    </div>

                    {loadingTags ? (
                      <div className="flex justify-center items-center py-3">
                        <Loader size="sm" color="indigo" />
                      </div>
                    ) : tagsList.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {tagsList.map((tag, idx) => {
                          const tagLabel =
                            typeof tag === "string"
                              ? tag
                              : tag.tag_name ||
                                tag.name ||
                                tag.tag_id ||
                                `Tag ${idx + 1}`;
                          const tagId =
                            typeof tag === "string"
                              ? tag
                              : tag.tag_id ||
                                tag.id ||
                                tag._id ||
                                tag.tag_name ||
                                tag.name ||
                                "";

                          return (
                            <div
                              key={tagId || idx}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50/80 border border-gray-100 hover:bg-gray-100/70 transition-colors"
                            >
                              <Group gap="xs">
                                <IconTag
                                  size={16}
                                  className="text-indigo-500"
                                />
                                <Text
                                  size="sm"
                                  fw={500}
                                  className="text-gray-700"
                                >
                                  {tagLabel}
                                </Text>
                              </Group>

                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                loading={deletingTagId === tagId}
                                onClick={() => handleDeleteTag(tagId)}
                                className="hover:bg-red-50 cursor-pointer"
                                title="Delete Tag"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-3 text-center">
                        <Text size="xs" c="dimmed" fw={500}>
                          No tags created yet.
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
