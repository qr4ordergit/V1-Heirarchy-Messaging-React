import { useRef, useState } from "react";
import type { DragEvent } from "react";
import * as XLSX from "xlsx";
import { notifications } from "@mantine/notifications";
import {
  Alert,
  Button,
  Group,
  List,
  Loader,
  Progress,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconDownload,
  IconFileSpreadsheet,
  IconInfoCircle,
  IconUpload,
} from "@tabler/icons-react";
import type { BulkJobState } from "../../api/accountApi";
import classes from "./Accounts.module.css";

interface BulkUploadPanelProps {
  job: BulkJobState;
  onUpload: (file: File) => void;
  onClose: () => void;
}

const SAMPLE_ROWS: string[][] = [
  ["username", "password", "display_name", "description"],
  ["jdoe", "Passw0rd!", "John Doe", "Sales team lead"],
  ["asmith", "Passw0rd!", "", "Support agent"],
];

export default function BulkUploadPanel({
  job,
  onUpload,
  onClose,
}: BulkUploadPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUploadClick = () => {
    if (!selectedFile) return;
    onUpload(selectedFile);
    setSelectedFile(null);
  };

  const isBusy = job.status === "uploading" || job.status === "processing";
  const hasResult =
    job.status === "processing" ||
    job.status === "completed" ||
    job.status === "failed" ||
    job.status === "error";

  const hasErrors = (job.errors?.length ?? 0) > 0;

  return (
    <Stack gap="md">
      {job.status === "idle" && (
        <Text size="sm" c="dimmed">
          Add multiple accounts at once. Start by downloading the sample file,
          fill in the details, save it as .xlsx, then upload it here.
        </Text>
      )}

      {job.status === "error" && (
        <Alert color="red" title="Couldn't upload file">
          {job.errorMessage}
        </Alert>
      )}

      {hasResult && job.status !== "error" && (
        <Alert
          color={
            job.status === "failed"
              ? "red"
              : hasErrors
                ? "yellow"
                : job.status === "processing"
                  ? "blue"
                  : "teal"
          }
          title={
            job.status === "processing"
              ? "Processing upload…"
              : job.status === "failed"
                ? "Upload failed"
                : "Upload result"
          }
        >
          <Stack gap={2}>
            {job.total !== undefined && (
              <Text size="sm">
                <strong>Total:</strong> {job.total}
              </Text>
            )}
            {job.created !== undefined && (
              <Text size="sm">
                <strong>Created:</strong> {job.created}
              </Text>
            )}
          </Stack>

          {job.status === "processing" &&
            job.total !== undefined &&
            job.total > 0 && (
              <Progress
                value={((job.created ?? 0) / job.total) * 100}
                mt={8}
                size="sm"
                radius="xl"
                animated
              />
            )}

          {job.errors && job.errors.length > 0 && (
            <List size="sm" mt={8} spacing={4}>
              {job.errors.map((e, idx) => (
                <List.Item key={idx}>
                  {e.row !== undefined ? `Row ${e.row} — ` : ""}
                  {e.username ? `${e.username} — ` : ""}
                  {e.message}
                </List.Item>
              ))}
            </List>
          )}

          {job.status === "processing" && (
            <Group gap={8} mt={10}>
              <Loader size="xs" />
              <Text size="xs" c="dimmed">
                Still processing… you can close this and keep working, we'll
                notify you when it's done.
              </Text>
            </Group>
          )}
        </Alert>
      )}

      {job.status === "uploading" && (
        <Group gap={8}>
          <Loader size="xs" />
          <Text size="sm" c="dimmed">
            Uploading your file…
          </Text>
        </Group>
      )}

      {job.status === "idle" && (
        <>
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
          <Alert
            variant="light"
            color="gray"
            icon={<IconInfoCircle size={16} />}
            title="Before you upload"
            py={10}
          >
            <List size="xs" spacing={4}>
              <List.Item>
                <strong>username</strong> and <strong>password</strong> are
                mandatory for every row.
              </List.Item>
              <List.Item>
                <strong>password</strong> must be at least 8 characters,
                alphanumeric, with at least one special character, one number,
                and one uppercase letter.
              </List.Item>
            </List>

            <Text size="xs" c="dimmed" mt={8}>
              <strong>Note:</strong> To maintain uniqueness, the system will
              automatically add a prefix & suffix to your username input.
            </Text>
          </Alert>
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

          {selectedFile && (
            <Alert color="blue" title="File selected" variant="light">
              {selectedFile.name} is ready to upload.
            </Alert>
          )}
        </>
      )}

      <Group justify="flex-end" mt="xs">
        <Button variant="subtle" onClick={onClose}>
          {job.status === "idle" ? "Cancel" : "Close"}
        </Button>
        {job.status === "idle" && (
          <Button
            radius="xl"
            variant="gradient"
            leftSection={<IconUpload size={16} />}
            loading={isBusy}
            disabled={!selectedFile}
            onClick={handleUploadClick}
          >
            Upload
          </Button>
        )}
      </Group>
    </Stack>
  );
}
