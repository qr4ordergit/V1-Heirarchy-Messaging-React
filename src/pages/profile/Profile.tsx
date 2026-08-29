import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconId,
  IconLogout,
  IconMail,
  IconPencil,
  IconPlus,
  IconTag,
  IconTrash,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth/auth.store";
import { useTagStore } from "../../store/tags/tags.store";
import { logout } from "../../api/authApi";
import {
  createTagApi,
  deleteTagApi,
  getTagsApi,
  updateProfileApi,
  uploadImageToS3Api,
} from "../../api/profileApi";
import { ROUTES } from "../../router/routes";
import { notifications } from "@mantine/notifications";
import { handleApiError } from "../../utils/errorHandler";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearTokens = useAuthStore((state) => state.clearTokens);
  const userDetails = useAuthStore((state) => state.userDetails);
  const setTargetUserDetails = useAuthStore(
    (state) => state.setTargetUserDetails,
  );
  const setUserDetails = useAuthStore((state) => state.setUserDetails);
  const target_user = useAuthStore((state) => state.target_user);
  const targetUserDetails = useAuthStore((state) => state.targetUserDetails);

  const tagsList = useTagStore((state) => state.tags);
  const storeTags = useTagStore((state) => state.storeTags);
  const appendTag = useTagStore((state) => state.appendTag);
  const removeTag = useTagStore((state) => state.removeTag);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [tagsOpen, setTagsOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  const isSubRoute = ["/privacy", "/help", "/about"].includes(
    location.pathname,
  );

  const currentEmail = targetUserDetails?.email || userDetails?.email || "";

  const savedDisplayName =
    targetUserDetails?.display_name ?? (userDetails as any)?.display_name ?? "";
  const savedDescription =
    targetUserDetails?.description ?? (userDetails as any)?.description ?? "";

  const isAnySectionOpen = accountDetailsOpen || tagsOpen;

  useEffect(() => {
    setDisplayName(savedDisplayName);
    setDescription(savedDescription);
  }, [savedDisplayName, savedDescription]);

  const getValidAvatarSrc = (url?: string | null) => {
    return url && url !== "NA" ? url : null;
  };

  const profileImage =
    getValidAvatarSrc(targetUserDetails?.profile_picture) ||
    getValidAvatarSrc(userDetails?.profile_picture);

  const fetchTagsList = async () => {
    setLoadingTags(true);
    try {
      const tags = await getTagsApi();
      storeTags(Array.isArray(tags) ? tags : []);
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleUpdateAccountDetails = async () => {
    setSavingProfile(true);
    try {
      const payload = {
        display_name: displayName.trim(),
        description: description.trim(),
      };

      const res = await updateProfileApi(payload);

      if (targetUserDetails) {
        setTargetUserDetails({
          ...targetUserDetails,
          display_name: displayName.trim(),
          description: description.trim(),
        });
      }
      if (userDetails) {
        setUserDetails({
          ...userDetails,
          display_name: displayName.trim(),
          description: description.trim(),
        } as any);
      }

      notifications.show({
        title: "",
        message: res.message || "Account details updated successfully.",
        color: "green",
        icon: <IconCheck size={18} />,
      });
      setIsEditingAccount(false);
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelAccountEdit = () => {
    setDisplayName(savedDisplayName);
    setDescription(savedDescription);
    setIsEditingAccount(false);
  };

  const handleCreateTag = async () => {
    const trimmedTag = newTagName.trim();
    if (!trimmedTag) {
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
      const res = await createTagApi(trimmedTag);
      notifications.show({
        title: "",
        message: res.message || "Tag created successfully.",
        color: "green",
      });

      appendTag(trimmedTag);
      setNewTagName("");
      setIsAddingTag(false);
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setCreatingTag(false);
    }
  };

  const handleDeleteTag = async (tagIdentifier: string) => {
    setDeletingTagId(tagIdentifier);
    try {
      const res = await deleteTagApi(tagIdentifier);
      notifications.show({
        title: "",
        message: res.message || "Tag deleted successfully.",
        color: "green",
      });

      removeTag(tagIdentifier);
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setDeletingTagId(null);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const patchData = await updateProfileApi({
        display_name: target_user || userDetails?.username || "",
        profile_picture: file.name,
      });

      if (patchData.profile_picture_upload_url) {
        await uploadImageToS3Api(patchData.profile_picture_upload_url, file);
      }

      const localPreviewUrl = URL.createObjectURL(file);
      if (targetUserDetails) {
        setTargetUserDetails({
          ...targetUserDetails,
          profile_picture: localPreviewUrl,
        });
      }
      if (userDetails) {
        setUserDetails({
          ...userDetails,
          profile_picture: localPreviewUrl,
        });
      }

      notifications.show({
        title: "",
        message: patchData.message || "Profile picture updated successfully.",
        color: "green",
      });
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setUploadingImage(false);
      if (event.target) event.target.value = "";
    }
  };

  useEffect(() => {
    fetchTagsList();
  }, []);

  const handleToggleTags = () => {
    const nextState = !tagsOpen;
    setTagsOpen(nextState);
    if (nextState) {
      fetchTagsList();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      handleApiError(error);
    } finally {
      clearTokens();
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  const username =
    targetUserDetails?.phone_number ||
    userDetails?.phone_number ||
    target_user ||
    userDetails?.username ||
    "";

  const userInitials =
    username
      .split("-")
      .map((part: string) => part[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "U";

  const isProfileChanged =
    displayName.trim() !== savedDisplayName.trim() ||
    description.trim() !== savedDescription.trim();

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
        <div className="w-full md:w-7/12 bg-white flex flex-col justify-between px-4 pt-4 sm:px-6 sm:pt-6 pb-6 relative overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          <Stack gap="lg" className="w-full">
            <div className="flex flex-col items-center justify-center pt-2 pb-1 gap-2">
              <div className="relative inline-block">
                <Avatar
                  src={profileImage}
                  color="indigo"
                  radius="xl"
                  size={92}
                  className="text-2xl font-bold shadow-md border-2 border-indigo-50"
                >
                  {!profileImage && userInitials}
                </Avatar>

                <Tooltip label="Change photo" position="top" withArrow>
                  <UnstyledButton
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition-all cursor-pointer border-2 border-white flex items-center justify-center"
                  >
                    {uploadingImage ? (
                      <Loader size={12} color="white" />
                    ) : (
                      <IconPencil size={13} />
                    )}
                  </UnstyledButton>
                </Tooltip>
              </div>

              <div className="text-center mt-1">
                <Text
                  fw={700}
                  size="lg"
                  className="text-gray-900 tracking-tight"
                >
                  {savedDisplayName || username}
                </Text>
                {savedDisplayName && (
                  <Text size="xs" c="dimmed" fw={500}>
                    @{username}
                  </Text>
                )}
              </div>
            </div>

            <div className="w-full space-y-3">
              <Card
                withBorder
                radius="lg"
                p={0}
                className="w-full border-gray-200/90 shadow-xs bg-white transition-all"
              >
                <UnstyledButton
                  onClick={() => setAccountDetailsOpen(!accountDetailsOpen)}
                  className="w-full px-5 py-4 cursor-pointer"
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                        <IconId size={20} />
                      </div>
                      <div>
                        <Text fw={600} size="sm" className="text-gray-900">
                          Account Details
                        </Text>
                        <Text size="xs" c="dimmed">
                          Name, description & email
                        </Text>
                      </div>
                    </Group>
                    {accountDetailsOpen ? (
                      <IconChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <IconChevronRight size={18} className="text-gray-400" />
                    )}
                  </Group>
                </UnstyledButton>

                {accountDetailsOpen && (
                  <div className="px-5 pb-5 pt-3 border-t border-gray-100">
                    {!isEditingAccount ? (
                      <Stack gap="md">
                        <div className="flex items-start justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                          <Group gap="sm" wrap="nowrap" align="flex-start">
                            <IconUser
                              size={18}
                              className="text-indigo-500 mt-0.5"
                            />
                            <div>
                              <Text size="xs" c="dimmed" fw={600}>
                                Display Name
                              </Text>
                              <Text
                                size="sm"
                                fw={600}
                                className="text-gray-800"
                              >
                                {savedDisplayName || (
                                  <span className="text-gray-400 font-normal italic">
                                    Not set
                                  </span>
                                )}
                              </Text>
                            </div>
                          </Group>
                        </div>

                        <div className="flex items-start justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                          <Group gap="sm" wrap="nowrap" align="flex-start">
                            <IconId
                              size={18}
                              className="text-indigo-500 mt-0.5"
                            />
                            <div>
                              <Text size="xs" c="dimmed" fw={600}>
                                Description / Bio
                              </Text>
                              <Text
                                size="sm"
                                className="text-gray-700 whitespace-pre-wrap"
                              >
                                {savedDescription || (
                                  <span className="text-gray-400 italic">
                                    No description provided
                                  </span>
                                )}
                              </Text>
                            </div>
                          </Group>
                        </div>

                        <div className="flex items-start justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                          <Group gap="sm" wrap="nowrap" align="flex-start">
                            <IconMail
                              size={18}
                              className="text-indigo-500 mt-0.5"
                            />
                            <div>
                              <Text size="xs" c="dimmed" fw={600}>
                                Registered Email
                              </Text>
                              <Text
                                size="sm"
                                fw={500}
                                className="text-gray-800"
                              >
                                {currentEmail || "—"}
                              </Text>
                            </div>
                          </Group>
                          <Badge size="xs" color="gray" variant="light">
                            Read-only
                          </Badge>
                        </div>

                        <Button
                          variant="light"
                          color="indigo"
                          size="xs"
                          leftSection={<IconPencil size={14} />}
                          onClick={() => setIsEditingAccount(true)}
                          fullWidth
                          className="mt-1"
                        >
                          Edit Profile Details
                        </Button>
                      </Stack>
                    ) : (
                      <Stack gap="sm">
                        <TextInput
                          label="Display Name"
                          placeholder="e.g. John Doe"
                          size="sm"
                          value={displayName}
                          disabled={savingProfile}
                          onChange={(e) =>
                            setDisplayName(e.currentTarget.value)
                          }
                        />

                        <Textarea
                          label="Description"
                          placeholder="A short note about yourself..."
                          size="sm"
                          rows={3}
                          value={description}
                          disabled={savingProfile}
                          onChange={(e) =>
                            setDescription(e.currentTarget.value)
                          }
                        />

                        <Group gap="xs" grow pt="xs">
                          <Button
                            variant="default"
                            size="xs"
                            disabled={savingProfile}
                            onClick={handleCancelAccountEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="xs"
                            color="indigo"
                            loading={savingProfile}
                            disabled={!isProfileChanged}
                            onClick={handleUpdateAccountDetails}
                          >
                            Save Changes
                          </Button>
                        </Group>
                      </Stack>
                    )}
                  </div>
                )}
              </Card>

              <Card
                withBorder
                radius="lg"
                p={0}
                className="w-full border-gray-200/90 shadow-xs bg-white transition-all"
              >
                <UnstyledButton
                  onClick={handleToggleTags}
                  className="w-full px-5 py-4 cursor-pointer"
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                        <IconTag size={20} />
                      </div>
                      <div>
                        <Text fw={600} size="sm" className="text-gray-900">
                          Tags List
                        </Text>
                        <Text size="xs" c="dimmed">
                          {tagsList.length}{" "}
                          {tagsList.length === 1 ? "tag" : "tags"} configured
                        </Text>
                      </div>
                    </Group>
                    {tagsOpen ? (
                      <IconChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <IconChevronRight size={18} className="text-gray-400" />
                    )}
                  </Group>
                </UnstyledButton>

                {tagsOpen && (
                  <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-3">
                    {isAddingTag ? (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                        <TextInput
                          placeholder="Tag name..."
                          size="xs"
                          className="flex-1"
                          autoFocus
                          value={newTagName}
                          disabled={creatingTag}
                          onChange={(e) => setNewTagName(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateTag();
                            } else if (e.key === "Escape") {
                              setIsAddingTag(false);
                            }
                          }}
                        />
                        <Button
                          size="xs"
                          color="indigo"
                          loading={creatingTag}
                          onClick={handleCreateTag}
                        >
                          Save
                        </Button>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="gray"
                          onClick={() => {
                            setIsAddingTag(false);
                            setNewTagName("");
                          }}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </div>
                    ) : (
                      <Button
                        variant="subtle"
                        color="indigo"
                        size="xs"
                        leftSection={<IconPlus size={14} />}
                        onClick={() => setIsAddingTag(true)}
                        fullWidth
                        className="border border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50"
                      >
                        Add New Tag
                      </Button>
                    )}

                    {loadingTags ? (
                      <div className="flex justify-center items-center py-4">
                        <Loader size="sm" color="indigo" />
                      </div>
                    ) : tagsList.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {tagsList.map((tag, idx) => (
                          <div
                            key={`${tag}-${idx}`}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-gray-100/60 transition-colors"
                          >
                            <Group gap="xs">
                              <IconTag size={15} className="text-indigo-500" />
                              <Text
                                size="sm"
                                fw={500}
                                className="text-gray-700"
                              >
                                {tag}
                              </Text>
                            </Group>

                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              radius="md"
                              loading={deletingTagId === tag}
                              onClick={() => handleDeleteTag(tag)}
                              title="Delete Tag"
                            >
                              <IconTrash size={15} />
                            </ActionIcon>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-2 text-center">
                        <Text size="xs" c="dimmed">
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
                className="w-full border-gray-200/90 shadow-xs bg-white hover:bg-red-50/40 hover:border-red-200 transition-all"
              >
                <UnstyledButton
                  onClick={handleLogout}
                  className="w-full px-5 py-4 cursor-pointer"
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <div className="p-2.5 rounded-xl bg-red-50 text-red-500">
                        <IconLogout size={20} />
                      </div>
                      <Text fw={600} size="sm" className="text-red-500">
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
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate("/help")}
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Help & Support
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              About
            </button>
          </div>

          <div
            className={`md:hidden flex justify-center items-center gap-6 transition-all duration-200 ${
              isAnySectionOpen
                ? "mt-8 pb-4 relative"
                : "fixed bottom-16.25 left-0 right-0 bg-white py-2 z-10 shadow-xs"
            }`}
          >
            <button
              onClick={() => navigate("/privacy")}
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate("/help")}
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Help & Support
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
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
