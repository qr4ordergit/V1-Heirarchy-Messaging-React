import { Menu } from "@mantine/core";
import type { ReactNode } from "react";
import type { MESSAGE } from "../../../store/chats/chats.store";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";

interface CHATOPTIONSPROPS {
  children: ReactNode;
  msg: MESSAGE;
}

export function ChatOptions({ children, msg }: CHATOPTIONSPROPS) {
  const { setTrigger } = useTriggerStore((state) => state);

  const onDelete = () => {
    setTrigger({
      toTrigger: TRIGGERS.deleteConfirmationDialouge,
      payload: msg,
    });
  };

  const onEdit = () => {
    setTrigger({
      toTrigger: TRIGGERS.editChatDialog,
      payload: msg,
    });
  };

  const onReply = () => {
    setTrigger({
      toTrigger: TRIGGERS.reply,
      payload: msg,
    });
  };

  return (
    <Menu shadow="md" width={200}>
      <Menu.ContextMenu>{children}</Menu.ContextMenu>

      <Menu.Dropdown>
        <Menu.Label>Actions</Menu.Label>
        <Menu.Item onClick={onEdit}>Edit</Menu.Item>
        <Menu.Item onClick={onReply}>Reply</Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={onDelete} color="red">
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
