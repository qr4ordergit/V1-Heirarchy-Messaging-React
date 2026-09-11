import {
  ActionIcon,
  Badge,
  FileButton,
  Group,
  Loader,
  Paper,
  Text,
  TextInput,
} from "@mantine/core";
import { IconLock, IconPaperclip, IconSend, IconX } from "@tabler/icons-react";
import { useEffect, useState, useTransition } from "react";
import { api } from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { Notification } from "../../../utils/notification";
import { useParams } from "react-router";
import { useNextPerson } from "../../../hooks/useNextPerson";
import { useChatStore } from "../../../store/chats/chats.store";
import ReplyInputBoxCard from "./ReplyInputBoxCard";
import { useTriggerStore } from "../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../utils/constant";
import { useAuthStore } from "../../../store/auth/auth.store";
import { E2EHelper } from "../../../utils/e2eHelper";
import { useTranslation } from "../../../store/language/language.store";

interface SUBMIT_PAYLOAD {
  [key: string]: unknown;
}

interface S3MultipartPart {
  part_number: number;
  upload_url: string;
}

interface UploadUrl {
  file_name: string;
  content_type: string;
  key: string;
  upload_id: string;
  total_size: number | null;
  part_size: number;
  parts: S3MultipartPart[];
  s3_path: string;
}

interface UploadedPart {
  part_number: number;
  etag: string;
}

