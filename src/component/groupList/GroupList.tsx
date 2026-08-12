import { useEffect, useState } from "react";
import { GroupService } from "../../api/services/groups.service";
import { Notification } from "../../utils/notification";
import { useGroupListStore } from "../../store/groups/group.list.store";
import { useConversationTypeStore } from "../../store/conversation/conversation.type.store";
import { ActionIcon, Center, Loader, Stack, Text } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import GroupsItem from "../groupsItem/GroupsItem";

const GroupList = () => {
  const groups = useGroupListStore((state) => state.groups);
  const setGroups = useGroupListStore((state) => state.setGroups);
  const reset = useGroupListStore((state) => state.reset);
  const search = useConversationTypeStore((state) => state.search);

  const filteredGroups = groups.filter((grp) =>
    grp.group_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const [loading, setLoading] = useState<boolean>(false);

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
