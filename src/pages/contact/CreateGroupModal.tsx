import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import {
  Avatar,
  Button,
  Checkbox,
  FileInput,
  Group,
  Modal,
  MultiSelect,
  Pill,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import type { Contact } from "./Contact";

interface CreateGroupModalProps {
  opened: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
  onSaveGroup: (payload: {
    group_name: string;
    description: string;
    admin: string[];
    members: string[];
    group_image: string;
    only_admins_can_message: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

const CreateGroupModal = ({
  opened,
  onClose,
  selectedContacts,
  onSaveGroup,
  loading = false,
}: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<Contact[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [onlyAdminsCanMessage, setOnlyAdminsCanMessage] = useState(false);

  const getUserId = (c: Contact) =>
    c.username || (c.id.includes("#") ? c.id.split("#")[1] : c.id);

  useEffect(() => {
    if (opened) {
      setMembers(selectedContacts);
      setGroupName("");
      setDescription("");
      setGroupImage(null);
      setOnlyAdminsCanMessage(false);
    }
  }, [opened, selectedContacts]);

  const handleRemoveMember = (memberId: string) => {
    const memberToRemove = members.find((m) => m.id === memberId);
    if (!memberToRemove) return;

    const removedUserId = getUserId(memberToRemove);

    const updatedMembers = members.filter((m) => m.id !== memberId);
    setMembers(updatedMembers);

    setAdmins((prev) => prev.filter((a) => a !== removedUserId));
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }

    if (members.length === 0) {
      alert("At least one member is required to create a group.");
      return;
    }

    const memberIds = members.map((m) => getUserId(m));

    const payload = {
      group_name: groupName.trim(),
      description: description.trim(),
      admin: admins,
      members: memberIds,
      group_image: groupImage ? groupImage.name : "",
      only_admins_can_message: onlyAdminsCanMessage,
    };

    await onSaveGroup(payload);
  };

  const adminOptions = members.map((m) => ({
    value: getUserId(m),
    label: `${m.name} (${getUserId(m)})`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      size="md"
      styles={{
        inner: {
          paddingTop: 10,
          paddingBottom: 20, // Adds extra clearance above mobile bottom navbars
        },
        content: {
          maxHeight: "75vh", // Keeps modal well within mobile viewports
          display: "flex",
          flexDirection: "column",
        },
        header: {
          paddingBottom: 8,
        },
        body: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden", // Allows body flexbox layout to pin action button at the bottom
          padding: "12px 16px 16px 16px",
        },
      }}
      title={
        <Text fw={700} size="lg">
          Create New Group
        </Text>
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Scrollable Form Fields */}
        <div className="flex-1 overflow-y-auto pr-1">
          <Stack gap="xs">
            <TextInput
              label="Group Name"
              placeholder="Enter group name"
              required
              size="sm"
              value={groupName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setGroupName(e.target.value)
              }
            />

            <Textarea
              label="Description"
              placeholder="Enter group description"
              rows={2}
              size="sm"
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
            />

            <FileInput
              label="Group Image"
              placeholder="Upload picture"
              size="sm"
              leftSection={<IconUpload size={16} />}
              accept="image/png,image/jpeg,image/jpg"
              value={groupImage}
              onChange={setGroupImage}
            />

            <div>
              <Text size="xs" fw={500} mb={2}>
                Members ({members.length})
              </Text>
              <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-20 overflow-y-auto">
                {members.length > 0 ? (
                  members.map((member) => (
                    <Pill
                      key={member.id}
                      withRemoveButton
                      onRemove={() => handleRemoveMember(member.id)}
                      size="sm"
                      color="indigo"
                    >
                      <Group gap={4} wrap="nowrap">
                        <Avatar color={member.color} radius="xl" size={16}>
                          {member.name[0]}
                        </Avatar>
                        <Text size="xs" fw={500}>
                          {member.name}
                        </Text>
                      </Group>
                    </Pill>
                  ))
                ) : (
                  <Text size="xs" c="dimmed">
                    No members selected
                  </Text>
                )}
              </div>
            </div>

            <MultiSelect
              label="Group Admins"
              placeholder="Select admin(s)"
              size="sm"
              data={adminOptions}
              value={admins}
              onChange={setAdmins}
              searchable={false}
              comboboxProps={{
                withinPortal: true,
              }}
            />

            <Checkbox
              label="Only admins can send messages"
              size="xs"
              checked={onlyAdminsCanMessage}
              onChange={(e) => setOnlyAdminsCanMessage(e.currentTarget.checked)}
            />
          </Stack>
        </div>

        {/* Sticky Action Button Pinning at Bottom */}
        <div className="pt-3 mt-2 border-t border-gray-100 bg-white">
          <Button
            fullWidth
            color="indigo"
            size="sm"
            loading={loading}
            onClick={handleSubmit}
          >
            Create Group
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateGroupModal;
