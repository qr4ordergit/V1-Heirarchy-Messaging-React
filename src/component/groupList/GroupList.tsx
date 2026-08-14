import { useEffect, useState } from "react";
import { GroupService } from "../../api/services/groups.service";
import { Notification } from "../../utils/notification";
import { useGroupListStore } from "../../store/groups/group.list.store";
import { useConversationTypeStore } from "../../store/conversation/conversation.type.store";
import {
  ActionIcon,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import GroupsItem from "../groupsItem/GroupsItem";

interface SelectedGrouptate {
  group_id: string;
  group_name: string;
}

const GroupList = () => {
  const groups = useGroupListStore((state) => state.groups);
  const setGroups = useGroupListStore((state) => state.setGroups);
  const reset = useGroupListStore((state) => state.reset);
  const search = useConversationTypeStore((state) => state.search);

  const filteredGroups = groups.filter((grp) =>
    grp.group_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [leaveOpened, setLeaveOpened] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<SelectedGrouptate>({
    group_id: "",
    group_name: "",
  });

  const resetSelectedGroup = () => {
    setSelectedGroup({ group_id: "", group_name: "" });
  };

  const handleClickLeave = (id: string, group_name: string) => {
    setSelectedGroup({ group_id: id, group_name: group_name });
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      const groups = await GroupService.getGroups();
      setGroups(groups.data);
    } catch (error) {
      if (error instanceof Error) {
        Notification.error(error.message);
      }
      reset();
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async () => {
    try {
      setLoading(true);
      const res = await GroupService.leaveGroup({
        group_id: selectedGroup.group_id,
        operation: "remove-members",
      });
      setLeaveOpened(false);
      resetSelectedGroup();
      Notification.success(res.message);
      await loadGroups();
    } catch (error) {
      if (error instanceof Error) {
        Notification.error(error.message);
      }
      reset();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return !loading ? (
    filteredGroups.length > 0 ? (
      <>
        <Stack gap={4} pb={50}>
          {filteredGroups.map((groups) => (
            <GroupsItem
              key={groups._id}
              groups={groups}
              onLeave={() => handleClickLeave(groups._id, groups.group_name)}
            />
          ))}
        </Stack>
        <ActionIcon
          pos="absolute"
          bottom={10}
          right={10}
          size={30}
          onClick={loadGroups}
        >
          <IconRefresh size={15} />
        </ActionIcon>
        <Modal
          opened={leaveOpened}
          onClose={() => {
            setLeaveOpened(false);
            resetSelectedGroup();
          }}
          title="Leave Group"
          centered
        >
          <Text size="xs">
            Are you sure you want to leave the group{" "}
            <b>{selectedGroup?.group_name}</b>?
          </Text>

          <Group justify="flex-end" mt="lg">
            <Button
              color="red"
              size="compact-xs"
              loading={loading}
              onClick={() => {
                leaveGroup();
              }}
            >
              Leave
            </Button>
          </Group>
        </Modal>
      </>
    ) : (
      <Center>
        <Text c="red.6" size="xs">
          No Group found
        </Text>
      </Center>
    )
  ) : (
    <Center>
      <Loader size={20} />
    </Center>
  );
};
export default GroupList;
