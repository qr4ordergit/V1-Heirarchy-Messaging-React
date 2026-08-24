import { Menu } from "@mantine/core";
import type { ReactNode } from "react";
import type { MESSAGE } from "../../../store/chats/chats.store";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";
import { Notification } from "../../../utils/notification";
import {
  IconArrowForward,
  IconCopy,
  IconPencil,
  IconStar,
  IconTrash,
} from "@tabler/icons-react";
import { useAuthStore } from "../../../store/auth/auth.store";

interface CHATOPTIONSPROPS {
  children: ReactNode;
  msg: MESSAGE;
}

export function ChatOptions({ children, msg }: CHATOPTIONSPROPS) {
  const { setTrigger } = useTriggerStore((state) => state);
  const { userDetails, targetUserDetails } = useAuthStore((state) => state);

  const own_user_id = targetUserDetails?.user_id ?? userDetails?.username;
  const isMe = own_user_id === msg.created_by;

  const onDelete = () => {
    setTrigger({
      toTrigger: TRIGGERS.deleteConfirmationDialouge,
      payload: {
        _id: msg._id,
      },
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

  const onCopy = async () => {
    const text = msg.body?.text;

    if (!text) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");

        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(textarea);
      }

      Notification.success("Content copied");
    } catch (error) {
      console.error("Failed to copy text:", error);
      Notification.error("Failed to copy content");
    }
  };

  const onTag = () => {
    setTrigger({
      toTrigger: TRIGGERS.tagList,
      payload: msg,
    });
  };

  const optionConditions = {
    copy: () => {
      let isDisabled = true;
      if (msg.body?.text) {
        isDisabled = false;
      }

      if (msg?.private_msg) {
        isDisabled = true;
      }

      return isDisabled;
    },

    edit: () => {
      let isDisabled = true;
      if (isMe) {
        isDisabled = false;
      }

      if (msg?.private_msg) {
        isDisabled = true;
      }

      return isDisabled;
    },

    delete: () => {
      let isDisabled = true;
      if (isMe) {
        isDisabled = false;
      }

      return isDisabled;
    },
  };

  return (
    <Menu shadow="md" width={200} offset={0}>
      <Menu.Target>{children}</Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Actions</Menu.Label>
        <Menu.Item
          disabled={optionConditions.edit()}
          onClick={onEdit}
          leftSection={<IconPencil size={14} />}
        >
          Edit
        </Menu.Item>
        <Menu.Item
          onClick={onReply}
          leftSection={<IconArrowForward size={14} />}
        >
          Reply
        </Menu.Item>
        <Menu.Item
          disabled={optionConditions.copy()}
          onClick={onCopy}
          leftSection={<IconCopy size={14} />}
        >
          Copy Content
        </Menu.Item>
        <Menu.Item onClick={onTag} leftSection={<IconStar size={14} />}>
          Add Tags
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          disabled={optionConditions.delete()}
          onClick={onDelete}
          color="red"
          leftSection={<IconTrash size={14} />}
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
