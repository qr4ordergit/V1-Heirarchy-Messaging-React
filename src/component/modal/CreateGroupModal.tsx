import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import {
  ActionIcon,
  Avatar,
  Button,
  Checkbox,
  FileInput,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Pill,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconTag,
  IconUpload,
  IconUserPlus,
  IconUserShield,
  IconX,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import type { Contact, GroupItem } from "../../pages/contact/Contact";
import {
  manageGroupMembers,
  manageGroupAdmins,
  transferGroupOwnership,
  getGroupTagsApi,
  createGroupTagApi,
  deleteGroupTagApi,
} from "../../api/createGroupModalApi";

interface CreateGroupModalProps {
  opened: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
  initialGroup?: GroupItem | null;
  onSaveGroup: (payload: Record<string, any>, isEdit: boolean) => Promise<void>;
  onGroupUpdated?: () => void;
  loading?: boolean;
}

const getUserId = (c: Contact) =>
  c.username || (c.id.includes("#") ? c.id.split("#")[1] : c.id);

const CreateGroupModal = ({
  opened,
  onClose,
  selectedContacts,
  initialGroup = null,
  onSaveGroup,
  onGroupUpdated,
  loading = false,
}: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<Contact[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [owner, setOwner] = useState<string>("");
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [onlyAdminsCanMessage, setOnlyAdminsCanMessage] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [groupTags, setGroupTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagActionLoading, setTagActionLoading] = useState(false);
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;

    if (initialGroup) {
      setGroupName(initialGroup.group_name || "");
      setDescription(initialGroup.group_description || "");
      setOnlyAdminsCanMessage(initialGroup.only_admins_can_message || false);
      setAdmins(initialGroup.admins || []);
      setOwner(initialGroup.created_by || "");
      setGroupImage(null);

      const mappedMembers = (initialGroup.members || []).map((mId) => {
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
      });
      setMembers(mappedMembers);

      setLoadingTags(true);
      getGroupTagsApi(initialGroup._id)
        .then((tags) => setGroupTags(tags))
        .finally(() => setLoadingTags(false));
    } else {
      setMembers(selectedContacts);
      setGroupName("");
      setDescription("");
      setGroupImage(null);
      setOnlyAdminsCanMessage(false);
      setAdmins([]);
      setOwner("");
      setGroupTags([]);
    }

    setIsAddingTag(false);
    setNewTagName("");
  }, [opened, initialGroup, selectedContacts]);

  const handleRemoveMember = async (memberId: string) => {
    const memberToRemove = members.find((m) => m.id === memberId);
    if (!memberToRemove) return;

    const removedUserId = getUserId(memberToRemove);

    if (initialGroup) {
      setActionLoading(true);
      const ok = await manageGroupMembers(
        initialGroup._id,
        [removedUserId],
        "remove-members",
      );
      setActionLoading(false);
      if (!ok) return;
      onGroupUpdated?.();
    }

    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setAdmins((prev) => prev.filter((a) => a !== removedUserId));
  };

  const handleAddNewMembers = async (selectedUserIds: string[]) => {
    const newlyAdded = selectedContacts.filter(
      (c) =>
        selectedUserIds.includes(getUserId(c)) &&
        !members.some((m) => getUserId(m) === getUserId(c)),
    );

    if (newlyAdded.length === 0) return;

    if (initialGroup) {
      setActionLoading(true);
      const ok = await manageGroupMembers(
        initialGroup._id,
        newlyAdded.map(getUserId),
        "add-members",
      );
      setActionLoading(false);
      if (!ok) return;
      onGroupUpdated?.();
    }

    setMembers((prev) => [...prev, ...newlyAdded]);
  };

  const handleAdminChange = async (newAdmins: string[]) => {
    if (!initialGroup) {
      setAdmins(newAdmins);
      return;
    }

    const added = newAdmins.filter((a) => !admins.includes(a));
    const removed = admins.filter((a) => !newAdmins.includes(a));
    const operation = added.length > 0 ? "add-members" : "remove-members";
    const targets = added.length > 0 ? added : removed;

    if (targets.length === 0) return;

    setActionLoading(true);
    const ok = await manageGroupAdmins(initialGroup._id, targets, operation);
    setActionLoading(false);

    if (ok) {
      setAdmins(newAdmins);
      onGroupUpdated?.();
    }
  };

  const handleOwnershipTransfer = async (newOwnerId: string) => {
    if (!initialGroup || !newOwnerId || newOwnerId === owner) return;

    setActionLoading(true);
    const ok = await transferGroupOwnership(initialGroup._id, newOwnerId);
    setActionLoading(false);

    if (ok) {
      setOwner(newOwnerId);
      onGroupUpdated?.();
    }
  };

  const handleAddTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      notifications.show({
        title: "",
        message: "Please enter a tag name.",
        color: "red",
      });
      return;
    }

    if (groupTags.includes(trimmed)) {
      notifications.show({
        title: "",
        message: "This tag is already added.",
        color: "yellow",
      });
      return;
    }

    if (!initialGroup) return;

    setTagActionLoading(true);
    const ok = await createGroupTagApi(initialGroup._id, trimmed);
    setTagActionLoading(false);

    if (ok) {
      setGroupTags((prev) => [...prev, trimmed]);
      setNewTagName("");
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!initialGroup) return;

    setDeletingTag(tagToRemove);
    const ok = await deleteGroupTagApi(initialGroup._id, tagToRemove);
    setDeletingTag(null);

    if (ok) {
      setGroupTags((prev) => prev.filter((t) => t !== tagToRemove));
    }
  };

  const hasFormFieldsChanged = () => {
    if (!initialGroup) return true;
    return (
      groupName.trim() !== (initialGroup.group_name || "").trim() ||
      description.trim() !== (initialGroup.group_description || "").trim() ||
      onlyAdminsCanMessage !==
        (initialGroup.only_admins_can_message || false) ||
      Boolean(groupImage)
    );
  };

  const handleSubmit = async () => {
    if (initialGroup) {
      const payload: Record<string, any> = {};

      if (groupName.trim() !== (initialGroup.group_name || "").trim()) {
        if (!groupName.trim()) {
          notifications.show({
            title: "",
            message: "Group name cannot be empty.",
            color: "red",
          });
          return;
        }
        payload.group_name = groupName.trim();
      }

      if (
        description.trim() !== (initialGroup.group_description || "").trim()
      ) {
        payload.description = description.trim();
      }

      if (
        onlyAdminsCanMessage !== (initialGroup.only_admins_can_message || false)
      ) {
        payload.only_admins_can_message = onlyAdminsCanMessage;
      }

      if (groupImage) {
        payload.group_image = groupImage.name;
        payload.group_image_file = groupImage;
      }

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      await onSaveGroup(payload, true);
      return;
    }

    if (!groupName.trim()) {
      notifications.show({
        title: "",
        message: "Please enter a group name.",
        color: "red",
      });
      return;
    }

    if (members.length === 0) {
      notifications.show({
        title: "",
        message: "At least one member is required.",
        color: "red",
      });
      return;
    }

    await onSaveGroup(
      {
        group_name: groupName.trim(),
        description: description.trim(),
        admin: admins,
        members: members.map(getUserId),
        group_image: groupImage ? groupImage.name : "",
        group_image_file: groupImage,
        only_admins_can_message: onlyAdminsCanMessage,
      },
      false,
    );
  };

  const adminOptions = members.map((m) => ({
    value: getUserId(m),
    label: `${m.name} (${getUserId(m)})`,
  }));

  const transferOptions = admins.map((adminId) => {
    const memberObj = members.find((m) => getUserId(m) === adminId);
    return {
      value: adminId,
      label: memberObj ? `${memberObj.name} (${adminId})` : adminId,
    };
  });

  const availableToAdd = selectedContacts
    .filter((c) => !members.some((m) => getUserId(m) === getUserId(c)))
    .map((c) => ({
      value: getUserId(c),
      label: `${c.name} (${getUserId(c)})`,
    }));

  const isBusy = loading || actionLoading;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      size="md"
      styles={{
        inner: { paddingTop: 10, paddingBottom: 20 },
        content: {
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        },
        header: { paddingBottom: 8 },
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
                      disabled={isBusy}
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

            {availableToAdd.length > 0 && (
              <MultiSelect
                label="Add New Members"
                placeholder="Select contacts to add..."
                size="sm"
                data={availableToAdd}
                value={[]}
                onChange={handleAddNewMembers}
                disabled={isBusy}
                leftSection={<IconUserPlus size={16} />}
                comboboxProps={{ withinPortal: true }}
              />
            )}

            <MultiSelect
              label="Group Admins"
              placeholder="Select admin(s)"
              size="sm"
              data={adminOptions}
              value={admins}
              onChange={handleAdminChange}
              disabled={isBusy}
              comboboxProps={{ withinPortal: true }}
            />

            {initialGroup && transferOptions.length > 0 && (
              <Select
                label="Transfer Ownership"
                placeholder="Select an admin"
                size="sm"
                data={transferOptions}
                value={owner}
                onChange={(val) => val && handleOwnershipTransfer(val)}
                disabled={isBusy}
                leftSection={<IconUserShield size={16} />}
                comboboxProps={{ withinPortal: true }}
              />
            )}

            {initialGroup && (
              <div>
                <Group justify="space-between" align="center" mb={4}>
                  <Group gap={4}>
                    <IconTag size={15} className="text-indigo-600" />
                    <Text size="xs" fw={500}>
                      Group Tags ({groupTags.length})
                    </Text>
                  </Group>

                  {!isAddingTag && (
                    <Tooltip label="Add Tag" withArrow position="left">
                      <ActionIcon
                        size="xs"
                        variant="light"
                        color="indigo"
                        onClick={() => setIsAddingTag(true)}
                      >
                        <IconPlus size={13} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>

                {isAddingTag && (
                  <div className="flex items-center gap-1.5 p-1.5 mb-2 bg-indigo-50/50 rounded-lg border border-indigo-200">
                    <TextInput
                      placeholder="Enter tag name..."
                      size="xs"
                      className="flex-1"
                      autoFocus
                      value={newTagName}
                      disabled={tagActionLoading}
                      onChange={(e) => setNewTagName(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        } else if (e.key === "Escape") {
                          setIsAddingTag(false);
                          setNewTagName("");
                        }
                      }}
                    />
                    <Button
                      size="xs"
                      color="indigo"
                      loading={tagActionLoading}
                      onClick={handleAddTag}
                    >
                      Save
                    </Button>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => {
                        setIsAddingTag(false);
                        setNewTagName("");
                      }}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 min-h-10.5 max-h-24 overflow-y-auto">
                  {loadingTags ? (
                    <Group gap={6} align="center" px="xs" py={2}>
                      <Loader size="xs" color="indigo" />
                      <Text size="xs" c="dimmed">
                        Loading tags...
                      </Text>
                    </Group>
                  ) : groupTags.length > 0 ? (
                    groupTags.map((tag) => (
                      <Pill
                        key={tag}
                        withRemoveButton
                        onRemove={() => handleRemoveTag(tag)}
                        size="sm"
                        color="indigo"
                        disabled={deletingTag === tag || isBusy}
                      >
                        <Group gap={4} wrap="nowrap">
                          <IconTag size={12} className="text-indigo-500" />
                          <Text size="xs" fw={500}>
                            {tag}
                          </Text>
                        </Group>
                      </Pill>
                    ))
                  ) : (
                    <Text size="xs" c="dimmed" px="xs" py={2}>
                      No tags assigned to this group
                    </Text>
                  )}
                </div>
              </div>
            )}

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
            loading={isBusy}
            onClick={handleSubmit}
          >
            {initialGroup
              ? hasFormFieldsChanged()
                ? "Update Group"
                : "Done"
              : "Create Group"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateGroupModal;
