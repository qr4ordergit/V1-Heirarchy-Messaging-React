import { Modal } from "@mantine/core";
import { IDLE_BULK_JOB, type BulkJobState } from "../../api/accountApi";
import BulkUploadPanel from "./BulkUploadPanel";

interface BulkUploadModalProps {
  opened: boolean;
  onClose: () => void;
  job?: BulkJobState;
  onUpload: (file: File) => void;
}

export default function BulkUploadModal({
  opened,
  onClose,
  job,
  onUpload,
}: BulkUploadModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Bulk Upload Accounts"
      centered
      radius="md"
      size="lg"
    >
      <BulkUploadPanel
        job={job ?? IDLE_BULK_JOB}
        onUpload={onUpload}
        onClose={onClose}
      />
    </Modal>
  );
}
