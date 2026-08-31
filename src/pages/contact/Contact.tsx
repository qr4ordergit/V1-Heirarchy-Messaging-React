import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Menu,
  Paper,
  Pill,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconDoorExit,
  IconDotsVertical,
  IconEdit,
  IconLink,
  IconMailCheck,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUser,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";
import ContactModal from "../../component/modal/ContactModal";
import CreateGroupModal from "../../component/modal/CreateGroupModal";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth/auth.store";
import { useConversationTypeStore } from "../../store/conversation/conversation.type.store";
import {
  getContactsApi,
  getGroupsApi,
  getContactDetailsApi,
  saveContactApi,
  deleteContactApi,
  deleteGroupApi,
  leaveGroupApi,
  startConversationApi,
  createInviteLinkApi,
  saveGroupPayloadApi,
  getPendingInviteApi,
  acceptInviteApi,
  rejectInviteApi,
  type InviteInformation,
  copyToClipboardSafely,
} from "../../api/contactApi";
import { notifications } from "@mantine/notifications";

export interface Contact {
  id: string;
  username: string;
  name: string;
  phone: string;
  email: string;
  color: string;
  profile_picture?: string;
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
  invites?: string[];
  soft_deleted?: boolean;
}

export type ContactFormValues = Omit<Contact, "id" | "color"> & {
  color?: string;
  passKey?: string;
};

