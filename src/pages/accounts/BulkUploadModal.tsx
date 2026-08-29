import { useRef, useState } from "react";
import type { DragEvent } from "react";
import * as XLSX from "xlsx";
import { notifications } from "@mantine/notifications";
import {
  Alert,
  Button,
  Group,
  List,
  Modal,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconDownload,
  IconFileSpreadsheet,
  IconUpload,
} from "@tabler/icons-react";
import { bulkRegisterSubUsers } from "../../api/accountApi";
import classes from "./Accounts.module.css";

interface BulkUploadModalProps {
  opened: boolean;
  onClose: () => void;
  onUploaded?: () => void | Promise<void>;
}

const SAMPLE_ROWS: string[][] = [
  ["username", "password", "display_name", "description"],
  ["jdoe", "Passw0rd!", "John Doe", "Sales team lead"],
  ["asmith", "Passw0rd!", "", "Support agent"],
];

export default function BulkUploadModal({
  opened,
  onClose,
  onUploaded,
}: BulkUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{
    successCount?: number;
    failedCount?: number;
    errors?: Array<{ row?: number; username?: string; message: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (uploading) return;
    setSelectedFile(null);
    setUploadError(null);
    setResultSummary(null);
    onClose();
  };

  const acceptedExtensions = [".xlsx"];

  const isAcceptedFile = (file: File) =>
    acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  const handleFileChosen = (file: File | undefined | null) => {
    if (!file) return;

    if (!isAcceptedFile(file)) {
      notifications.show({
        color: "red",
        title: "Couldn't select file",
        message: "Please choose an .xlsx file.",
      });
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setResultSummary(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChosen(e.dataTransfer.files?.[0]);
  };

  const handleDownloadSample = () => {
    const worksheet = XLSX.utils.aoa_to_sheet(SAMPLE_ROWS);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");
    XLSX.writeFile(workbook, "bulk_upload_sample.xlsx");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setResultSummary(null);

    try {
      const response = await bulkRegisterSubUsers(selectedFile);

      setResultSummary({
        successCount: response.success_count,
        failedCount: response.failed_count,
        errors: response.errors,
      });

      notifications.show({
        color: "teal",
        title: "Bulk upload processed",
        message: response.message || "The file was uploaded successfully.",
      });

      setSelectedFile(null);
      await onUploaded?.();
      onClose();
      // window.location.reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not process the file.";
      setUploadError(message);
      notifications.show({
        color: "red",
        title: "Couldn't upload file",
        message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Bulk Upload Accounts"
      centered
      radius="md"
      size="lg"
      closeOnClickOutside={!uploading}
      closeOnEscape={!uploading}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Add multiple accounts at once. Start by downloading the sample file,
          fill in the details, save it as .xlsx, then upload it here.
        </Text>

        {uploadError && (
          <Alert color="red" title="Couldn't upload file">
            {uploadError}
          </Alert>
        )}

        {resultSummary && (
          <Alert
            color={
              resultSummary.failedCount && resultSummary.failedCount > 0
                ? "yellow"
                : "teal"
            }
            title="Upload result"
          >
            <Text size="sm">
              {resultSummary.successCount ?? 0} account
              {resultSummary.successCount === 1 ? "" : "s"} created successfully
              {resultSummary.failedCount
                ? `, ${resultSummary.failedCount} failed.`
                : "."}
            </Text>
            {resultSummary.errors && resultSummary.errors.length > 0 && (
              <List size="xs" mt={6}>
                {resultSummary.errors.slice(0, 10).map((e, idx) => (
                  <List.Item key={idx}>
                    {e.username
                      ? `${e.username}: `
                      : e.row
                        ? `Row ${e.row}: `
                        : ""}
                    {e.message}
                  </List.Item>
                ))}
              </List>
            )}
          </Alert>
        )}

        <Group
          justify="space-between"
          wrap="nowrap"
          p="md"
          className={classes.row}
          style={{ borderRadius: 12, border: "1px solid #e7e5f3" }}
        >
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={36} radius="xl" variant="light" color="indigo">
              <IconFileSpreadsheet size={18} />
            </ThemeIcon>
            <div>
              <Text size="sm" fw={600}>
                Sample template
              </Text>
              <Text size="xs" c="dimmed">
                username, password, display_name, description
              </Text>
            </div>
          </Group>
          <Button
            variant="light"
            radius="xl"
            leftSection={<IconDownload size={16} />}
            onClick={handleDownloadSample}
          >
            Download Sample
          </Button>
        </Group>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          style={{ display: "none" }}
          onChange={(e) => handleFileChosen(e.target.files?.[0])}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            cursor: "pointer",
            borderRadius: 12,
            border: `2px dashed ${isDragging ? "#7c5cff" : "#d3d0e6"}`,
            background: isDragging ? "#f1eefe" : "#faf9fd",
            transition: "border-color 150ms ease, background 150ms ease",
            padding: "28px 16px",
          }}
        >
          <Group justify="center" gap="md">
            <IconUpload size={32} stroke={1.5} color="#7a7791" />
            <div>
              <Text size="sm" fw={600} ta="center">
                {selectedFile
                  ? selectedFile.name
                  : "Drag file here or click to browse"}
              </Text>
              <Text size="xs" c="dimmed" ta="center" mt={4}>
                .xlsx only, up to 5MB
              </Text>
            </div>
          </Group>
        </div>

        {selectedFile && !resultSummary && (
          <Alert color="blue" title="File selected" variant="light">
            {selectedFile.name} is ready to upload.
          </Alert>
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={handleClose} disabled={uploading}>
            {resultSummary ? "Close" : "Cancel"}
          </Button>
          <Button
            radius="xl"
            variant="gradient"
            leftSection={<IconUpload size={16} />}
            loading={uploading}
            disabled={!selectedFile}
            onClick={handleUpload}
          >
            Upload
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
