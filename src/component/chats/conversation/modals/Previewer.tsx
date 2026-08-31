import { Image, Modal } from "@mantine/core";
import { useTriggerStore } from "../../../../store/trigger/trigger.store";
import { TRIGGERS } from "../../../../utils/constant";
import { Carousel } from "@mantine/carousel";
import { useExtentionMediaProvider } from "../../../../hooks/useExtentionMediaProvider";

function Previewer() {
  const { trigger, resetTrigger, triggerPayload } = useTriggerStore(
    (state) => state,
  );

  const getMediaType = useExtentionMediaProvider();

  const onClose = () => {
    resetTrigger();
  };

  return (
    <Modal
      opened={trigger === TRIGGERS.previewMedia}
      onClose={onClose}
      title="Media Previewer"
      size="100%"
      centered
    >
      <Carousel withIndicators height="70vh" slideSize="100%" slideGap="0">
        {triggerPayload?.body?.media_url?.map((url) => (
          <Carousel.Slide key={url?.name}>
            <div className="w-full h-full flex items-center justify-center">
              {getMediaType(url?.name) === "image" ? (
                <Image
                  src={URL.createObjectURL(url)}
                  alt="Media preview"
                  className="max-w-full max-h-full"
                  fit="contain"
                />
              ) : (
                <video
                  src={URL.createObjectURL(url)}
                  className="max-w-full max-h-full rounded-lg object-contain"
                  controls
                  preload="metadata"
                />
              )}
            </div>
          </Carousel.Slide>
        ))}
      </Carousel>
    </Modal>
  );
}

export default Previewer;
