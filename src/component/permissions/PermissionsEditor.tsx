import { Divider, Group, Stack, Switch, Text } from "@mantine/core";
import type { PermissionsTree } from "../../api/permissionsApi";
import classes from "./PermissionsEditor.module.css";

interface PermissionsEditorProps {
  tree: PermissionsTree;
  onToggle: (path: string[]) => void;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      size="xs"
      fw={700}
      tt="uppercase"
      c="dimmed"
      className={classes.sectionLabel}
      mb="xs"
    >
      {children}
    </Text>
  );
}

function ToggleRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: boolean;
  onClick: () => void;
}) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm">{label}</Text>
      <Switch checked={value} onChange={onClick} />
    </Group>
  );
}

function EmphasizedToggleRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: boolean;
  onClick: () => void;
}) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text
        size="xs"
        fw={700}
        tt="uppercase"
        c="dimmed"
        className={classes.sectionLabel}
      >
        {label}
      </Text>
      <Switch checked={value} onChange={onClick} />
    </Group>
  );
}

export default function PermissionsEditor({
  tree,
  onToggle,
}: PermissionsEditorProps) {
  const messages = tree.messages as PermissionsTree | undefined;
  const chat = messages?.chat as PermissionsTree | undefined;
  const chatHistory = chat?.history as PermissionsTree | undefined;
  const groupChat = messages?.group as PermissionsTree | undefined;
  const group = tree.group as PermissionsTree | undefined;
  const contacts = tree.contacts as PermissionsTree | undefined;

  return (
    <Stack gap="lg">
      {(chat || groupChat) && (
        <div>
          <Stack gap="md">
            {chat && (
              <div>
                <SectionLabel>One to One Chat</SectionLabel>
                <Stack gap={6}>
                  <ToggleRow
                    label="Write Message"
                    value={Boolean(chat.create)}
                    onClick={() => onToggle(["messages", "chat", "create"])}
                  />
                  <ToggleRow
                    label="Initiate Chat"
                    value={Boolean(chat?.start)}
                    onClick={() => onToggle(["messages", "chat", "start"])}
                  />
                  <ToggleRow
                    label="View Message"
                    value={Boolean(chat.read)}
                    onClick={() => onToggle(["messages", "chat", "read"])}
                  />
                  <ToggleRow
                    label="Update Message"
                    value={Boolean(chat.update)}
                    onClick={() => onToggle(["messages", "chat", "update"])}
                  />
                  <ToggleRow
                    label="Delete Message"
                    value={Boolean(chat.delete)}
                    onClick={() => onToggle(["messages", "chat", "delete"])}
                  />
                  <ToggleRow
                    label="View Chat History"
                    value={Boolean(chatHistory?.get)}
                    onClick={() =>
                      onToggle(["messages", "chat", "history", "get"])
                    }
                  />
                  <ToggleRow
                    label="Delete Chat History"
                    value={Boolean(chatHistory?.delete)}
                    onClick={() =>
                      onToggle(["messages", "chat", "history", "delete"])
                    }
                  />
                </Stack>
              </div>
            )}

            {groupChat && (
              <div>
                <SectionLabel>Group Chat</SectionLabel>
                <Stack gap={6}>
                  <ToggleRow
                    label="Write Message"
                    value={Boolean(groupChat.create)}
                    onClick={() => onToggle(["messages", "group", "create"])}
                  />
                  <ToggleRow
                    label="View Message"
                    value={Boolean(groupChat.read)}
                    onClick={() => onToggle(["messages", "group", "read"])}
                  />
                  <ToggleRow
                    label="Update Message"
                    value={Boolean(groupChat.update)}
                    onClick={() => onToggle(["messages", "group", "update"])}
                  />
                  <ToggleRow
                    label="Delete Message"
                    value={Boolean(groupChat.delete)}
                    onClick={() => onToggle(["messages", "group", "delete"])}
                  />
                </Stack>
              </div>
            )}
          </Stack>
          <Divider mt="lg" />
        </div>
      )}

      {group && (
        <div>
          <SectionLabel>Group</SectionLabel>
          <Stack gap={6}>
            <ToggleRow
              label="Create"
              value={Boolean(group.create)}
              onClick={() => onToggle(["group", "create"])}
            />
            <ToggleRow
              label="View"
              value={Boolean(group.read)}
              onClick={() => onToggle(["group", "read"])}
            />
            <ToggleRow
              label="Update"
              value={Boolean(group.update)}
              onClick={() => onToggle(["group", "update"])}
            />
            <ToggleRow
              label="Delete"
              value={Boolean(group.delete)}
              onClick={() => onToggle(["group", "delete"])}
            />
          </Stack>
          <Divider mt="lg" />
        </div>
      )}

      {contacts && (
        <div>
          <SectionLabel>Contacts</SectionLabel>
          <Stack gap={6}>
            <ToggleRow
              label="Create"
              value={Boolean(contacts.create)}
              onClick={() => onToggle(["contacts", "create"])}
            />
            <ToggleRow
              label="View"
              value={Boolean(contacts.read)}
              onClick={() => onToggle(["contacts", "read"])}
            />
            <ToggleRow
              label="Update"
              value={Boolean(contacts.update)}
              onClick={() => onToggle(["contacts", "update"])}
            />
            <ToggleRow
              label="Delete"
              value={Boolean(contacts.delete)}
              onClick={() => onToggle(["contacts", "delete"])}
            />
          </Stack>
          <Divider mt="lg" />
        </div>
      )}
    </Stack>
  );
}
