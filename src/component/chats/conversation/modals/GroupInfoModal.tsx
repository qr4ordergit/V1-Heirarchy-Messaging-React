import { useParams } from "react-router";
import { useAuthStore } from "../../../../store/auth/auth.store";
import { OPENERS } from "../../../../utils/constant";
import {
  Button,
  Checkbox,
  FileButton,
  FileInput,
  Flex,
  Image,
  Modal,
  MultiSelect,
  ScrollArea,
  Select,
  TagsInput,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { IconPlaystationX, IconUpload } from "@tabler/icons-react";
import { useEffect, useReducer, useTransition } from "react";
import { useOpenerStore } from "../../../../store/openers/opener.store";
import { Notification } from "../../../../utils/notification";
import { getApiErrorMessage } from "../../../../api/getApiErrorMessage";
import { api } from "../../../../api/axios";
import { ENDPOINTS } from "../../../../api/endpoints";
import useContactNameProvider from "../../../../hooks/useContactNameProvider";
import useContactStore from "../../../../store/contacts/contacts.store";
import {
  useChatStore,
  type CURRENT_CHAT,
} from "../../../../store/chats/chats.store";
import {
  createGroupTagApi,
  deleteGroupTagApi,
  getGroupTagsApi,
} from "../../../../api/createGroupModalApi";
import { useGroupListStore } from "../../../../store/groups/group.list.store";

interface STATE {
  name: string;
  description: string;
  onlyAdminAllowToMessage: boolean;
  admins: string[];
  members: { label: string; value: string }[];
  users: { label: string; value: string }[];
  selectedMembers: string[];
  newOwner: string | null;
  profile: string;
  profileImage: File | null;
  tags: string[];
  updatedTags: string[];
}

const initialState: STATE = {
  name: "",
  description: "",
  onlyAdminAllowToMessage: false,
  admins: [],
  members: [],
  users: [],
  selectedMembers: [],
  profile: "",
  profileImage: null,
  newOwner: null,
  tags: [],
  updatedTags: [],
};

type STATE_ACTION =
  | { type: "RESET" }
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_DESC"; payload: string }
  | { type: "SET_ADMIN_ALLOW_TO_MESSAGE"; payload: boolean }
  | { type: "SET_ADMINS"; payload: string[] }
  | { type: "SET_MEMBERS"; payload: { label: string; value: string }[] }
  | { type: "SET_USERS"; payload: { label: string; value: string }[] }
  | { type: "SET_SELECTED_MEMBERS"; payload: string[] }
  | { type: "SET_PROFILE"; payload: string }
  | { type: "SET_IMAGE"; payload: File | null }
  | { type: "SET_NEW_OWNER"; payload: string | null }
  | { type: "SET_TAGS"; payload: string[] }
  | { type: "SET_UPDATED_TAGS"; payload: string[] };

type ADD_REMOVE_MEM_ACTIONS =
  | "add-members"
  | "remove-members"
  | "change-ownership";

function GroupInfoModal() {
  const { openers, resetOpener } = useOpenerStore((state) => state);
  const { target_user } = useAuthStore((state) => state);
  const { chatId } = useParams<{ chatId: string }>();
  const contactNameProvider = useContactNameProvider();
  const { contacts } = useContactStore((state) => state);
  const { updateGroupInformation, groups } = useGroupListStore(
    (state) => state,
  );
  const { insertCurrentChat } = useChatStore((state) => state);

  const isOpen =
    openers[OPENERS.groupInfoModal]?.opener === OPENERS.groupInfoModal;
  const openerPayload = openers[OPENERS.groupInfoModal]
    ?.payload as CURRENT_CHAT;

  const stateReducer = (state: STATE, action: STATE_ACTION): STATE => {
    switch (action.type) {
      case "SET_NAME":
        return { ...state, name: action.payload };
      case "SET_DESC":
        return { ...state, description: action.payload };
      case "SET_ADMIN_ALLOW_TO_MESSAGE":
        return { ...state, onlyAdminAllowToMessage: action.payload };
      case "SET_ADMINS":
        return { ...state, admins: action.payload };
      case "SET_MEMBERS":
        return { ...state, members: action.payload };
      case "SET_SELECTED_MEMBERS":
        return { ...state, selectedMembers: action.payload };
      case "SET_USERS":
        return { ...state, users: action.payload };
      case "SET_PROFILE":
        return { ...state, profile: action.payload };
      case "SET_IMAGE":
        return { ...state, profileImage: action.payload };
      case "SET_NEW_OWNER":
        return { ...state, newOwner: action.payload };
      case "SET_TAGS":
        return { ...state, tags: action.payload };
      case "SET_UPDATED_TAGS":
        return { ...state, updatedTags: action.payload };
      case "RESET":
        return initialState;

      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(stateReducer, initialState);

  const [submitLoader, SubmitFn] = useTransition();
  const [tagsLoader, TagsFn] = useTransition();

  const onClose = () => {
    resetOpener();
  };

  const userListProvider = () => {
    const groupMems = openerPayload?.members ?? [];

    const existingMems = groupMems.map((mem) => {
      return {
        label: contactNameProvider(mem),
        value: mem,
      };
    });

    const otherUsers = contacts
      .filter(
        (user) =>
          user.contact_user_id && !groupMems.includes(user.contact_user_id),
      )
      .map((user) => ({
        label: contactNameProvider(user.contact_user_id),
        value: user.contact_user_id,
      }));

    dispatch({
      type: "SET_USERS",
      payload: [...existingMems, ...otherUsers],
    });
  };

  const submitApiCall = async (payload: Record<string, unknown>) => {
    try {
      const params = {
        target_user: target_user ? target_user : undefined,
      };
      const res = await api.put(ENDPOINTS.GROUPS.EDIT_GROUP, payload, {
        params,
      });

      if (res.status === 200) {
        return res;
      }

      return false;
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
      return false;
    }
  };

  const checksBeforeSubmit = (): boolean => {
    if (!state.admins.length) {
      Notification.error("Atleast list one admin must be selected");
      return false;
    }

    return true;
  };

  const onSubmit = () => {
    SubmitFn(async () => {
      const isCheckOk = checksBeforeSubmit();
      if (!isCheckOk) return;

      const payload: Record<string, unknown> = {
        group_name: state.name,
        description: state.description,
        only_admins_can_message: state.onlyAdminAllowToMessage,
        group_id: chatId,
      };

      if (state.profileImage) {
        payload["group_image"] = state.profileImage.name;
        payload["group_image_file"] = state.profileImage;
      }

      const res = await submitApiCall(payload);

      if (!res) return;

      const presignedUrl = res.data?.upload_url;

      if (presignedUrl) {
        await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": state.profileImage?.type || "image/png",
          },
          body: state.profileImage,
        });
      }

      await membersAddOrRemoveUpdater();
      await adminsAddOrRemoveUpdater();
      await transferOwnership();
      await tagsHandler();

      const currentGroup = groups.find((grp) => grp._id === chatId);

      const updatedCurrentGroupInfo = {
        ...currentGroup,
        admins: state.admins,
        group_description: state.description,
        group_name: state.name,
        members: state.selectedMembers,
      };

      updateGroupInformation(updatedCurrentGroupInfo);
      insertCurrentChat({
        ...updatedCurrentGroupInfo,
        display_name: updatedCurrentGroupInfo?.group_name,
      });

      Notification.success("Group info updated");
    });
  };

  const addRemoveMemsHandlers = async (
    action: ADD_REMOVE_MEM_ACTIONS,
    mems: {
      new_members?: string[];
      admins?: string[];
      new_owner?: string;
    },
  ) => {
    try {
      const payload = {
        ...mems,
        group_id: chatId,
        operation: action,
      };

      const params = {
        target_user: target_user ? target_user : undefined,
      };

      const res = await api.post(ENDPOINTS.GROUPS.ADD_REMOVE_MEM, payload, {
        params,
      });

      console.log(res);
    } catch (error) {
      Notification.error(getApiErrorMessage(error));
    }
  };

  const newlyAddOrRemovedMemsProvider = (
    existingList: string[],
    newList: string[],
  ): { newMems: string[]; removedMems: string[] } => {
    const previousMembers = existingList;
    const selectedMembers = newList;

    const newlyAddedMembers = selectedMembers.filter(
      (mem) => !previousMembers.includes(mem),
    );

    const removedMembers = previousMembers.filter(
      (mem) => !selectedMembers.includes(mem),
    );

    return {
      newMems: newlyAddedMembers,
      removedMems: removedMembers,
    };
  };

  const membersAddOrRemoveUpdater = async () => {
    const previousMembers = openerPayload?.members ?? [];
    const selectedMembers = state.selectedMembers;

    const { newMems, removedMems } = newlyAddOrRemovedMemsProvider(
      previousMembers,
      selectedMembers,
    );

    if (!newMems.length && !removedMems.length) return;

    if (newMems.length) {
      await addRemoveMemsHandlers("add-members", { new_members: newMems });
    }

    if (removedMems.length) {
      await addRemoveMemsHandlers("remove-members", {
        new_members: removedMems,
      });
    }
  };

  const adminsAddOrRemoveUpdater = async () => {
    const previousMembers = openerPayload?.admins ?? [];
    const selectedMembers = state.admins;

    const { newMems, removedMems } = newlyAddOrRemovedMemsProvider(
      previousMembers,
      selectedMembers,
    );

    if (!newMems.length && !removedMems.length) return;

    if (newMems.length) {
      await addRemoveMemsHandlers("add-members", { admins: newMems });
    }

    if (removedMems.length) {
      await addRemoveMemsHandlers("remove-members", {
        admins: removedMems,
      });
    }
  };

  const transferOwnership = async () => {
    if (typeof state.newOwner !== "string") return;
    await addRemoveMemsHandlers("change-ownership", {
      new_owner: state.newOwner,
    });
  };

  const tagsHandler = async () => {
    const previous = state.tags;
    const current = state.updatedTags;

    const { newMems, removedMems } = newlyAddOrRemovedMemsProvider(
      previous,
      current,
    );

    if (!newMems.length && !removedMems.length) return;

    if (newMems.length) {
      Promise.all(newMems.map((tag) => createGroupTagApi(chatId || "", tag)));
    }

    if (removedMems.length) {
      Promise.all(
        removedMems.map((tag) => deleteGroupTagApi(chatId || "", tag)),
      );
    }
  };

  const initialActions = async () => {
    if (!openerPayload) return;

    if (typeof openerPayload?.display_name === "string") {
      dispatch({
        type: "SET_NAME",
        payload: openerPayload?.display_name,
      });
    }

    if (typeof openerPayload?.group_description === "string") {
      dispatch({
        type: "SET_DESC",
        payload: openerPayload?.group_description,
      });
    }

    if (typeof openerPayload?.only_admins_can_message === "boolean") {
      dispatch({
        type: "SET_ADMIN_ALLOW_TO_MESSAGE",
        payload: openerPayload?.only_admins_can_message,
      });
    }

    if (typeof openerPayload?.profile_url === "string") {
      dispatch({
        type: "SET_PROFILE",
        payload: openerPayload?.profile_url,
      });
    }

    if (Array.isArray(openerPayload?.members)) {
      dispatch({
        type: "SET_MEMBERS",
        payload: openerPayload?.members.map((mem) => {
          return {
            label: contactNameProvider(mem),
            value: mem,
          };
        }),
      });
    }

    if (Array.isArray(openerPayload?.members)) {
      dispatch({
        type: "SET_SELECTED_MEMBERS",
        payload: openerPayload?.members,
      });
    }

    if (Array.isArray(openerPayload?.admins)) {
      dispatch({
        type: "SET_ADMINS",
        payload: openerPayload?.admins,
      });
    }

    userListProvider();

    TagsFn(async () => {
      const tags = await getGroupTagsApi(chatId || "");
      dispatch({ type: "SET_TAGS", payload: tags });
      dispatch({ type: "SET_UPDATED_TAGS", payload: tags });
    });
  };

  useEffect(() => {
    if (isOpen) {
      initialActions();
    }
    return () => {
      dispatch({ type: "RESET" });
    };
  }, [openers]);

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Text fw={700}>Group Information</Text>}
      radius={"lg"}
    >
      <ScrollArea h={"60vh"}>
        <TextInput
          label={"Group Name"}
          placeholder="Update group name"
          value={state.name}
          onChange={(e) =>
            dispatch({ type: "SET_NAME", payload: e.target.value })
          }
        />
        <Textarea
          label={"Group Description"}
          placeholder="Update group description"
          mt={"md"}
          value={state.description}
          onChange={(e) =>
            dispatch({ type: "SET_DESC", payload: e.target.value })
          }
        />
        {openerPayload?.profile_url ? (
          <div className="mt-2">
            <Text size="sm" fw={600}>
              Group Image
            </Text>
            <Image src={state.profile} h={70} w={70} radius={"md"} />
            <Flex mt={"xs"} gap={4} align={"center"}>
              <FileButton
                onChange={(file) => {
                  dispatch({ type: "SET_IMAGE", payload: file });
                  if (file instanceof File) {
                    dispatch({
                      type: "SET_PROFILE",
                      payload: URL.createObjectURL(file),
                    });
                  }
                }}
                accept="image/png,image/jpeg"
              >
                {(props) => (
                  <Button size="xs" {...props}>
                    Change image
                  </Button>
                )}
              </FileButton>
              {state.profileImage && (
                <IconPlaystationX
                  className="cursor-pointer"
                  onClick={() => {
                    if (typeof openerPayload?.profile_url === "string") {
                      dispatch({
                        type: "SET_PROFILE",
                        payload: openerPayload?.profile_url,
                      });
                    }
                    dispatch({ type: "SET_IMAGE", payload: null });
                  }}
                />
              )}
            </Flex>
          </div>
        ) : (
          <FileInput
            label="Group Image"
            placeholder="upload picture"
            leftSection={<IconUpload stroke={2} />}
            mt={"md"}
            clearable
            value={state.profileImage}
            onChange={(file) => {
              dispatch({ type: "SET_IMAGE", payload: file });
            }}
          />
        )}
        <MultiSelect
          label="Add or Remove Group Members"
          placeholder="Select admin(s)"
          data={state.users}
          value={state.selectedMembers}
          onChange={(e) =>
            dispatch({ type: "SET_SELECTED_MEMBERS", payload: e })
          }
          mt={"md"}
          hidePickedOptions
        />
        <MultiSelect
          label="Group Admins"
          placeholder="Select admin(s)"
          data={state.members}
          value={state.admins}
          onChange={(e) => dispatch({ type: "SET_ADMINS", payload: e })}
          mt={"md"}
          hidePickedOptions
        />
        <Select
          label={"Transfer Ownership"}
          mt={"md"}
          placeholder="Select user"
          data={state.admins
            .filter((ad) => contactNameProvider(ad) !== "You")
            .map((ad) => {
              return {
                label: contactNameProvider(ad),
                value: ad,
              };
            })}
          value={state.newOwner}
          onChange={(e) => dispatch({ type: "SET_NEW_OWNER", payload: e })}
        />
        <TagsInput
          label="Create or Remove Tags"
          placeholder="Type and enter to create"
          mt={"md"}
          data={state.tags}
          value={state.updatedTags}
          onChange={(e) => dispatch({ type: "SET_UPDATED_TAGS", payload: e })}
          loading={tagsLoader}
          disabled={tagsLoader}
        />
        <Checkbox
          label="Allow admins to send messages"
          mt={"md"}
          checked={state.onlyAdminAllowToMessage}
          onChange={(e) =>
            dispatch({
              type: "SET_ADMIN_ALLOW_TO_MESSAGE",
              payload: e.target.checked,
            })
          }
        />
      </ScrollArea>

      <Button
        fullWidth
        mt={"md"}
        onClick={onSubmit}
        loading={submitLoader}
        loaderProps={{ type: "dots" }}
      >
        Update
      </Button>
    </Modal>
  );
}

export default GroupInfoModal;