export default function ChatInput() {
  const { chatId } = useParams<{ chatId: string }>();
  const nextPerson = useNextPerson();
  const appendChats = useChatStore((state) => state.appendChats);
  const { trigger, triggerPayload, resetTrigger, setTrigger } =
    useTriggerStore();
  const { userDetails, target_user } = useAuthStore((state) => state);
  const { translation } = useTranslation();

  const own_user_id = target_user ?? userDetails?.username;
  const isReply = trigger === TRIGGERS.reply;
  const isGroup = chatId?.includes("group");

  const [message, setMessage] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);

  const [submitLoader, SubmitFn] = useTransition();

  const handleFiles = (selectedFiles: File[]) => {
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!chatId) return;

    try {
      const payload: SUBMIT_PAYLOAD = {
        user: isGroup ? undefined : nextPerson(chatId),
        group_id: isGroup ? chatId : undefined,
        type: isReply ? "replay" : "message",
        parent_message_id: triggerPayload?._id ?? undefined,
        text: message,
      };

      if (trigger === TRIGGERS.privateMessageSender) {
        payload["user_key"] = triggerPayload?.password;
        if (triggerPayload?.users && triggerPayload?.users?.length > 0) {
          payload["users_list"] = [...triggerPayload?.users, own_user_id];
        }
      }

      const target_user_param = target_user
        ? `?target_user=${target_user}`
        : "";

      const endpoint = isGroup
        ? `${ENDPOINTS.GROUP_CHAT.POST}${target_user_param}`
        : `${ENDPOINTS.CHAT.SEND}${target_user_param}`;

      const response = await api.post(endpoint, payload);

      if (!response.data?.success) {
        Notification.error(
          translation(
            "chat_history.noti-msg-send-fail",
            "Failed to send message",
          ),
        );
        return;
      }
      let finalMsg = response.data?.data;
      finalMsg["double_encryption"] = false;
      appendChats([finalMsg]);
      if (isReply) {
        resetTrigger();
      }
      setMessage("");
    } catch (error) {
      console.log(error);
      Notification.error(
        translation("chat_history.noti-msg-send-catch", "Something went wrong"),
      );
    }
  };

  const uploadEncryptedFile = async (
    file: File,
    uploadInfo: UploadUrl,
    key: string,
  ): Promise<UploadedPart[]> => {
    const ENCRYPTION_CHUNK_SIZE = E2EHelper.getChunkSize();

    const S3_PART_SIZE = uploadInfo.part_size;

    if (S3_PART_SIZE < 5 * 1024 * 1024) {
      throw new Error("S3 multipart part size must be at least 5 MiB");
    }

    const uploadedParts: UploadedPart[] = [];

    const totalEncryptionChunks = Math.ceil(file.size / ENCRYPTION_CHUNK_SIZE);

    let currentS3Part = 1;

    let currentS3PartSize = 0;

    let currentS3PartChunks: ArrayBuffer[] = [];

    for (
      let chunkNumber = 1;
      chunkNumber <= totalEncryptionChunks;
      chunkNumber++
    ) {
      const { start, end } = E2EHelper.getChunkRange(chunkNumber, file.size);

      const encryptedChunk = await E2EHelper.encryptPart(
        file,
        start,
        end,
        chunkNumber,
        key,
      );

      currentS3PartChunks.push(encryptedChunk);

      currentS3PartSize += encryptedChunk.byteLength;

      const isLastChunk = chunkNumber === totalEncryptionChunks;

      const shouldUploadS3Part =
        currentS3PartSize >= S3_PART_SIZE || isLastChunk;

      if (!shouldUploadS3Part) {
        continue;
      }

      const s3PartBody = new Uint8Array(currentS3PartSize);

      let offset = 0;

      for (const chunk of currentS3PartChunks) {
        s3PartBody.set(new Uint8Array(chunk), offset);

        offset += chunk.byteLength;
      }

      const presignedPart = uploadInfo.parts.find(
        (part) => part.part_number === currentS3Part,
      );

      if (!presignedPart) {
        throw new Error(`Presigned URL missing for S3 part ${currentS3Part}`);
      }

      console.log(
        `Uploading S3 part ${currentS3Part}/${uploadInfo.parts.length}`,
        {
          encryptionChunks: currentS3PartChunks.length,
          size: currentS3PartSize,
        },
      );

      const response = await fetch(presignedPart.upload_url, {
        method: "PUT",
        body: s3PartBody,
        headers: {
          "Content-Type": uploadInfo.content_type || "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to upload S3 part ${currentS3Part}: ${response.status}`,
        );
      }

      const etag = response.headers.get("ETag");

      if (!etag) {
        throw new Error(`ETag missing for S3 part ${currentS3Part}`);
      }

      uploadedParts.push({
        part_number: currentS3Part,

        etag: etag.replace(/^"|"$/g, ""),
      });

      currentS3Part++;

      currentS3PartSize = 0;

      currentS3PartChunks = [];
    }

    return uploadedParts;
  };

  const completeMultipartUpload = async (
    uploadInfo: UploadUrl,
    uploadedParts: UploadedPart[],
  ) => {
    const payload = {
      upload_id: uploadInfo.upload_id,
      key: uploadInfo.key,
      parts: uploadedParts,
    };

    const response = await api.post(
      ENDPOINTS.MEDIA.COMPLETE_MULTIPART,
      payload,
    );

    if (!response.data?.success) {
      throw new Error("Failed to complete multipart upload");
    }

    return response.data;
  };

  const sendWithAttachments = async () => {
    if (!chatId) return;

    try {
      const payload: SUBMIT_PAYLOAD = {
        user: isGroup ? undefined : nextPerson(chatId),
        group_id: isGroup ? chatId : undefined,
        type: isReply ? "replay" : "message",
        parent_message_id: triggerPayload?._id ?? undefined,
        text: message,
        files: files.map((file) => {
          return {
            file_name: file.name,
            total_size: file.size,
          };
        }),
      };

      if (trigger === TRIGGERS.privateMessageSender) {
        payload["user_key"] = triggerPayload?.password;
        if (triggerPayload?.users && triggerPayload?.users?.length > 0) {
          payload["users_list"] = [...triggerPayload?.users, own_user_id];
        }
      }

      const target_user_param = target_user
        ? `?target_user=${target_user}`
        : "";

      const endpoint = isGroup
        ? `${ENDPOINTS.GROUP_CHAT1.POST}${target_user_param}`
        : `${ENDPOINTS.CHAT1.SEND}${target_user_param}`;
      const response = await api.post(endpoint, payload);

      if (!response.data?.success) {
        Notification.error(
          translation(
            "chat_history.noti-msg-media-send-fail",
            "Failed to send message",
          ),
        );
        return;
      }

      if (!response.data?.upload_urls) {
        return Notification.error("Something went wrong");
      }

      if (!response.data?.key) {
        return Notification.error("Something went wrong");
      }

      const uploadUrls: UploadUrl[] = response.data?.upload_urls ?? [];
      const messageKey: string = response.data?.key ?? "";

      let finalMsg = response.data?.data;

      if (files.length > 0 && uploadUrls.length !== files.length) {
        Notification.error("Upload information mismatch");
        return;
      }

      if (files.length > 0 && !messageKey) {
        Notification.error("Encryption key not received");

        return;
      }

      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];

        const uploadInfo = uploadUrls[fileIndex];

        console.log(
          `Processing file ${fileIndex + 1}/${files.length}`,
          file.name,
        );

        const uploadedParts = await uploadEncryptedFile(
          file,
          uploadInfo,
          messageKey,
        );

        console.log("Uploaded parts:", uploadedParts);

        await completeMultipartUpload(uploadInfo, uploadedParts);

        console.log(`Completed upload: ${file.name}`);
      }

      if (finalMsg) {
        finalMsg["double_encryption"] = false;
        finalMsg["body"]["media_url"] = files;
        appendChats([finalMsg]);
      }

      if (isReply) {
        resetTrigger();
      }
      setMessage("");
      setFiles([]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = () => {
    if (trigger === TRIGGERS.isPrivate) {
      setTrigger({
        toTrigger: TRIGGERS.privateMessageModal,
      });

      return;
    }

    if (files.length > 0) {
      SubmitFn(sendWithAttachments);
    } else {
      SubmitFn(sendMessage);
    }
  };

  const togglePrivate = () => {
    if (trigger !== TRIGGERS.isPrivate) {
      setTrigger({
        toTrigger: TRIGGERS.isPrivate,
      });

      setFiles([]);
    } else {
      resetTrigger();
    }
  };

  const triggerHandler = () => {
    switch (trigger) {
      case TRIGGERS.privateMessageSender:
        handleSubmit();
        break;
    }
  };

  useEffect(() => {
    triggerHandler();
  }, [trigger]);

  return (
    <Paper shadow="xs" radius="xl" p="xs" withBorder>
      {/* Replay */}
      <ReplyInputBoxCard />

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {/* Attachment */}
        <FileButton
          onChange={handleFiles}
          multiple
          disabled={submitLoader || trigger === TRIGGERS.isPrivate}
        >
          {(props) => (
            <ActionIcon
              {...props}
              variant="subtle"
              radius="xl"
              size={36}
              aria-label="Attach files"
              disabled={submitLoader || trigger === TRIGGERS.isPrivate}
            >
              <IconPaperclip size={20} stroke={2} />
            </ActionIcon>
          )}
        </FileButton>

        {/* Message + selected files */}
        <div style={{ flex: 1 }}>
          {files.length > 0 && (
            <Group gap={6} mb={6} px={4}>
              <Badge variant="light" leftSection={<IconPaperclip size={13} />}>
                {files.length}{" "}
                {files.length === 1
                  ? translation("chat_history.fileBadge1", "FILE")
                  : translation("chat_history.fileBadge2", "FILES")}{" "}
                {translation("chat_history.fileBadge3", "SELECTED")}
              </Badge>

              {files.map((file, index) => (
                <Badge
                  key={`${file.name}-${index}`}
                  variant="outline"
                  rightSection={
                    <IconX
                      size={12}
                      style={{ cursor: "pointer" }}
                      onClick={() => removeFile(index)}
                    />
                  }
                >
                  <Text size="xs" maw={120} truncate>
                    {file.name}
                  </Text>
                </Badge>
              ))}
            </Group>
          )}

          <TextInput
            placeholder={translation(
              "chat_history.phMsgInputBox",
              "Type a message...",
            )}
            variant="unstyled"
            styles={{
              input: {
                borderRadius: 999,
                padding: "10px 16px",
                backgroundColor: "var(--mantine-color-gray-0)",
              },
            }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            readOnly={submitLoader}
          />
        </div>

        {chatId?.includes("group") && (
          <ActionIcon
            variant={trigger.includes("secret_007") ? "filled" : "subtle"}
            radius="xl"
            size={36}
            onClick={togglePrivate}
          >
            <IconLock size={20} stroke={2} />
          </ActionIcon>
        )}

        {/* Send */}
        <ActionIcon
          variant="filled"
          radius="xl"
          size={36}
          aria-label="Send message"
          onClick={handleSubmit}
          disabled={submitLoader || (!message.trim() && files.length === 0)}
        >
          {submitLoader ? (
            <Loader size={20} />
          ) : (
            <IconSend size={18} stroke={2} />
          )}
        </ActionIcon>
      </div>
    </Paper>
  );
}
