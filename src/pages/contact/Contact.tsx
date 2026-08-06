import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconEdit, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import ContactModal from "./ContactModal";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth/auth.store";
import { API_ENDPOINTS } from "../../utils/constant";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useConversationTypeStore } from "../../store/conversation/conversation.type.store";

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

    const setType = useConversationTypeStore((state) => state.setType);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [startingChatId, setStartingChatId] = useState<string | number | null>(
    null,
  );
  const [deletingContactId, setDeletingContactId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState<string>("");
  const [opened, setOpened] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const isDetailActive = location.pathname.split("/").length > 3;

  const token = useAuthStore.getState().accessToken;
  const userDetails = useAuthStore.getState().userDetails;

  // Authorization Function
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
            username: item.username || item.contact_user_id || "",
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
          message: `"Failed to fetch contacts.`,
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "",
        message: `"Error fetching contacts:", ${error}`,
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

  const handleContactClick = async (contact: Contact) => {
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
        setType("dm")
        navigate(`/chats/${encodeURIComponent(contact.id)}`);
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
        message: `"Error starting conversation:", ${error}`,
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
        message: `"Error deleting contact:", ${error}`,
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

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setOpened(true);
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
          message: `"Error adding contact:", ${error}`,
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } else {
      setContacts((prev) =>
        prev.map((item) =>
          item.id === selectedContact.id ? { ...item, ...values } : item,
        ),
      );
      setOpened(false);
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

              <Button
                radius="md"
                size="sm"
                color="indigo"
                leftSection={<IconPlus size={16} />}
                onClick={handleAdd}
              >
                Add
              </Button>
            </Group>

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
                      transition: "0.2s",
                      cursor:
                        startingChatId === contact.id ||
                        deletingContactId === contact.id
                          ? "wait"
                          : "pointer",
                      opacity:
                        startingChatId === contact.id ||
                        deletingContactId === contact.id
                          ? 0.6
                          : 1,
                    }}
                    className="contact-row hover:bg-gray-50"
                    onClick={() => handleContactClick(contact)}
                  >
                    <Group gap="md">
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

                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        size="md"
                        radius="md"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact);
                        }}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Group>
                ))
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
