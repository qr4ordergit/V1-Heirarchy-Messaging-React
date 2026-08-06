import { useEffect, useState } from "react";
import { DmService } from "../../api/services/dm.service";
import { useDMListStore } from "../../store/dm/dm.list.store";
import { Notification } from "../../utils/notification";
import { ActionIcon, Center, Loader, Stack, Text } from "@mantine/core";
import ConversationItem from "../conversationItem/ConversationItem";
import { IconRefresh } from "@tabler/icons-react";

const DmList = () => {
  const dms = useDMListStore((state) => state.dms);
  const setDMs = useDMListStore((state) => state.setDMs);
  const reset = useDMListStore((state) => state.reset);
  const search = useDMListStore((state) => state.search);

  const filteredDMs = dms.filter((dm) =>
    dm.display_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const [loading, setLoading] = useState<boolean>(false);
  
  const loadDMs = async () => {
    try {
      setLoading(true);
      const dms = await DmService.getDMs({
        limit: 50,
      });

      setDMs(dms.data);
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
    loadDMs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return !loading ? (
    filteredDMs.length > 0 ? (
      <>
        <Stack gap={4} pb={50}>
          {filteredDMs.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
            />
          ))}
        </Stack>
        <ActionIcon
          pos="absolute"
          bottom={10}
          right={10}
          size={30}
          onClick={loadDMs}
        >
          <IconRefresh size={15} />
        </ActionIcon>
      </>
    ) : (
      <Center>
        <Text c="red.6" size="xs">
          No direct messages found
        </Text>
      </Center>
    )
  ) : (
    <Center>
      <Loader size={20} />
    </Center>
  );
};
export default DmList;
