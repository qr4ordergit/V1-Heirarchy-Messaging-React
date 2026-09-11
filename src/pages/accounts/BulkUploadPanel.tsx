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
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconDownload,
  IconFileSpreadsheet,
  IconInfoCircle,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import type { BulkJobState } from "../../api/accountApi";
import { useTranslation } from "../../store/language/language.store";
import classes from "./Accounts.module.css";

interface BulkUploadPanelProps {
  job: BulkJobState;
  onUpload: (file: File) => void;
  onClose: () => void;
  onDiscard?: () => void;
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
  onDiscard,
}: BulkUploadPanelProps) {
  const { translation } = useTranslation();

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
        title: translation(
          "bulk_upload.ntfyCouldntSelectFileTitle",
          "Couldn't select file",
        ),
        message: translation(
          "bulk_upload.errChooseXlsxFile",
          "Please choose an .xlsx file.",
        ),
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

  const handleDownloadErrors = () => {
    if (!job.errors || job.errors.length === 0) return;

    const hasSourceData =
      !!job.sourceHeaders?.length && !!job.sourceRows?.length;

    let rows: (string | number)[][];

    if (hasSourceData) {
      const headers = job.sourceHeaders as string[];
      const sourceRows = job.sourceRows as string[][];
      const passwordColIndex = headers.findIndex(
        (h) => h.trim().toLowerCase() === "password",
      );

      const errorsByRow = new Map<number, string[]>();
      job.errors.forEach((e) => {
        if (e.row === undefined) return;
        const existing = errorsByRow.get(e.row) ?? [];
        existing.push(e.message);
        errorsByRow.set(e.row, existing);
      });

      rows = [
        [...headers, "Error [Remove this column before re-uploading]"],
        ...Array.from(errorsByRow.entries())
          .sort(([a], [b]) => a - b)
          .map(([row, messages]) => {
            const originalRow = [
              ...(sourceRows[row - 2] ?? headers.map(() => "")),
            ];
            if (passwordColIndex !== -1) {
              originalRow[passwordColIndex] = "";
            }
            return [...originalRow, messages.join("; ")];
          }),
      ];
    } else {
      rows = [
        ["Row", "Username", "Error"],
        ...job.errors.map((e) => [
          e.row ?? "",
          e.username ?? "",
          e.message ?? "",
        ]),
      ];
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const colCount = rows[0]?.length ?? 3;
    worksheet["!cols"] = Array.from({ length: colCount }, (_, i) =>
      i === colCount - 1 ? { wch: 50 } : { wch: 20 },
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Failed Accounts");

    const suffix = job.jobId ? job.jobId.slice(0, 8) : "job";
    XLSX.writeFile(workbook, `bulk_upload_errors_${suffix}.xlsx`);
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
  const isTerminal =
    job.status === "completed" ||
    job.status === "failed" ||
    job.status === "error";

  const hasErrors = (job.errors?.length ?? 0) > 0;

  return (
    <Stack gap="md">
      {job.status === "idle" && (
        <Text size="sm" c="dimmed">
          {translation(
            "bulk_upload.txtIntro",
            "Add multiple accounts at once. Start by downloading the sample file, fill in the details, save it as .xlsx, then upload it here.",
          )}
        </Text>
      )}

      {job.status === "error" && (
        <Alert
          color="red"
          title={translation(
            "bulk_upload.alertCouldntUploadFileTitle",
            "Couldn't upload file",
          )}
        >
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
              ? translation(
                  "bulk_upload.titleProcessingUpload",
                  "Processing upload…",
                )
              : job.status === "failed"
                ? translation("bulk_upload.titleUploadFailed", "Upload failed")
                : translation("bulk_upload.titleUploadResult", "Upload result")
          }
        >
          <Stack gap={2}>
            {job.total !== undefined && (
              <Text size="sm">
                <strong>{translation("bulk_upload.txtTotal", "Total:")}</strong>{" "}
                {job.total}
              </Text>
            )}
            {job.created !== undefined && (
              <Text size="sm">
                <strong>
                  {translation("bulk_upload.txtCreated", "Created:")}
                </strong>{" "}
                {job.created}
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
            <Stack gap={6} mt={8}>
              <Group justify="space-between" align="center" wrap="nowrap">
                <Text size="xs" fw={600} c="dimmed">
                  {job.errors.length}{" "}
                  {job.errors.length === 1
                    ? translation("bulk_upload.txtRowFailed", "row failed")
                    : translation("bulk_upload.txtRowsFailed", "rows failed")}
                </Text>
                <Button
                  size="compact-xs"
                  variant="light"
                  radius="xl"
                  leftSection={<IconDownload size={14} />}
                  onClick={handleDownloadErrors}
                >
                  {translation(
                    "bulk_upload.btnDownloadErrors",
                    "Download Errors (.xlsx)",
                  )}
                </Button>
              </Group>
              <Text size="xs" c="dimmed">
                {translation(
                  "bulk_upload.txtPasswordsBlankNote",
                  "Passwords are left blank in the download for security — re-enter them before re-uploading.",
                )}
              </Text>

              <ScrollArea.Autosize mah={180} type="auto">
                <List size="sm" spacing={4}>
                  {job.errors.map((e, idx) => (
                    <List.Item key={idx}>
                      {e.row !== undefined
                        ? `${translation("bulk_upload.txtRow", "Row")} ${e.row} — `
                        : ""}
                      {e.username ? `${e.username} — ` : ""}
                      {e.message}
                    </List.Item>
                  ))}
                </List>
              </ScrollArea.Autosize>
            </Stack>
          )}

          {job.status === "processing" && (
            <Group gap={8} mt={10}>
              <Loader size="xs" />
              <Text size="xs" c="dimmed">
                {translation(
                  "bulk_upload.txtStillProcessing",
                  "Still processing… you can close this and keep working, we'll notify you when it's done.",
                )}
              </Text>
            </Group>
          )}
        </Alert>
      )}

      {job.status === "uploading" && (
        <Group gap={8}>
          <Loader size="xs" />
          <Text size="sm" c="dimmed">
            {translation(
              "bulk_upload.txtUploadingFile",
              "Uploading your file…",
            )}
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
                  {translation(
                    "bulk_upload.txtSampleTemplate",
                    "Sample template",
                  )}
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
              {translation("bulk_upload.btnDownloadSample", "Download Sample")}
            </Button>
          </Group>
          <Alert
            variant="light"
            color="gray"
            icon={<IconInfoCircle size={16} />}
            title={translation(
              "bulk_upload.titleBeforeYouUpload",
              "Before you upload",
            )}
            py={10}
          >
            <List
              size="xs"
              spacing={4}
              type="unordered"
              styles={{
                item: {
                  listStyleType: "disc",
                },
              }}
            >
              <List.Item>
                <strong>username</strong>{" "}
                {translation("bulk_upload.txtAnd", "and")}{" "}
                <strong>password</strong>{" "}
                {translation(
                  "bulk_upload.txtMandatoryForEveryRow",
                  "are mandatory for every row.",
                )}
              </List.Item>

              <List.Item>
                <strong>password</strong>{" "}
                {translation(
                  "bulk_upload.txtPasswordRequirements",
                  "must be at least 8 characters, alphanumeric, with at least one special character, one number, and one uppercase letter.",
                )}
              </List.Item>
            </List>

            <Text size="xs" c="dimmed" mt={8}>
              <strong>{translation("bulk_upload.txtNote", "Note:")}</strong>{" "}
              {translation(
                "bulk_upload.txtUsernamePrefixSuffixNote",
                "To maintain uniqueness, the system will automatically add a prefix & suffix to your username input.",
              )}
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
                    : translation(
                        "bulk_upload.txtDragOrClick",
                        "Drag file here or click to browse",
                      )}
                </Text>
                <Text size="xs" c="dimmed" ta="center" mt={4}>
                  {translation(
                    "bulk_upload.txtXlsxOnly",
                    ".xlsx only, up to 5MB",
                  )}
                </Text>
              </div>
            </Group>
          </div>

          {selectedFile && (
            <Alert
              color="blue"
              title={translation(
                "bulk_upload.alertFileSelectedTitle",
                "File selected",
              )}
              variant="light"
            >
              {selectedFile.name}{" "}
              {translation(
                "bulk_upload.txtReadyToUpload",
                "is ready to upload.",
              )}
            </Alert>
          )}
        </>
      )}

      <Group justify="flex-end" mt="xs">
        {isTerminal && onDiscard && (
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={14} />}
            onClick={onDiscard}
          >
            {translation("bulk_upload.btnDiscard", "Discard")}
          </Button>
        )}
        <Button variant="subtle" onClick={onClose}>
          {job.status === "idle"
            ? translation("bulk_upload.btnCancel", "Cancel")
            : translation("bulk_upload.btnClose", "Close")}
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
            {translation("bulk_upload.btnUpload", "Upload")}
          </Button>
        )}
      </Group>
    </Stack>
  );
}
