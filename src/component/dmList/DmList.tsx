import { useEffect } from "react";
import { DmService } from "../../api/services/dm.service";
import { useDMListStore } from "../../store/dm/dm.list.store";
import { Notification } from "../../utils/notification";
import { Center, Stack, Text } from "@mantine/core";
import ConversationItem from "../conversationItem/ConversationItem";

const DmList = () => {
  const dms = useDMListStore((state) => state.dms);
  const setDMs = useDMListStore((state) => state.setDMs);
  const reset = useDMListStore((state) => state.reset);

  const loadDMs = async () => {
    try {
      const dms = await DmService.getDMs({
        limit: 20,
      });

      setDMs(dms.data);
    } catch (error) {
      if (error instanceof Error) {
        Notification.error(error.message);
      }
      reset();
    }
  };

  useEffect(() => {
    loadDMs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return dms.length > 0 ? (
    <Stack gap={4}>
      {dms.map((conversation) => (
        <ConversationItem key={conversation._id} conversation={conversation} />
      ))}
    </Stack>
  ) : (
    <Center>
      <Text c="red.6" size="xs">
        No direct messages found
      </Text>
    </Center>
  );
};
export default DmList;
