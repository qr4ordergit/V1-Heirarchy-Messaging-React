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
import { IconUpload, IconUserPlus } from "@tabler/icons-react";
import type { Contact, GroupItem } from "./Contact";

interface CreateGroupModalProps {
  opened: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
  initialGroup?: GroupItem | null;
  onSaveGroup: (
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
  ) => Promise<void>;
  loading?: boolean;
}

const CreateGroupModal = ({
  opened,
  onClose,
  selectedContacts,
  initialGroup = null,
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
      if (initialGroup) {
        setGroupName(initialGroup.group_name || "");
        setDescription(initialGroup.group_description || "");
        setOnlyAdminsCanMessage(initialGroup.only_admins_can_message || false);
        setAdmins(initialGroup.admins || []);
        setGroupImage(null);

        const mappedMembers: Contact[] = (initialGroup.members || []).map(
          (mId) => {
            const found = selectedContacts.find((c) => getUserId(c) === mId);
            return (
              found || {
                id: mId,
                username: mId,
                name: mId,
                phone: "",
                email: "",
                color: "indigo",
              }
            );
          },
        );
        setMembers(mappedMembers);
      } else {
        setMembers(selectedContacts);
        setGroupName("");
        setDescription("");
        setGroupImage(null);
        setOnlyAdminsCanMessage(false);
        setAdmins([]);
      }
    }
  }, [opened, initialGroup]);

  const handleRemoveMember = (memberId: string) => {
    const memberToRemove = members.find((m) => m.id === memberId);
    if (!memberToRemove) return;

    const removedUserId = getUserId(memberToRemove);
    const updatedMembers = members.filter((m) => m.id !== memberId);
    setMembers(updatedMembers);

    setAdmins((prev) => prev.filter((a) => a !== removedUserId));
  };

  const handleAddNewMembers = (selectedUserIds: string[]) => {
    const newlyAddedContacts: Contact[] = [];

    selectedUserIds.forEach((userId) => {
      const contactObj = selectedContacts.find((c) => getUserId(c) === userId);
      if (contactObj && !members.some((m) => getUserId(m) === userId)) {
        newlyAddedContacts.push(contactObj);
      }
    });

    if (newlyAddedContacts.length > 0) {
      setMembers((prev) => [...prev, ...newlyAddedContacts]);
    }
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }

    if (members.length === 0) {
      alert("At least one member is required.");
      return;
    }

    const memberIds = members.map((m) => getUserId(m));

    const payload = {
      group_name: groupName.trim(),
      description: description.trim(),
      admin: admins,
      members: memberIds,
      group_image: groupImage
        ? groupImage.name
        : initialGroup?.group_image || "",
      group_image_file: groupImage,
      only_admins_can_message: onlyAdminsCanMessage,
    };

    await onSaveGroup(payload, Boolean(initialGroup));
  };

  const adminOptions = members.map((m) => ({
    value: getUserId(m),
    label: `${m.name} (${getUserId(m)})`,
  }));

  const availableContactsToAdd = selectedContacts
    .filter((c) => !members.some((m) => getUserId(m) === getUserId(c)))
    .map((c) => ({
      value: getUserId(c),
      label: `${c.name} (${getUserId(c)})`,
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
          paddingBottom: 20,
        },
        content: {
          maxHeight: "80vh",
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
          overflow: "hidden",
          padding: "12px 16px 16px 16px",
        },
      }}
      title={
        <Text fw={700} size="lg">
          {initialGroup ? "Edit Group" : "Create New Group"}
        </Text>
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
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
              placeholder={initialGroup?.group_image || "Upload picture"}
              size="sm"
              leftSection={<IconUpload size={16} />}
              accept="image/png,image/jpeg,image/jpg"
              value={groupImage}
              onChange={setGroupImage}
            />

            <div>
              <Text size="xs" fw={500} mb={2}>
                Group Members ({members.length})
              </Text>
              <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-24 overflow-y-auto">
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

            {availableContactsToAdd.length > 0 && (
              <MultiSelect
                label="Add New Members"
                placeholder="Select contacts to add..."
                size="sm"
                data={availableContactsToAdd}
                value={[]}
                onChange={handleAddNewMembers}
                leftSection={<IconUserPlus size={16} />}
                searchable={false}
                comboboxProps={{
                  withinPortal: true,
                }}
              />
            )}

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

        <div className="pt-3 mt-2 border-t border-gray-100 bg-white">
          <Button
            fullWidth
            color="indigo"
            size="sm"
            loading={loading}
            onClick={handleSubmit}
          >
            {initialGroup ? "Update Group" : "Create Group"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateGroupModal;
