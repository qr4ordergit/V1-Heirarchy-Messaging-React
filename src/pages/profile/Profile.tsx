import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Modal,
  PasswordInput,
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
  IconCopy,
  IconEdit,
  IconId,
  IconKey,
  IconLogout,
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
  createKeyringCategoryApi,
  createTagApi,
  deleteKeyringCategoryApi,
  deleteTagApi,
  getKeyringCategoriesApi,
  getTagsApi,
  updateKeyringCategoryApi,
  updateProfileApi,
  uploadImageToS3Api,
} from "../../api/profileApi";
import type { KeyringCategoryItem } from "../../api/profileApi";
import { ROUTES } from "../../router/routes";
import { notifications } from "@mantine/notifications";
import { handleApiError } from "../../utils/errorHandler";
import { useTranslation } from "../../store/language/language.store";

interface PasswordPair {
  key: string;
  value: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { translation } = useTranslation();
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

  // Account Details Accordion
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Tags Accordion
  const [tagsOpen, setTagsOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  // Keyring Accordion
  const [keyringOpen, setKeyringOpen] = useState(false);
  const [keyrings, setKeyrings] = useState<KeyringCategoryItem[]>([]);
  const [loadingKeyrings, setLoadingKeyrings] = useState(false);
  const [expandedKeyringId, setExpandedKeyringId] = useState<string | null>(
    null,
  );

  const [keyringModalOpened, setKeyringModalOpened] = useState(false);
  const [editingKeyringId, setEditingKeyringId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [passwordPairs, setPasswordPairs] = useState<PasswordPair[]>([
    { key: "", value: "" },
  ]);
  const [submittingKeyring, setSubmittingKeyring] = useState(false);
  const [deletingKeyringId, setDeletingKeyringId] = useState<string | null>(
    null,
  );

  const isSubRoute = ["/privacy", "/help", "/about"].includes(
    location.pathname,
  );

  const savedDisplayName =
    targetUserDetails?.display_name ?? (userDetails as any)?.display_name ?? "";
  const savedDescription =
    targetUserDetails?.description ?? (userDetails as any)?.description ?? "";

  const isAnySectionOpen = accountDetailsOpen || tagsOpen || keyringOpen;

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

  const fetchKeyringsList = async () => {
    setLoadingKeyrings(true);
    try {
      const data = await getKeyringCategoriesApi();
      setKeyrings(Array.isArray(data) ? data : []);
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setLoadingKeyrings(false);
    }
  };

  const handleUpdateAccountDetails = async () => {
    setSavingProfile(true);
    try {
      const trimmedDisplayName = displayName.trim();
      const trimmedDescription = description.trim();

      const payload = {
        display_name: trimmedDisplayName,
        description: trimmedDescription,
      };

      const res = await updateProfileApi(payload);

      if (!res) return;

      if (res?.updated_fields) {
        if (target_user && targetUserDetails) {
          setTargetUserDetails({
            ...targetUserDetails,
            display_name: trimmedDisplayName,
            description: trimmedDescription,
          });
        } else if (userDetails) {
          setUserDetails({
            ...userDetails,
            display_name: trimmedDisplayName,
            description: trimmedDescription,
          } as any);
        }
      }

      notifications.show({
        title: "",
        message: translation(
          "profile.notificationAccUpdated",
          "Account details updated successfully.",
        ),
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
        message: translation(
          "profile.alertEnterTag",
          "Please enter a tag name.",
        ),
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    setCreatingTag(true);
    try {
      await createTagApi(trimmedTag);
      notifications.show({
        title: "",
        message: translation(
          "profile.notificationTagCreated",
          "Tag created successfully.",
        ),
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
      await deleteTagApi(tagIdentifier);
      notifications.show({
        title: "",
        message: translation(
          "profile.notificationTagDeleted",
          "Tag deleted successfully.",
        ),
        color: "green",
      });

      removeTag(tagIdentifier);
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setDeletingTagId(null);
    }
  };

  const handleToggleKeyring = () => {
    const nextState = !keyringOpen;
    setKeyringOpen(nextState);
    if (nextState) {
      fetchKeyringsList();
    }
  };

  const handleOpenAddKeyringModal = () => {
    setEditingKeyringId(null);
    setCategoryName("");
    setPasswordPairs([{ key: "", value: "" }]);
    setKeyringModalOpened(true);
  };

  const handleOpenEditKeyringModal = (item: KeyringCategoryItem) => {
    const id = item.keyring_category_id || item._id || "";
    setEditingKeyringId(id);
    setCategoryName(item.keyring_category_name || "");

    const pairs: PasswordPair[] = [];
    if (
      item.keyring_category_passwords &&
      typeof item.keyring_category_passwords === "object"
    ) {
      for (const [k, v] of Object.entries(item.keyring_category_passwords)) {
        pairs.push({ key: k, value: String(v) });
      }
    }
    setPasswordPairs(pairs.length > 0 ? pairs : [{ key: "", value: "" }]);
    setKeyringModalOpened(true);
  };

  const handleAddPasswordPairRow = () => {
    setPasswordPairs([...passwordPairs, { key: "", value: "" }]);
  };

  const handleRemovePasswordPairRow = (index: number) => {
    if (passwordPairs.length === 1) {
      setPasswordPairs([{ key: "", value: "" }]);
      return;
    }
    setPasswordPairs(passwordPairs.filter((_, idx) => idx !== index));
  };

  const handlePasswordPairChange = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    const updated = [...passwordPairs];
    updated[index][field] = val;
    setPasswordPairs(updated);
  };

  const handleSaveKeyringModal = async () => {
    const trimmedCatName = categoryName.trim();
    if (!trimmedCatName) {
      notifications.show({
        title: "",
        message: translation(
          "profile.alertEnterCategoryName",
          "Please enter a keyring category name.",
        ),
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    const passwordsMap: Record<string, string> = {};
    for (const pair of passwordPairs) {
      const k = pair.key.trim();
      const v = pair.value.trim();
      if (k && v) {
        passwordsMap[k] = v;
      }
    }

    if (Object.keys(passwordsMap).length === 0) {
      notifications.show({
        title: "",
        message: translation(
          "profile.alertProvidePasswordPair",
          "Please provide at least one valid password key and value.",
        ),
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    setSubmittingKeyring(true);
    try {
      if (editingKeyringId) {
        const success = await updateKeyringCategoryApi({
          keyring_category_id: editingKeyringId,
          keyring_category_name: trimmedCatName,
          keyring_category_passwords: passwordsMap,
        });

        if (success) {
          notifications.show({
            title: "",
            message: translation(
              "profile.notificationKeyringUpdated",
              "Keyring category updated successfully.",
            ),
            color: "green",
            icon: <IconCheck size={18} />,
          });
          setKeyringModalOpened(false);
          await fetchKeyringsList();
        }
      } else {
        const res = await createKeyringCategoryApi({
          keyring_category_name: trimmedCatName,
          keyring_category_passwords: passwordsMap,
        });

        if (res) {
          notifications.show({
            title: "",
            message: translation(
              "profile.notificationKeyringCreated",
              "Keyring category created successfully.",
            ),
            color: "green",
            icon: <IconCheck size={18} />,
          });
          setKeyringModalOpened(false);
          await fetchKeyringsList();
        }
      }
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setSubmittingKeyring(false);
    }
  };

  const handleDeleteKeyring = async (id: string) => {
    setDeletingKeyringId(id);
    try {
      const success = await deleteKeyringCategoryApi(id);
      if (success) {
        notifications.show({
          title: "",
          message: translation(
            "profile.notificationKeyringDeleted",
            "Keyring category deleted successfully.",
          ),
          color: "green",
          icon: <IconCheck size={18} />,
        });
        setKeyrings((prev) =>
          prev.filter((item) => (item.keyring_category_id || item._id) !== id),
        );
      }
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setDeletingKeyringId(null);
    }
  };

  const handleCopyPasswordValue = (val: string) => {
    navigator.clipboard.writeText(val);
    notifications.show({
      title: "",
      message: translation(
        "profile.notificationPasswordCopied",
        "Password copied to clipboard!",
      ),
      color: "blue",
      icon: <IconCopy size={16} />,
    });
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

      if (!patchData) return;

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
        message: translation(
          "profile.notificationProfilePicUpdated",
          "Profile picture updated successfully.",
        ),
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
    fetchKeyringsList();
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
                  <Group justify="space-between" pr={"xs"}>
                    <Group gap="md">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                        <IconId size={20} />
                      </div>
                      <div>
                        <Text fw={600} size="sm" className="text-gray-900">
                          {translation(
                            "profile.txtAccDetails",
                            "Account Details",
                          )}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {translation(
                            "profile.txtNameDesc",
                            "Name, description",
                          )}
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
                                {translation(
                                  "profile.txtDisplayName",
                                  "Display Name",
                                )}
                              </Text>
                              <Text
                                size="sm"
                                fw={600}
                                className="text-gray-800"
                              >
                                {savedDisplayName || (
                                  <span className="text-gray-400 font-normal italic">
                                    {translation(
                                      "profile.txtNotSet",
                                      "Not set",
                                    )}
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
                                {translation(
                                  "profile.txtDescBio",
                                  "Description / Bio",
                                )}
                              </Text>
                              <Text
                                size="sm"
                                className="text-gray-700 whitespace-pre-wrap"
                              >
                                {savedDescription || (
                                  <span className="text-gray-400 italic">
                                    {translation(
                                      "profile.txtNoDescProvided",
                                      "No description provided",
                                    )}
                                  </span>
                                )}
                              </Text>
                            </div>
                          </Group>
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
                          {translation(
                            "profile.btnEditProfileDetails",
                            "Edit Profile Details",
                          )}
                        </Button>
                      </Stack>
                    ) : (
                      <Stack gap="sm">
                        <TextInput
                          label={translation(
                            "profile.labelDisplayName",
                            "Display Name",
                          )}
                          placeholder={translation(
                            "profile.placeholderDisplayName",
                            "e.g. John Doe",
                          )}
                          size="sm"
                          value={displayName}
                          disabled={savingProfile}
                          onChange={(e) =>
                            setDisplayName(e.currentTarget.value)
                          }
                        />

                        <Textarea
                          label={translation(
                            "profile.labelDescription",
                            "Description",
                          )}
                          placeholder={translation(
                            "profile.placeholderDescription",
                            "A short note about yourself...",
                          )}
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
                            {translation("profile.btnCancel", "Cancel")}
                          </Button>
                          <Button
                            size="xs"
                            color="indigo"
                            loading={savingProfile}
                            disabled={!isProfileChanged}
                            onClick={handleUpdateAccountDetails}
                          >
                            {translation(
                              "profile.btnSaveChanges",
                              "Save Changes",
                            )}
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
                  <Group justify="space-between" pr={"xs"}>
                    <Group gap="md">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                        <IconTag size={20} />
                      </div>
                      <div>
                        <Text fw={600} size="sm" className="text-gray-900">
                          {translation("profile.txtTagList", "Tags List")}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {tagsList.length}{" "}
                          {tagsList.length === 1 ? "tag" : "tags"}{" "}
                          {translation("profile.txtConfigured", "configured")}
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
                          placeholder={translation(
                            "profile.placeholderTagName",
                            "Tag name...",
                          )}
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
                          {translation("profile.btnSave", "Save")}
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
                        {translation("profile.btnAddNewTag", "Add New Tag")}
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
                              title={translation(
                                "profile.titleDeleteTag",
                                "Delete Tag",
                              )}
                            >
                              <IconTrash size={15} />
                            </ActionIcon>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-2 text-center">
                        <Text size="xs" c="dimmed">
                          {translation(
                            "profile.txtNoTagsCreated",
                            "No tags created yet.",
                          )}
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
                className="w-full border-gray-200/90 shadow-xs bg-white transition-all"
              >
                <UnstyledButton
                  onClick={handleToggleKeyring}
                  className="w-full px-5 py-4 cursor-pointer"
                >
                  <Group justify="space-between" pr={"xs"}>
                    <Group gap="md">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                        <IconKey size={20} />
                      </div>
                      <div>
                        <Text fw={600} size="sm" className="text-gray-900">
                          {translation(
                            "profile.txtKeyringList",
                            "Keyring List",
                          )}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {keyrings.length}{" "}
                          {keyrings.length === 1
                            ? translation("profile.txtCategory", "category")
                            : translation(
                                "profile.txtCategories",
                                "categories",
                              )}{" "}
                          {translation("profile.txtConfigured", "configured")}
                        </Text>
                      </div>
                    </Group>
                    {keyringOpen ? (
                      <IconChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <IconChevronRight size={18} className="text-gray-400" />
                    )}
                  </Group>
                </UnstyledButton>

                {keyringOpen && (
                  <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-3">
                    <Button
                      variant="subtle"
                      color="indigo"
                      size="xs"
                      leftSection={<IconPlus size={14} />}
                      onClick={handleOpenAddKeyringModal}
                      fullWidth
                      className="border border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50"
                    >
                      {translation(
                        "profile.btnAddNewKeyring",
                        "Add Keyring Category",
                      )}
                    </Button>

                    {loadingKeyrings ? (
                      <div className="flex justify-center items-center py-4">
                        <Loader size="sm" color="indigo" />
                      </div>
                    ) : keyrings.length > 0 ? (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {keyrings.map((cat, idx) => {
                          const catId =
                            cat.keyring_category_id || cat._id || String(idx);
                          const isExpanded = expandedKeyringId === catId;
                          const passMap = cat.keyring_category_passwords || {};
                          const passEntries = Object.entries(passMap);

                          return (
                            <div
                              key={catId}
                              className="rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden"
                            >
                              <div className="flex items-center justify-between p-3 bg-white">
                                <Group
                                  gap="xs"
                                  className="cursor-pointer flex-1"
                                  onClick={() =>
                                    setExpandedKeyringId(
                                      isExpanded ? null : catId,
                                    )
                                  }
                                >
                                  <IconKey
                                    size={16}
                                    className="text-indigo-600"
                                  />
                                  <div>
                                    <Text fw={600} size="sm">
                                      {cat.keyring_category_name}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      {passEntries.length}{" "}
                                      {passEntries.length === 1
                                        ? "password key"
                                        : "password keys"}
                                    </Text>
                                  </div>
                                </Group>

                                <Group gap={4}>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="indigo"
                                    onClick={() =>
                                      handleOpenEditKeyringModal(cat)
                                    }
                                    title={translation(
                                      "profile.tooltipEditKeyring",
                                      "Edit Category",
                                    )}
                                  >
                                    <IconEdit size={15} />
                                  </ActionIcon>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="red"
                                    loading={deletingKeyringId === catId}
                                    onClick={() => handleDeleteKeyring(catId)}
                                    title={translation(
                                      "profile.tooltipDeleteKeyring",
                                      "Delete Category",
                                    )}
                                  >
                                    <IconTrash size={15} />
                                  </ActionIcon>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="gray"
                                    onClick={() =>
                                      setExpandedKeyringId(
                                        isExpanded ? null : catId,
                                      )
                                    }
                                  >
                                    {isExpanded ? (
                                      <IconChevronDown size={15} />
                                    ) : (
                                      <IconChevronRight size={15} />
                                    )}
                                  </ActionIcon>
                                </Group>
                              </div>

                              {/* Standard conditional render without Collapse */}
                              {isExpanded && (
                                <div className="p-3 pt-2 bg-gray-50/90 border-t border-gray-100 space-y-2">
                                  {passEntries.length > 0 ? (
                                    passEntries.map(([k, v], pIdx) => (
                                      <div
                                        key={`${k}-${pIdx}`}
                                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 text-xs"
                                      >
                                        <div>
                                          <Text fw={600} size="xs" c="gray.8">
                                            {k}
                                          </Text>
                                          <Text
                                            size="xs"
                                            c="dimmed"
                                            className="font-mono truncate max-w-50"
                                          >
                                            ••••••••
                                          </Text>
                                        </div>

                                        <Tooltip
                                          label={translation(
                                            "profile.tooltipCopyPassword",
                                            "Copy Password",
                                          )}
                                          withArrow
                                        >
                                          <ActionIcon
                                            size="xs"
                                            variant="light"
                                            color="gray"
                                            onClick={() =>
                                              handleCopyPasswordValue(String(v))
                                            }
                                          >
                                            <IconCopy size={13} />
                                          </ActionIcon>
                                        </Tooltip>
                                      </div>
                                    ))
                                  ) : (
                                    <Text size="xs" c="dimmed" ta="center">
                                      {translation(
                                        "profile.txtNoPasswordsInCat",
                                        "No passwords configured in this category.",
                                      )}
                                    </Text>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-2 text-center">
                        <Text size="xs" c="dimmed">
                          {translation(
                            "profile.txtNoKeyringsCreated",
                            "No keyring categories created yet.",
                          )}
                        </Text>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* LOGOUT BUTTON */}
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
                        {translation("profile.txtLogout", "Logout")}
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
              {translation("profile.txtPrivacy", "Privacy")}
            </button>
            <button
              onClick={() => navigate("/help")}
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              {translation("profile.txtHelpSupport", "Help & Support")}
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              {translation("profile.txtAbout", "About")}
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
              {translation("profile.txtPrivacy", "Privacy")}
            </button>
            <button
              onClick={() => navigate("/help")}
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              {translation("profile.txtHelpSupport", "Help & Support")}
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
            >
              {translation("profile.txtAbout", "About")}
            </button>
          </div>
        </div>
      </div>

      <Modal
        opened={keyringModalOpened}
        onClose={() => setKeyringModalOpened(false)}
        title={
          <Text fw={700} size="md">
            {editingKeyringId
              ? translation(
                  "profile.modalTitleEditKeyring",
                  "Edit Keyring Category",
                )
              : translation(
                  "profile.modalTitleAddKeyring",
                  "Add Keyring Category",
                )}
          </Text>
        }
        radius="lg"
        size="md"
        centered
      >
        <Stack gap="md">
          <TextInput
            label={translation("profile.labelCategoryName", "Category Name")}
            placeholder={translation(
              "profile.placeholderCategoryName",
              "e.g. ByHUB Passwords, Personal Keys",
            )}
            size="sm"
            required
            value={categoryName}
            onChange={(e) => setCategoryName(e.currentTarget.value)}
          />

          <Divider
            label={translation(
              "profile.dividerCategoryPasswords",
              "Category Passwords (Key & Value)",
            )}
            labelPosition="center"
          />

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {passwordPairs.map((pair, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200"
              >
                <TextInput
                  placeholder={translation(
                    "profile.placeholderPasswordKey",
                    "Key (e.g. easy password)",
                  )}
                  size="xs"
                  className="flex-1"
                  value={pair.key}
                  onChange={(e) =>
                    handlePasswordPairChange(
                      index,
                      "key",
                      e.currentTarget.value,
                    )
                  }
                />
                <PasswordInput
                  placeholder={translation(
                    "profile.placeholderPasswordValue",
                    "Value / Hash",
                  )}
                  size="xs"
                  className="flex-1"
                  value={pair.value}
                  onChange={(e) =>
                    handlePasswordPairChange(
                      index,
                      "value",
                      e.currentTarget.value,
                    )
                  }
                />
                <ActionIcon
                  size="sm"
                  color="red"
                  variant="subtle"
                  disabled={
                    passwordPairs.length === 1 && !pair.key && !pair.value
                  }
                  onClick={() => handleRemovePasswordPairRow(index)}
                  title="Remove Key-Value"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </div>
            ))}
          </div>

          <Button
            size="xs"
            variant="light"
            color="indigo"
            leftSection={<IconPlus size={14} />}
            onClick={handleAddPasswordPairRow}
          >
            {translation(
              "profile.btnAddMorePasswords",
              "Add More Password Key-Value",
            )}
          </Button>

          <Group justify="flex-end" gap="xs" mt="sm">
            <Button
              variant="default"
              size="xs"
              onClick={() => setKeyringModalOpened(false)}
            >
              {translation("profile.btnCancel", "Cancel")}
            </Button>
            <Button
              size="xs"
              color="indigo"
              loading={submittingKeyring}
              onClick={handleSaveKeyringModal}
            >
              {editingKeyringId
                ? translation("profile.btnUpdateCategory", "Update Category")
                : translation("profile.btnSaveCategory", "Save Category")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default Profile;
