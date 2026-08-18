import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Button, Grid, Modal, Stack, TextInput } from "@mantine/core";
import type { Contact, ContactFormValues } from "./Contact";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import {
  API_ENDPOINTS,
  getHeaders,
  withTargetUser,
} from "../../utils/constant";

interface ContactModalProps {
  opened: boolean;
  onClose: () => void;
  contact: Contact | null;
  onSave: (values: ContactFormValues, passNeeded: boolean) => Promise<void>;
  loading?: boolean;
}

type FormState = ContactFormValues;

const ContactModal = ({
  opened,
  onClose,
  contact,
  onSave,
  loading = false,
}: ContactModalProps) => {
  const [form, setForm] = useState<FormState>({
    username: "",
    name: "",
    phone: "",
    email: "",
    passKey: "",
  });

  const [showPassKeyField, setShowPassKeyField] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  useEffect(() => {
    if (contact) {
      setForm({
        username: contact.username,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        passKey: "",
      });
      setShowPassKeyField(false);
    } else {
      setForm({
        username: "",
        name: "",
        phone: "",
        email: "",
        passKey: "",
      });
      setShowPassKeyField(false);
    }
  }, [contact, opened]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const contactUserId = form.username.split("#")[1] || form.username.trim();

    if (!contactUserId) {
      notifications.show({
        title: "",
        message: "Username is required.",
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    if (!form.name.trim()) {
      notifications.show({
        title: "",
        message: "Name is required.",
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    if (contact) {
      await onSave(form, false);
      return;
    }

    if (!showPassKeyField) {
      setVerifying(true);
      try {
        const response = await fetch(
          withTargetUser(API_ENDPOINTS.VERIFY_USER),
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              contact_user_id: contactUserId,
            }),
          },
        );

        const data = await response.json();

        if (response.ok || data.success) {
          if (data.pass_needed) {
            setShowPassKeyField(true);
            notifications.show({
              title: "Pass Key Required",
              message: "Please enter the pass key to add this contact.",
              color: "blue",
            });
          } else {
            await onSave(form, false);
          }
        } else {
          notifications.show({
            title: "",
            message: data.message || "Failed to verify user.",
            color: "red",
            icon: <IconX size={18} />,
          });
        }
      } catch (error) {
        notifications.show({
          title: "",
          message: `Error verifying user: ${error}`,
          color: "red",
          icon: <IconX size={18} />,
        });
      } finally {
        setVerifying(false);
      }
    } else {
      if (!form.passKey?.trim()) {
        notifications.show({
          title: "",
          message: "Please enter the required pass key.",
          color: "red",
          icon: <IconX size={18} />,
        });
        return;
      }
      await onSave(form, true);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      size="lg"
      title={
        <span style={{ fontSize: 26, fontWeight: 700 }}>
          {contact ? "Edit Contact" : "Add Contact"}
        </span>
      }
    >
      <Stack mt="md">
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Username"
              placeholder="Enter username"
              value={form.username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                handleChange("username", e.target.value);
                setShowPassKeyField(false);
              }}
              disabled={Boolean(contact)}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Name"
              placeholder="Enter name"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange("name", e.target.value)
              }
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Phone Number"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange("phone", e.target.value)
              }
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Email"
              placeholder="Enter email"
              value={form.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange("email", e.target.value)
              }
            />
          </Grid.Col>

          {!contact && showPassKeyField && (
            <Grid.Col span={{ base: 12, sm: 12 }}>
              <TextInput
                label="Pass Key"
                placeholder="Enter pass key"
                required
                value={form.passKey || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange("passKey", e.target.value)
                }
              />
            </Grid.Col>
          )}
        </Grid>

        <Button
          mt="md"
          fullWidth
          loading={loading || verifying}
          onClick={handleSubmit}
        >
          {contact
            ? "Save Changes"
            : showPassKeyField
              ? "Submit Contact with Pass Key"
              : "Save Contact"}
        </Button>
      </Stack>
    </Modal>
  );
};

export default ContactModal;
