import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import * as XLSX from "xlsx";
import { notifications } from "@mantine/notifications";
import {
  Alert,
  Button,
  Group,
  List,
  Loader,
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

interface BulkUploadPanelProps {
  onUploaded?: () => void | Promise<void>;

  onDone: () => void;

  onBusyChange?: (busy: boolean) => void;
}

const SAMPLE_ROWS: string[][] = [
  ["username", "password", "display_name", "description"],
  ["jdoe", "Passw0rd!", "John Doe", "Sales team lead"],
  ["asmith", "Passw0rd!", "", "Support agent"],
];

export default function BulkUploadPanel({
  onUploaded,
  onDone,
  onBusyChange,
}: BulkUploadPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [finishingUp, setFinishingUp] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{
    message?: string;
    total?: number;
    created?: number;
    failed?: number;
    errors?: Array<{ row?: number; username?: string; message: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onBusyChange?.(uploading || finishingUp);
  }, [uploading, finishingUp, onBusyChange]);

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

      const total = response.total ?? undefined;
      const created = response.created ?? response.success_count ?? undefined;
      const failed =
        response.failed_count ??
        (total !== undefined && created !== undefined
          ? total - created
          : response.errors?.length);

      setResultSummary({
        message: response.message,
        total,
        created,
        failed,
        errors: response.errors,
      });

      notifications.show({
        color: "teal",
        title: "Bulk upload processed",
        message: response.message || "The file was uploaded successfully.",
      });

      setSelectedFile(null);
      setUploading(false);
      setFinishingUp(true);

      const hasErrors = (response.errors?.length ?? 0) > 0;

      window.setTimeout(() => {
        void onUploaded?.();
        setFinishingUp(false);
        if (!hasErrors) {
          setResultSummary(null);
          setUploadError(null);
          onDone();
        }
      }, 4000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not process the file.";
      setUploadError(message);
      notifications.show({
        color: "red",
        title: "Couldn't upload file",
        message,
      });
      setUploading(false);
    }
  };

  return (
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
            resultSummary.failed && resultSummary.failed > 0 ? "yellow" : "teal"
          }
          title="Upload result"
        >
          {resultSummary.total !== undefined ||
          resultSummary.created !== undefined ? (
            <Stack gap={2}>
              {resultSummary.total !== undefined && (
                <Text size="sm">
                  <strong>Total:</strong> {resultSummary.total}
                </Text>
              )}
              {resultSummary.created !== undefined && (
                <Text size="sm">
                  <strong>Created:</strong> {resultSummary.created}
                </Text>
              )}
              {resultSummary.failed !== undefined && (
                <Text size="sm">
                  <strong>Failed:</strong> {resultSummary.failed}
                </Text>
              )}
            </Stack>
          ) : (
            <Text size="sm">
              {resultSummary.message || "The file was processed successfully."}
            </Text>
          )}

          {resultSummary.errors && resultSummary.errors.length > 0 && (
            <List size="sm" mt={8} spacing={4}>
              {resultSummary.errors.map((e, idx) => (
                <List.Item key={idx}>
                  {e.row !== undefined ? `Row ${e.row} — ` : ""}
                  {e.username ? `${e.username} — ` : ""}
                  {e.message}
                </List.Item>
              ))}
            </List>
          )}

          {finishingUp && (
            <Group gap={8} mt={10}>
              <Loader size="xs" />
              <Text size="xs" c="dimmed">
                Refreshing the accounts list…
              </Text>
            </Group>
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
        <Button
          variant="subtle"
          onClick={onDone}
          disabled={uploading || finishingUp}
        >
          {resultSummary ? "Close" : "Cancel"}
        </Button>
        <Button
          radius="xl"
          variant="gradient"
          leftSection={!finishingUp ? <IconUpload size={16} /> : undefined}
          loading={uploading || finishingUp}
          disabled={!selectedFile}
          onClick={handleUpload}
        >
          {finishingUp ? "Finishing up…" : "Upload"}
        </Button>
      </Group>
    </Stack>
  );
}
