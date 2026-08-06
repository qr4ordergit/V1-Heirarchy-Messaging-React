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
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconCheck,
  IconEdit,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTrash,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";
import ContactModal from "./ContactModal";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth/auth.store";
import { API_ENDPOINTS } from "../../utils/constant";
import { notifications } from "@mantine/notifications";

export interface Contact {
  id: string;
  username: string;
  name: string;
  phone: string;
  email: string;
  color: string;
}

export type ContactFormValues = Omit<Contact, "id" | "color"> & {
  color?: string;
};

const Contact = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingDetailsId, setFetchingDetailsId] = useState<string | null>(
    null,
  );
  const [startingChatId, setStartingChatId] = useState<string | number | null>(
    null,
  );
  const [deletingContactId, setDeletingContactId] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState<string>("");
  const [opened, setOpened] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
  const [selectedGroupContacts, setSelectedGroupContacts] = useState<Contact[]>(
    [],
  );

  const location = useLocation();
  const navigate = useNavigate();
  const isDetailActive = location.pathname.split("/").length > 3;

  const token = useAuthStore.getState().accessToken;
  const userDetails = useAuthStore.getState().userDetails;

  const getHeaders = (): Record<string, string> => ({
    Authorization: token ?? "",
    "Content-Type": "application/json",
  });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.CONTACTS}`, {
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

  useEffect(() => {
    fetchContacts();
  }, []);

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

    notifications.show({
      title: "Group Mode",
      message: `Creating group with ${selectedGroupContacts.length} contacts.`,
      color: "green",
      icon: <IconCheck size={18} />,
    });

    // Reset mode
    setIsCreatingGroup(false);
    setSelectedGroupContacts([]);
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
      const endpoint =
        API_ENDPOINTS.START_CONVERSATION ||
        "https://u2hjtodeyl.execute-api.ap-south-1.amazonaws.com/dev/api/start-conversation";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          user_id: targetUserId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
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

  const handleDelete = async (contact: Contact) => {
    const contactUserId = contact.username || contact.id.split("#")[1];

    if (!userDetails?.username || !contactUserId) {
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
        owner_user_id: userDetails.username,
        contact_user_id: contactUserId,
      };

      const response = await fetch(API_ENDPOINTS.CONTACTS, {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.success) {
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
        `${API_ENDPOINTS.CONTACTS}/${contactUserId}`,
        {
          method: "GET",
          headers: getHeaders(),
        },
      );

      const data = await response.json();

      if (response.ok && data.success && data.contact) {
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

  const handleSave = async (values: ContactFormValues) => {
    const contactUserId = values.username.split("#")[1] || values.username;

    if (!selectedContact) {
      try {
        const payload = {
          owner_user_id: userDetails?.username,
          contact_user_id: contactUserId,
          display_name: values.name.trim(),
          phone: values.phone,
          email: values.email,
        };

        const response = await fetch(API_ENDPOINTS.CONTACTS, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.success) {
          notifications.show({
            title: "",
            message: data.message,
            color: "green",
            icon: <IconCheck size={18} />,
          });
          await fetchContacts();
          setOpened(false);
        } else if (data.status === 409) {
          notifications.show({
            title: "",
            message: "This contact is already added.",
            color: "red",
            icon: <IconX size={18} />,
          });
        } else if (data.status === 400) {
          notifications.show({
            title: "",
            message: "You cannot add yourself as a contact.",
            color: "red",
            icon: <IconX size={18} />,
          });
        } else if (data.status === 404) {
          notifications.show({
            title: "",
            message: "The specified contact user does not exist.",
            color: "red",
            icon: <IconX size={18} />,
          });
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
          message: `Error adding contact: ${error}`,
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } else {
      try {
        const payload = {
          owner_user_id: userDetails?.username,
          contact_user_id: contactUserId,
          display_name: values.name.trim(),
          phone: values.phone,
          email: values.email,
        };

        const response = await fetch(API_ENDPOINTS.CONTACTS, {
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
    <div className="w-full px-1 md:w-11/12">
      <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-100px)] overflow-hidden bg-white">
        <div
          className={`w-full md:w-7/12 bg-white ${
            isDetailActive ? "hidden md:block" : "block"
          }`}
        >
          <Stack p={{ base: "xs", sm: "md" }}>
            <Group justify="space-between">
              <Title order={3} size="h2">
                Contact List
              </Title>

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
                    onClick={() => setIsCreatingGroup(true)}
                  >
                    Create Group
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

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
                            onChange={() => handleToggleSelectContact(contact)}
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
    </div>
  );
};

export default Contact;