const Contact = () => {
  const setType = useConversationTypeStore((state) => state.setType);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [pendingInvite, setPendingInvite] = useState<InviteInformation | null>(
    null,
  );
  const [inviteActionLoading, setInviteActionLoading] = useState(false);

  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [creatingGroupLoading, setCreatingGroupLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<string | null>("contacts");
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedGroupContacts, setSelectedGroupContacts] = useState<Contact[]>(
    [],
  );
  const [groupModalOpened, setGroupModalOpened] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isDetailActive = location.pathname.split("/").length > 3;

  const userDetails = useAuthStore((state) => state.userDetails);
  const target_user = useAuthStore((state) => state.target_user);
  const currentUsername = target_user || userDetails?.username || "";

  const fetchContacts = async () => {
    setLoading(true);
    const data = await getContactsApi();
    if (data) setContacts(data);
    setLoading(false);
  };

  const fetchGroups = async () => {
    setGroupsLoading(true);
    const data = await getGroupsApi();
    if (data) setGroups(data);

    const storedInviteCode = localStorage.getItem("group_invite_code");
    if (storedInviteCode && currentUsername) {
      const inviteData = await getPendingInviteApi(storedInviteCode);
      setPendingInvite(inviteData);
    } else {
      setPendingInvite(null);
    }
    setGroupsLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    if (value === "groups") fetchGroups();
    else fetchContacts();
  };

  const handleInviteAction = async (accept: boolean) => {
    const inviteCode = localStorage.getItem("group_invite_code");
    if (!inviteCode) return;

    setInviteActionLoading(true);
    const ok = accept
      ? await acceptInviteApi(inviteCode, currentUsername)
      : await rejectInviteApi(inviteCode);
    setInviteActionLoading(false);

    if (ok) {
      localStorage.removeItem("group_invite_code");
      setPendingInvite(null);
      if (accept) await fetchGroups();
    }
  };

  const handleShareGroup = async (group: GroupItem) => {
    setActiveActionId(group._id);
    try {
      let inviteUrl = group.invites?.[0]
        ? `${window.location.origin}/#/invites/${group.invites[0]}`
        : "";

      if (!inviteUrl) {
        const generated = await createInviteLinkApi(
          group._id,
          group.created_by,
        );
        if (generated) {
          inviteUrl = `${window.location.origin}/#/invites/${generated}`;
        }
      }

      if (!inviteUrl) return;

      const copied = await copyToClipboardSafely(inviteUrl);

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Join ${group.group_name}`,
            text: `Join our group "${group.group_name}" on Chat Hub:`,
            url: inviteUrl,
          });
          return;
        } catch (err: any) {
          if (err.name === "AbortError") return;
        }
      }

      if (copied) {
        notifications.show({
          title: "",
          message: "Invite link copied to clipboard!",
          color: "green",
          icon: <IconCheck size={18} />,
        });
      }
    } finally {
      setActiveActionId(null);
    }
  };

  const handleLeaveGroup = async (group: GroupItem) => {
    if (
      !window.confirm(`Are you sure you want to leave "${group.group_name}"?`)
    )
      return;
    setActiveActionId(group._id);
    const ok = await leaveGroupApi(group._id);
    if (ok) await fetchGroups();
    setActiveActionId(null);
  };

  const handleDeleteGroup = async (group: GroupItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete group "${group.group_name}"?`,
      )
    )
      return;
    setActiveActionId(group._id);
    const ok = await deleteGroupApi(group._id);
    if (ok) await fetchGroups();
    setActiveActionId(null);
  };

  const handleContactClick = async (contact: Contact) => {
    if (isCreatingGroup) {
      setSelectedGroupContacts((prev) =>
        prev.some((c) => c.id === contact.id)
          ? prev.filter((c) => c.id !== contact.id)
          : [...prev, contact],
      );
      return;
    }
    const targetUserId = contact.id.split("#")[1];
    if (!targetUserId) return;

    setActiveActionId(contact.id);
    const ok = await startConversationApi(targetUserId);
    setActiveActionId(null);

    if (ok) {
      setType("dm");
      navigate(`/chats/${encodeURIComponent(contact.id)}`);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    const contactUserId = contact.username || contact.id.split("#")[1];
    if (
      !contactUserId ||
      !window.confirm(`Are you sure you want to delete ${contact.name}?`)
    )
      return;

    setActiveActionId(contact.id);
    const ok = await deleteContactApi(contactUserId, currentUsername);
    if (ok) await fetchContacts();
    setActiveActionId(null);
  };

  const handleEditContact = async (contact: Contact) => {
    const contactUserId = contact.username || contact.id.split("#")[1];
    if (!contactUserId) return;

    setActiveActionId(contact.id);
    const fetched = await getContactDetailsApi(contactUserId);
    setActiveActionId(null);

    if (fetched) {
      setSelectedContact({
        id: fetched._id || contact.id,
        username: fetched.contact_user_id || "",
        name: fetched.display_name || "",
        phone: fetched.phone || "",
        email: fetched.email || "",
        color: contact.color || "indigo",
      });
      setOpened(true);
    }
  };

  const handleSaveContact = async (
    values: ContactFormValues,
    passNeeded: boolean,
  ) => {
    const ok = await saveContactApi(
      values,
      passNeeded,
      Boolean(selectedContact),
      currentUsername,
    );
    if (ok) {
      await fetchContacts();
      setOpened(false);
    }
  };

  const handleSaveGroupPayload = async (
    payload: Record<string, any>,
    isEdit: boolean,
  ) => {
    setCreatingGroupLoading(true);
    const ok = await saveGroupPayloadApi(payload, isEdit, selectedGroup?._id);
    setCreatingGroupLoading(false);

    if (ok) {
      setGroupModalOpened(false);
      setIsCreatingGroup(false);
      setSelectedGroupContacts([]);
      setSelectedGroup(null);
      fetchGroups();
    }
  };

  const query = search.toLowerCase();
  const filteredContacts = contacts.filter((c) =>
    [c.name, c.username, c.phone, c.email].some((v) =>
      v.toLowerCase().includes(query),
    ),
  );
  const filteredGroups = groups.filter((g) =>
    [g.group_name, g.group_description || ""].some((v) =>
      v.toLowerCase().includes(query),
    ),
  );

  return (
    <div className="w-full h-full px-1">
      <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-100px)] overflow-hidden bg-white">
        <div
          className={`w-full md:w-7/12 bg-white ${isDetailActive ? "hidden md:block" : "block"}`}
        >
          <Stack p={{ base: "xs", sm: "md" }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              color="indigo"
              variant="outline"
              radius="md"
              className="w-full"
              styles={{
                tab: { paddingInline: 8 },
                tabSection: { marginInline: 4 },
              }}
            >
              <Tabs.List grow>
                <Tabs.Tab
                  value="contacts"
                  leftSection={<IconUser size={16} />}
                  rightSection={
                    <ActionIcon
                      component="div"
                      role="button"
                      tabIndex={0}
                      size="xs"
                      variant="subtle"
                      color="indigo"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContact(null);
                        setOpened(true);
                      }}
                    >
                      <IconPlus size={14} />
                    </ActionIcon>
                  }
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
                  rightSection={
                    <ActionIcon
                      component="div"
                      role="button"
                      tabIndex={0}
                      size="xs"
                      variant="subtle"
                      color="indigo"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab("contacts");
                        setIsCreatingGroup(true);
                      }}
                    >
                      <IconPlus size={14} />
                    </ActionIcon>
                  }
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
                          onClick={() => {
                            if (!selectedGroupContacts.length) return;
                            setSelectedGroup(null);
                            setGroupModalOpened(true);
                          }}
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
                          onRemove={() =>
                            setSelectedGroupContacts((prev) =>
                              prev.filter((item) => item.id !== c.id),
                            )
                          }
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
                    filteredContacts.map((contact) => (
                      <Group
                        key={contact.id}
                        justify="space-between"
                        px="md"
                        py="sm"
                        style={{
                          borderBottom: "1px solid #ececec",
                          cursor:
                            activeActionId === contact.id ? "wait" : "pointer",
                          opacity: activeActionId === contact.id ? 0.6 : 1,
                        }}
                        className="contact-row hover:bg-gray-50"
                        onClick={() => handleContactClick(contact)}
                      >
                        <Group gap="md">
                          {isCreatingGroup && (
                            <Checkbox
                              checked={selectedGroupContacts.some(
                                (c) => c.id === contact.id,
                              )}
                              onChange={() => {}}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGroupContacts((prev) =>
                                  prev.some((c) => c.id === contact.id)
                                    ? prev.filter((c) => c.id !== contact.id)
                                    : [...prev, contact],
                                );
                              }}
                            />
                          )}

                          <Avatar
                            src={
                              contact.profile_picture &&
                              contact.profile_picture !== "NA"
                                ? contact.profile_picture
                                : null
                            }
                            color={contact.color || "indigo"}
                            radius="xl"
                            size={42}
                          >
                            {contact.name
                              ? contact.name
                                  .split(" ")
                                  .map((x) => x[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : "U"}
                          </Avatar>

                          <div>
                            <Text fw={700} size="sm">
                              {contact.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {contact.username ? `@${contact.username}` : ""}
                            </Text>
                          </div>
                        </Group>

                        {!isCreatingGroup && (
                          <>
                            <Group gap="xs" visibleFrom="sm">
                              <Tooltip label="Edit Contact" withArrow>
                                <ActionIcon
                                  variant="subtle"
                                  size="md"
                                  radius="md"
                                  loading={activeActionId === contact.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditContact(contact);
                                  }}
                                >
                                  <IconEdit size={18} />
                                </ActionIcon>
                              </Tooltip>

                              <Tooltip label="Delete Contact" withArrow>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  size="md"
                                  radius="md"
                                  loading={activeActionId === contact.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteContact(contact);
                                  }}
                                >
                                  <IconTrash size={18} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>

                            <Menu
                              shadow="md"
                              width={160}
                              position="bottom-end"
                              withinPortal
                            >
                              <Menu.Target>
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  size="md"
                                  radius="md"
                                  hiddenFrom="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconDotsVertical size={18} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Menu.Item
                                  leftSection={<IconEdit size={16} />}
                                  onClick={() => handleEditContact(contact)}
                                >
                                  Edit
                                </Menu.Item>
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={16} />}
                                  onClick={() => handleDeleteContact(contact)}
                                >
                                  Delete
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </>
                        )}
                      </Group>
                    ))
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

                {pendingInvite?.resource_information && (
                  <Paper
                    withBorder
                    p="xs"
                    radius="md"
                    className="border-indigo-200 bg-indigo-50/50"
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                        <Avatar color="indigo" radius="xl" size={38}>
                          <IconMailCheck size={20} />
                        </Avatar>
                        <div>
                          <Group gap={6} align="center">
                            <Text size="sm" fw={700}>
                              {pendingInvite.resource_information.name ||
                                (pendingInvite.resource_information as any)
                                  .group_name}
                            </Text>
                            <Badge size="xs" variant="light" color="indigo">
                              Invite
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed">
                            You were invited to join this group
                          </Text>
                        </div>
                      </Group>

                      <Group gap={6} wrap="nowrap">
                        <Tooltip label="Accept Invite" withArrow>
                          <ActionIcon
                            variant="filled"
                            color="green"
                            radius="xl"
                            size="md"
                            loading={inviteActionLoading}
                            onClick={() => handleInviteAction(true)}
                          >
                            <IconCheck size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Decline Invite" withArrow>
                          <ActionIcon
                            variant="light"
                            color="red"
                            radius="xl"
                            size="md"
                            loading={inviteActionLoading}
                            onClick={() => handleInviteAction(false)}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Paper>
                )}

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
                    filteredGroups.map((group) => {
                      const isCreator = group.created_by === currentUsername;
                      const isAdmin =
                        Array.isArray(group.admins) &&
                        group.admins.includes(currentUsername);

                      return (
                        <Group
                          key={group._id}
                          justify="space-between"
                          px="md"
                          py="sm"
                          style={{
                            borderBottom: "1px solid #ececec",
                            cursor:
                              activeActionId === group._id ? "wait" : "pointer",
                            opacity: activeActionId === group._id ? 0.6 : 1,
                          }}
                          className="group-row hover:bg-gray-50"
                          onClick={() => {
                            setType("groups");
                            navigate(`/chats/${encodeURIComponent(group._id)}`);
                          }}
                        >
                          <Group gap="md">
                            <Avatar
                              src={group.profile_url || null}
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
                                {group.member_count === 1
                                  ? "member"
                                  : "members"}
                              </Text>
                            </div>
                          </Group>

                          <Group gap="xs" visibleFrom="sm">
                            {isAdmin && (
                              <Tooltip label="Edit Group" withArrow>
                                <ActionIcon
                                  variant="subtle"
                                  size="md"
                                  radius="md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedGroup(group);
                                    setGroupModalOpened(true);
                                  }}
                                >
                                  <IconEdit size={18} />
                                </ActionIcon>
                              </Tooltip>
                            )}

                            {isCreator && (
                              <Tooltip label="Delete Group" withArrow>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  size="md"
                                  radius="md"
                                  loading={activeActionId === group._id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteGroup(group);
                                  }}
                                >
                                  <IconTrash size={18} />
                                </ActionIcon>
                              </Tooltip>
                            )}

                            <Tooltip label="Invite Link" withArrow>
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                size="md"
                                radius="md"
                                loading={activeActionId === group._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareGroup(group);
                                }}
                              >
                                <IconLink size={18} />
                              </ActionIcon>
                            </Tooltip>

                            <Tooltip label="Leave Group" withArrow>
                              <ActionIcon
                                variant="subtle"
                                color="orange"
                                size="md"
                                radius="md"
                                loading={activeActionId === group._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveGroup(group);
                                }}
                              >
                                <IconDoorExit size={18} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>

                          <Menu
                            shadow="md"
                            width={170}
                            position="bottom-end"
                            withinPortal
                          >
                            <Menu.Target>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="md"
                                radius="md"
                                hiddenFrom="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <IconDotsVertical size={18} />
                              </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                              {isAdmin && (
                                <Menu.Item
                                  leftSection={<IconEdit size={16} />}
                                  onClick={() => {
                                    setSelectedGroup(group);
                                    setGroupModalOpened(true);
                                  }}
                                >
                                  Edit Group
                                </Menu.Item>
                              )}

                              <Menu.Item
                                leftSection={<IconLink size={16} />}
                                onClick={() => handleShareGroup(group)}
                              >
                                Invite Link
                              </Menu.Item>

                              <Menu.Item
                                color="orange"
                                leftSection={<IconDoorExit size={16} />}
                                onClick={() => handleLeaveGroup(group)}
                              >
                                Leave Group
                              </Menu.Item>

                              {isCreator && (
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={16} />}
                                  onClick={() => handleDeleteGroup(group)}
                                >
                                  Delete Group
                                </Menu.Item>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      );
                    })
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
          className={`w-full md:w-5/12 flex flex-col justify-center items-center ${isDetailActive ? "block" : "hidden md:flex"}`}
        >
          <Outlet />
        </div>
      </div>

      <ContactModal
        opened={opened}
        onClose={() => setOpened(false)}
        contact={selectedContact}
        onSave={handleSaveContact}
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
        onGroupUpdated={fetchGroups}
        loading={creatingGroupLoading}
      />
    </div>
  );
};

export default Contact;
