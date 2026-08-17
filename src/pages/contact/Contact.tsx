import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Checkbox,
  Group,
  Menu,
  Pill,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconCheck,
  IconEdit,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTrash,
  IconUser,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";
import ContactModal from "./ContactModal";
import CreateGroupModal from "./CreateGroupModal";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth/auth.store";
import { API_ENDPOINTS, withTargetUser } from "../../utils/constant";
import { notifications } from "@mantine/notifications";
import { encryptPasskey } from "../../utils/passkeyCipher";

export interface Contact {
  id: string;
  username: string;
  name: string;
  phone: string;
  email: string;
  color: string;
}

export interface GroupItem {
  _id: string;
  group_name: string;
  group_description?: string;
  admins: string[];
  members: string[];
  group_image?: string;
  profile_url?: string;
  created_by: string;
  member_count: number;
  only_admins_can_message: boolean;
  soft_deleted?: boolean;
}

export type ContactFormValues = Omit<Contact, "id" | "color"> & {
  color?: string;
  passKey?: string;
};

const Contact = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [groupsLoading, setGroupsLoading] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const [fetchingDetailsId, setFetchingDetailsId] = useState<string | null>(
    null,
  );
  const [startingChatId, setStartingChatId] = useState<string | number | null>(
    null,
  );
  const [deletingContactId, setDeletingContactId] = useState<string | null>(
    null,
  );

  const [activeTab, setActiveTab] = useState<string | null>("contacts");
  const [search, setSearch] = useState<string>("");
  const [opened, setOpened] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
  const [selectedGroupContacts, setSelectedGroupContacts] = useState<Contact[]>(
    [],
  );
  const [groupModalOpened, setGroupModalOpened] = useState<boolean>(false);
  const [creatingGroupLoading, setCreatingGroupLoading] =
    useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isDetailActive = location.pathname.split("/").length > 3;

  const token = useAuthStore.getState().accessToken;
  const userDetails = useAuthStore.getState().userDetails;
  const target_user = useAuthStore((state) => state.target_user);

  const getHeaders = (): Record<string, string> => ({
    Authorization: token ?? "",
    "Content-Type": "application/json",
  });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch(withTargetUser(API_ENDPOINTS.CONTACTS), {
        method: "GET",
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const formattedContacts = (data.contacts || data || []).map(
          (item: any, index: number) => ({
            id: item._id || index,
            username: item.contact_user_id || item.username || "",
            name: item.display_name || item.name || "Unknown",
            phone: item.phone || "",
            email: item.email || "",
            color: item.color || "indigo",
          }),
        );
        setContacts(formattedContacts);
      } else {
        notifications.show({
          title: "",
          message: "Failed to fetch contacts.",
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error fetching contacts: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    setGroupsLoading(true);
    try {
      const endpoint = withTargetUser(API_ENDPOINTS.CREATE_GROUP);
      const response = await fetch(endpoint, {
        method: "GET",
        headers: getHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        setGroups(result.data || []);
      } else {
        notifications.show({
          title: "",
          message: "Failed to fetch groups.",
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error fetching groups: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    if (value === "groups") {
      fetchGroups();
    }
  };

  const handleToggleSelectContact = (contact: Contact) => {
    setSelectedGroupContacts((prev) => {
      const exists = prev.some((c) => c.id === contact.id);
      if (exists) {
        return prev.filter((c) => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  const handleRemoveGroupContact = (contactId: string) => {
    setSelectedGroupContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  const handleCreateGroupSubmit = () => {
    if (selectedGroupContacts.length === 0) {
      notifications.show({
        title: "",
        message: "Please select at least one contact to create a group.",
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    setSelectedGroup(null);
    setGroupModalOpened(true);
  };

  const handleSaveGroupPayload = async (
    payload: {
      group_name: string;
      description: string;
      admin: string[];
      members: string[];
      group_image: string;
      group_image_file: File | null;
      only_admins_can_message: boolean;
    },
    isEdit: boolean,
  ) => {
    setCreatingGroupLoading(true);

    const { group_image_file, ...apiPayload } = payload;

    try {
      const endpoint = withTargetUser(API_ENDPOINTS.CREATE_GROUP);
      const method = isEdit ? "PUT" : "POST";

      const finalBody =
        isEdit && selectedGroup
          ? { ...apiPayload, group_id: selectedGroup._id }
          : apiPayload;

      const response = await fetch(endpoint, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(finalBody),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        const presignedUrl = data.upload_url || data.group?.upload_url;

        if (presignedUrl && group_image_file) {
          try {
            await fetch(presignedUrl, {
              method: "PUT",
              headers: {
                "Content-Type": group_image_file.type || "image/png",
              },
              body: group_image_file,
            });
          } catch (uploadError) {
            console.error("Presigned URL Upload Error:", uploadError);
            notifications.show({
              title: "Warning",
              message: "Group saved, but failed to upload group image.",
              color: "orange",
              icon: <IconX size={18} />,
            });
          }
        }

        notifications.show({
          title: "",
          message:
            data.message ||
            `Group ${isEdit ? "updated" : "created"} successfully!`,
          color: "green",
          icon: <IconCheck size={18} />,
        });

        setGroupModalOpened(false);
        setIsCreatingGroup(false);
        setSelectedGroupContacts([]);
        setSelectedGroup(null);

        fetchGroups();
      } else {
        notifications.show({
          title: "",
          message:
            data.message || `Failed to ${isEdit ? "update" : "create"} group.`,
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error ${isEdit ? "updating" : "creating"} group: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setCreatingGroupLoading(false);
    }
  };

  const handleEditGroup = (group: GroupItem) => {
    setSelectedGroup(group);
    setGroupModalOpened(true);
  };

  const handleDeleteGroup = async (group: GroupItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete group "${group.group_name}"?`,
    );
    if (!confirmDelete) return;

    setDeletingGroupId(group._id);

    try {
      const response = await fetch(
        withTargetUser(API_ENDPOINTS.CREATE_GROUP) +
          `?group_id=${encodeURIComponent(group._id)}`,

        {
          method: "DELETE",
          headers: getHeaders(),
        },
      );

      const data = await response.json();

      if (response.ok || data.success) {
        notifications.show({
          title: "",
          message: data.message || "Group deleted successfully",
          color: "green",
          icon: <IconCheck size={18} />,
        });
        await fetchGroups();
      } else {
        notifications.show({
          title: "",
          message: data.message || "Failed to delete group",
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error deleting group: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleContactClick = async (contact: Contact) => {
    if (isCreatingGroup) {
      handleToggleSelectContact(contact);
      return;
    }

    const targetUserId = contact.username || contact.id.split("#")[1];

    if (!targetUserId) {
      notifications.show({
        title: "",
        message: "Invalid user ID for this contact.",
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    setStartingChatId(contact.id);

    try {
      const endpoint = withTargetUser(API_ENDPOINTS.START_CONVERSATION);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          user_id: targetUserId,
        }),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        navigate(`/chats/${targetUserId}`);
      } else {
        notifications.show({
          title: "",
          message: data.message || "Failed to start conversation.",
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error starting conversation: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setStartingChatId(null);
    }
  };

  const handleGroupClick = (group: GroupItem) => {
    const groupId = group._id.includes("#")
      ? group._id.split("#")[1]
      : group._id;
    navigate(`/chats/${groupId}`);
  };

  const handleDelete = async (contact: Contact) => {
    const contactUserId = contact.username || contact.id.split("#")[1];

    if (!contactUserId) {
      notifications.show({
        title: "",
        message: "User details or contact user ID missing.",
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${contact.name}?`,
    );
    if (!confirmDelete) return;

    setDeletingContactId(contact.id);

    try {
      const payload = {
        owner_user_id: target_user || userDetails?.username,
        contact_user_id: contactUserId,
      };

      const response = await fetch(withTargetUser(API_ENDPOINTS.CONTACTS), {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.success || response.ok) {
        notifications.show({
          title: "",
          message: data.message,
          color: "green",
          icon: <IconCheck size={18} />,
        });
        await fetchContacts();
      } else {
        notifications.show({
          title: "",
          message: data.message,
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error deleting contact: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setDeletingContactId(null);
    }
  };

  const filteredContacts = contacts.filter((item) => {
    const value = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(value) ||
      item.username.toLowerCase().includes(value) ||
      item.phone.includes(value) ||
      item.email.toLowerCase().includes(value)
    );
  });

  const filteredGroups = groups.filter((group) => {
    const value = search.toLowerCase();
    return (
      group.group_name.toLowerCase().includes(value) ||
      (group.group_description &&
        group.group_description.toLowerCase().includes(value))
    );
  });

  const handleAdd = () => {
    setSelectedContact(null);
    setOpened(true);
  };

  const handleEdit = async (contact: Contact) => {
    const contactUserId = contact.username || contact.id.split("#")[1];

    if (!contactUserId) {
      notifications.show({
        title: "",
        message: "Unable to find valid contact ID.",
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    setFetchingDetailsId(contact.id);

    try {
      const response = await fetch(
        withTargetUser(API_ENDPOINTS.CONTACTS) + `/${contactUserId}`,
        {
          method: "GET",
          headers: getHeaders(),
        },
      );

      const data = await response.json();

      if ((response.ok || data.success) && data.contact) {
        const fetched = data.contact;

        const updatedContact: Contact = {
          id: fetched._id || contact.id,
          username: fetched.contact_user_id || "",
          name: fetched.display_name || "",
          phone: fetched.phone || "",
          email: fetched.email || "",
          color: contact.color || "indigo",
        };

        setSelectedContact(updatedContact);
        setOpened(true);
      } else {
        notifications.show({
          title: "",
          message: data.message || "Failed to fetch contact details.",
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `Error fetching contact details: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setFetchingDetailsId(null);
    }
  };

  const handleSave = async (values: ContactFormValues, passNeeded: boolean) => {
    const contactUserId =
      values.username.split("#")[1] || values.username.trim();

    if (!selectedContact) {
      try {
        const contactData = {
          owner_user_id: target_user || userDetails?.username,
          contact_user_id: contactUserId,
          display_name: values.name.trim(),
          phone: values.phone,
          email: values.email,
        };

        const payload: Record<string, any> = {
          contact_data: contactData,
        };

        if (passNeeded && values.passKey?.trim()) {
          payload.pass = await encryptPasskey(
            values.passKey.trim(),
            contactUserId,
          );
        }

        const response = await fetch(withTargetUser(API_ENDPOINTS.CONTACTS), {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.success || response.ok) {
          notifications.show({
            title: "",
            message: data.message || "Contact added successfully",
            color: "green",
            icon: <IconCheck size={18} />,
          });
          await fetchContacts();
          setOpened(false);
        } else {
          notifications.show({
            title: "",
            message: data.message || "Failed to add contact.",
            color: "red",
            icon: <IconX size={18} />,
          });
        }
      } catch (error) {
        notifications.show({
          title: "",
          message: `Error adding contact: ${error}`,
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } else {
      try {
        const payload = {
          owner_user_id: target_user || userDetails?.username,
          contact_user_id: contactUserId,
          display_name: values.name.trim(),
          phone: values.phone,
          email: values.email,
        };

        const response = await fetch(withTargetUser(API_ENDPOINTS.CONTACTS), {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.success || response.ok) {
          notifications.show({
            title: "",
            message: data.message || "Contact updated successfully",
            color: "green",
            icon: <IconCheck size={18} />,
          });
          await fetchContacts();
          setOpened(false);
        } else {
          notifications.show({
            title: "",
            message: data.message || "Failed to update contact.",
            color: "red",
            icon: <IconX size={18} />,
          });
        }
      } catch (error) {
        notifications.show({
          title: "",
          message: `Error updating contact: ${error}`,
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    }
  };

  return (
    <div className="w-full h-full px-1">
      <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-100px)] overflow-hidden bg-white">
        <div
          className={`w-full md:w-7/12 bg-white ${
            isDetailActive ? "hidden md:block" : "block"
          }`}
        >
          <Stack p={{ base: "xs", sm: "md" }}>
            <Group justify="space-between" align="center">
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                color="indigo"
                variant="outline"
                radius="md"
              >
                <Tabs.List>
                  <Tabs.Tab
                    value="contacts"
                    leftSection={<IconUser size={16} />}
                    bg={
                      activeTab === "contacts"
                        ? "var(--mantine-color-blue-1)"
                        : undefined
                    }
                  >
                    Contact List
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="groups"
                    leftSection={<IconUsersGroup size={16} />}
                    bg={
                      activeTab === "groups"
                        ? "var(--mantine-color-blue-1)"
                        : undefined
                    }
                  >
                    Group List
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>

              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" size="lg" radius="md">
                    <IconSettings size={22} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAdd}
                  >
                    Add Contact
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconUsersGroup size={16} />}
                    onClick={() => {
                      setActiveTab("contacts");
                      setIsCreatingGroup(true);
                    }}
                  >
                    Create Group
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            {activeTab === "contacts" && (
              <>
                <Stack gap="xs">
                  {isCreatingGroup && (
                    <Group justify="space-between">
                      <Text size="xs" fw={600} c="indigo">
                        Select members for group
                      </Text>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          color="indigo"
                          onClick={handleCreateGroupSubmit}
                        >
                          Create Group ({selectedGroupContacts.length})
                        </Button>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => {
                            setIsCreatingGroup(false);
                            setSelectedGroupContacts([]);
                          }}
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  )}

                  {isCreatingGroup && selectedGroupContacts.length > 0 && (
                    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-md border border-gray-200 max-h-24 overflow-y-auto">
                      {selectedGroupContacts.map((c) => (
                        <Pill
                          key={c.id}
                          withRemoveButton
                          onRemove={() => handleRemoveGroupContact(c.id)}
                          color="indigo"
                        >
                          {c.name}
                        </Pill>
                      ))}
                    </div>
                  )}

                  <TextInput
                    radius="md"
                    size="md"
                    leftSection={<IconSearch size={18} />}
                    placeholder="Search contacts"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSearch(e.target.value)
                    }
                  />
                </Stack>

                <Card
                  withBorder
                  radius="md"
                  p={0}
                  style={{
                    height: "calc(100vh - 220px)",
                    overflowY: "auto",
                    width: "100%",
                  }}
                >
                  {loading ? (
                    <Text ta="center" py={60} c="dimmed">
                      Loading contacts...
                    </Text>
                  ) : filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => {
                      const isSelectedForGroup = selectedGroupContacts.some(
                        (c) => c.id === contact.id,
                      );

                      return (
                        <Group
                          key={contact.id}
                          justify="space-between"
                          px="md"
                          py="sm"
                          style={{
                            borderBottom: "1px solid #ececec",
                            transition: "0.2s",
                            cursor:
                              startingChatId === contact.id ||
                              deletingContactId === contact.id ||
                              fetchingDetailsId === contact.id
                                ? "wait"
                                : "pointer",
                            opacity:
                              startingChatId === contact.id ||
                              deletingContactId === contact.id ||
                              fetchingDetailsId === contact.id
                                ? 0.6
                                : 1,
                          }}
                          className="contact-row hover:bg-gray-50"
                          onClick={() => handleContactClick(contact)}
                        >
                          <Group gap="md">
                            {isCreatingGroup && (
                              <Checkbox
                                checked={isSelectedForGroup}
                                onChange={() =>
                                  handleToggleSelectContact(contact)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}

                            <Avatar color={contact.color} radius="xl" size={42}>
                              {contact.name
                                .split(" ")
                                .map((x) => x[0])
                                .join("")}
                            </Avatar>

                            <div>
                              <Text fw={700} size="sm">
                                {contact.name}
                              </Text>

                              <Text size="xs" c="dimmed">
                                {contact.username ? "@" : ""}
                                {contact.username}
                              </Text>
                            </div>
                          </Group>

                          {!isCreatingGroup && (
                            <Group gap="xs">
                              <ActionIcon
                                variant="subtle"
                                size="md"
                                radius="md"
                                loading={fetchingDetailsId === contact.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(contact);
                                }}
                              >
                                <IconEdit size={18} />
                              </ActionIcon>

                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="md"
                                radius="md"
                                loading={deletingContactId === contact.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(contact);
                                }}
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Group>
                          )}
                        </Group>
                      );
                    })
                  ) : (
                    <Text ta="center" py={60} c="dimmed">
                      No contacts found
                    </Text>
                  )}
                </Card>
              </>
            )}

            {activeTab === "groups" && (
              <>
                <TextInput
                  radius="md"
                  size="md"
                  leftSection={<IconSearch size={18} />}
                  placeholder="Search groups"
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                />

                <Card
                  withBorder
                  radius="md"
                  p={0}
                  style={{
                    height: "calc(100vh - 220px)",
                    overflowY: "auto",
                    width: "100%",
                  }}
                >
                  {groupsLoading ? (
                    <Text ta="center" py={60} c="dimmed">
                      Loading groups...
                    </Text>
                  ) : filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                      <Group
                        key={group._id}
                        justify="space-between"
                        px="md"
                        py="sm"
                        style={{
                          borderBottom: "1px solid #ececec",
                          transition: "0.2s",
                          cursor:
                            deletingGroupId === group._id ? "wait" : "pointer",
                          opacity: deletingGroupId === group._id ? 0.6 : 1,
                        }}
                        className="group-row hover:bg-gray-50"
                        onClick={() => handleGroupClick(group)}
                      >
                        <Group gap="md">
                          <Avatar
                            src={group.profile_url}
                            color="blue"
                            radius="xl"
                            size={42}
                          >
                            {group.group_name
                              .split(" ")
                              .map((x) => x[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </Avatar>

                          <div>
                            <Text fw={700} size="sm">
                              {group.group_name}
                            </Text>

                            <Text size="xs" c="dimmed">
                              {group.member_count}{" "}
                              {group.member_count === 1 ? "member" : "members"}
                            </Text>
                          </div>
                        </Group>

                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            size="md"
                            radius="md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditGroup(group);
                            }}
                          >
                            <IconEdit size={18} />
                          </ActionIcon>

                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="md"
                            radius="md"
                            loading={deletingGroupId === group._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group);
                            }}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    ))
                  ) : (
                    <Text ta="center" py={60} c="dimmed">
                      No groups found
                    </Text>
                  )}
                </Card>
              </>
            )}
          </Stack>
        </div>

        <div
          className={`w-full md:w-5/12 flex flex-col justify-center items-center ${
            isDetailActive ? "block" : "hidden md:flex"
          }`}
        >
          <Outlet />
        </div>
      </div>

      <ContactModal
        opened={opened}
        onClose={() => setOpened(false)}
        contact={selectedContact}
        onSave={handleSave}
      />

      <CreateGroupModal
        opened={groupModalOpened}
        onClose={() => {
          setGroupModalOpened(false);
          setSelectedGroup(null);
        }}
        selectedContacts={selectedGroup ? contacts : selectedGroupContacts}
        initialGroup={selectedGroup}
        onSaveGroup={handleSaveGroupPayload}
        loading={creatingGroupLoading}
      />
    </div>
  );
};

export default Contact;
