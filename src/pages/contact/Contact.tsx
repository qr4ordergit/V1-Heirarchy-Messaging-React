import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Checkbox,
  Group,
  Pill,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconDoorExit,
  IconEdit,
  IconPlus,
  IconSearch,
  IconShare,
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
} from "../../api/contactApi";

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

  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null);
  const [fetchingDetailsId, setFetchingDetailsId] = useState<string | null>(
    null,
  );
  const [startingChatId, setStartingChatId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(
    null,
  );
  const [sharingGroupId, setSharingGroupId] = useState<string | null>(null);
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

  const handleToggleSelectContact = (contact: Contact) => {
    setSelectedGroupContacts((prev) =>
      prev.some((c) => c.id === contact.id)
        ? prev.filter((c) => c.id !== contact.id)
        : [...prev, contact],
    );
  };

  const handleShareGroup = async (group: GroupItem) => {
    setSharingGroupId(group._id);
    let inviteUrl = "";

    if (group.invites && group.invites.length > 0) {
      inviteUrl = `${window.location.origin}/invites/${group.invites[0]}`;
    } else {
      const generated = await createInviteLinkApi(group._id, group.created_by);
      if (generated) inviteUrl = generated;
    }

    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Join ${group.group_name}`,
            text: `Join our group "${group.group_name}" on Chat Hub:`,
            url: inviteUrl,
          });
        } catch {}
      }
    }
    setSharingGroupId(null);
  };

  const handleLeaveGroup = async (group: GroupItem) => {
    if (
      !window.confirm(`Are you sure you want to leave "${group.group_name}"?`)
    )
      return;
    setLeavingGroupId(group._id);
    const ok = await leaveGroupApi(group._id);
    if (ok) await fetchGroups();
    setLeavingGroupId(null);
  };

  const handleDeleteGroup = async (group: GroupItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete group "${group.group_name}"?`,
      )
    )
      return;
    setDeletingGroupId(group._id);
    const ok = await deleteGroupApi(group._id);
    if (ok) await fetchGroups();
    setDeletingGroupId(null);
  };

  const handleContactClick = async (contact: Contact) => {
    if (isCreatingGroup) {
      handleToggleSelectContact(contact);
      return;
    }
    const targetUserId = contact.id.split("#")[1];
    if (!targetUserId) return;

    setStartingChatId(contact.id);
    const ok = await startConversationApi(targetUserId);
    setStartingChatId(null);

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

    setDeletingContactId(contact.id);
    const ok = await deleteContactApi(contactUserId, currentUsername);
    if (ok) await fetchContacts();
    setDeletingContactId(null);
  };

  const handleEditContact = async (contact: Contact) => {
    const contactUserId = contact.username || contact.id.split("#")[1];
    if (!contactUserId) return;

    setFetchingDetailsId(contact.id);
    const fetched = await getContactDetailsApi(contactUserId);
    setFetchingDetailsId(null);

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

  const filteredContacts = contacts.filter((item) => {
    const val = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(val) ||
      item.username.toLowerCase().includes(val) ||
      item.phone.includes(val) ||
      item.email.toLowerCase().includes(val)
    );
  });

  const filteredGroups = groups.filter((g) => {
    const val = search.toLowerCase();
    return (
      g.group_name.toLowerCase().includes(val) ||
      (g.group_description && g.group_description.toLowerCase().includes(val))
    );
  });

  return (
    <div className="w-full h-full px-1">
      <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-100px)] overflow-hidden bg-white">
        <div
          className={`w-full md:w-7/12 bg-white ${isDetailActive ? "hidden md:block" : "block"}`}
        >
          <Stack p={{ base: "xs", sm: "md" }}>
            <Group justify="space-between" align="center">
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
                          onClick={() => {
                            if (selectedGroupContacts.length === 0) return;
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
                              checked={selectedGroupContacts.some(
                                (c) => c.id === contact.id,
                              )}
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
                                handleEditContact(contact);
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
                                handleDeleteContact(contact);
                              }}
                            >
                              <IconTrash size={18} />
                            </ActionIcon>
                          </Group>
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
                              deletingGroupId === group._id ||
                              leavingGroupId === group._id
                                ? "wait"
                                : "pointer",
                            opacity:
                              deletingGroupId === group._id ||
                              leavingGroupId === group._id
                                ? 0.6
                                : 1,
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

                          <Group gap="xs">
                            {isAdmin && (
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
                            )}

                            {isCreator && (
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
                            )}

                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              size="md"
                              radius="md"
                              loading={sharingGroupId === group._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareGroup(group);
                              }}
                            >
                              <IconShare size={18} />
                            </ActionIcon>

                            <ActionIcon
                              variant="subtle"
                              color="orange"
                              size="md"
                              radius="md"
                              loading={leavingGroupId === group._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveGroup(group);
                              }}
                            >
                              <IconDoorExit size={18} />
                            </ActionIcon>
                          </Group>
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
