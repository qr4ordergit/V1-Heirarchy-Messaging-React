import { Image, Modal } from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../../utils/constant";
import { useTranslation } from "../../../../store/language/language.store";

function Previewer() {
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );
  const { translation } = useTranslation();

  const onClose = () => {
    resetTrigger();
  };

  return (
    <Modal
      opened={trigger === TRIGGERS.previewMedia}
      onClose={onClose}
      title={translation("chat_history.modal-preview-title", "Media Previewer")}
      size="100%"
      centered
    >
      <div className="w-full h-100 flex items-center justify-center">
        {typeof triggerPayload?.src === "string" ? (
          triggerPayload?.type === "image" ? (
            <Image
              src={triggerPayload?.src}
              alt="Media preview"
              className="w-100 h-100"
              fit="contain"
            />
          ) : (
            <video
              src={triggerPayload?.src}
              className="max-w-full max-h-full rounded-lg object-contain"
              controls
              preload="metadata"
            />
          )
        ) : null}
      </div>
    </Modal>
  );
}

export default Previewer;
