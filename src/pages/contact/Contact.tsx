import { useState } from "react";
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
import { IconEdit, IconPlus, IconSearch } from "@tabler/icons-react";
import ContactModal from "./ContactModal";
import { Outlet, useLocation } from "react-router";

export interface Contact {
  id: number;
  username: string;
  name: string;
  phone: string;
  email: string;
  color: string;
}

export type ContactFormValues = Omit<Contact, "id" | "color"> & {
  color?: string;
};

const initialContacts: Contact[] = [
  {
    id: 1,
    username: "alice.johnson",
    name: "Alice Johnson",
    phone: "9876543210",
    email: "alice@gmail.com",
    color: "indigo",
  },
  {
    id: 2,
    username: "mark.smith",
    name: "Mark Smith",
    phone: "9876543211",
    email: "mark@gmail.com",
    color: "teal",
  },
  {
    id: 3,
    username: "david.wilson",
    name: "David Wilson",
    phone: "9876543212",
    email: "david@gmail.com",
    color: "orange",
  },
  {
    id: 4,
    username: "emma.watson",
    name: "Emma Watson",
    phone: "9876543213",
    email: "emma@gmail.com",
    color: "blue",
  },
  {
    id: 5,
    username: "sophia.miller",
    name: "Sophia Miller",
    phone: "9876543214",
    email: "sophia@gmail.com",
    color: "grape",
  },
];

const Contact = () => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [search, setSearch] = useState<string>("");
  const [opened, setOpened] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const location = useLocation();

  const isDetailActive = location.pathname.split("/").length > 3;

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

  const handleSave = (values: ContactFormValues) => {
    if (selectedContact) {
      setContacts((prev) =>
        prev.map((item) =>
          item.id === selectedContact.id
            ? {
                ...item,
                ...values,
              }
            : item,
        ),
      );
    } else {
      setContacts((prev) => [
        ...prev,
        {
          id: Date.now(),
          color: values.color || "violet",
          ...values,
        },
      ]);
    }

    setOpened(false);
  };

  return (
    <div className="w-full px-1 md:w-11/12 mx-auto">
      <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-100px)] shadow rounded-lg overflow-hidden bg-white">
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
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <Group
                    key={contact.id}
                    justify="space-between"
                    px="md"
                    py="sm"
                    style={{
                      borderBottom: "1px solid #ececec",
                      transition: "0.2s",
                      cursor: "pointer",
                    }}
                    className="contact-row hover:bg-gray-50"
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
                          @{contact.username}
                        </Text>
                      </div>
                    </Group>

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
          className={`w-full md:w-5/12 border-t md:border-t-0 md:border-l border-gray-200 bg-gray-100 flex flex-col justify-center items-center ${
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
