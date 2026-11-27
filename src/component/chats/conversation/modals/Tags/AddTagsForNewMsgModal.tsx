import { Button, Group, Modal, Text } from "@mantine/core";
import { TRIGGERS } from "../../../../../utils/constant";
import TagsProvider from "./TagsProvider";
import { useState } from "react";
import { useTriggerStore } from "../../../../../store/trigger/trigger.store";

function AddTagsForNewMsgModal() {
  const { trigger, resetTrigger, setTrigger } = useTriggerStore(
    (state) => state,
  );

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const resetStates = () => {
    setSelectedTags([]);
  };

  const onClose = () => {
    resetStates();
    resetTrigger();
  };

  const handleAdd = () => {
    setTrigger({
      toTrigger: TRIGGERS.tagsForNewMsgModal_payload,
      payload: {
        tags: selectedTags,
      },
    });
    resetStates();
  };

  const handleCancel = () => {
    onClose();
  };
  return (
    <Modal
      opened={trigger === TRIGGERS.tagsForNewMsgModal}
      onClose={onClose}
      title={<Text fw={700}>Add Tags</Text>}
      radius={"lg"}
    >
      <TagsProvider
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
      />

      <Group justify="end">
        <Button onClick={handleAdd}>Add</Button>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </Group>
    </Modal>
  );
}

export default AddTagsForNewMsgModal;
