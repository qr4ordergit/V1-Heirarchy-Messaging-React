import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Button, Grid, Modal, Stack, TextInput } from "@mantine/core";
import type { Contact, ContactFormValues } from "./Contact";

interface ContactModalProps {
  opened: boolean;
  onClose: () => void;
  contact: Contact | null;
  onSave: (values: ContactFormValues) => void;
}

type FormState = ContactFormValues;

const ContactModal = ({
  opened,
  onClose,
  contact,
  onSave,
}: ContactModalProps) => {
  const [form, setForm] = useState<FormState>({
    username: "",
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (contact) {
      setForm({
        username: contact.username,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
      });
    } else {
      setForm({
        username: "",
        name: "",
        phone: "",
        email: "",
      });
    }
  }, [contact, opened]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (!form.username || !form.name || !form.phone || !form.email) {
      alert("Please fill all fields");
      return;
    }

    onSave(form);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      size="lg"
      title={
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
          }}
        >
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
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange("username", e.target.value)
              }
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
        </Grid>

        <Button mt="md" fullWidth onClick={handleSubmit}>
          {contact ? "Save Changes" : "Save Contact"}
        </Button>
      </Stack>
    </Modal>
  );
};

export default ContactModal;
