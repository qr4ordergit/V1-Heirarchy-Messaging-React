import { useState } from "react";
import { Modal } from "@mantine/core";
import BulkUploadPanel from "./BulkUploadPanel";

interface BulkUploadModalProps {
  opened: boolean;
  onClose: () => void;
  onUploaded?: () => void | Promise<void>;
}

export default function BulkUploadModal({
  opened,
  onClose,
  onUploaded,
}: BulkUploadModalProps) {
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Bulk Upload Accounts"
      centered
      radius="md"
      size="lg"
      closeOnClickOutside={!busy}
      closeOnEscape={!busy}
    >
      <BulkUploadPanel
        onDone={onClose}
        onUploaded={onUploaded}
        onBusyChange={setBusy}
      />
    </Modal>
  );
}
