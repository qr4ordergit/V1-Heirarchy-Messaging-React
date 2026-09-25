import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Group,
  Loader,
  Modal,
  Progress,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconEdit,
  IconGripVertical,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUpload,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Notification } from "../../../utils/notification";
import { getApiErrorMessage } from "../../../api/getApiErrorMessage";
import {
  ManageVideosService,
  getVideoId,
  type VideoRecord,
} from "../../../api/services/manage.videos.service";

const PAGE_OPTIONS = [
  { value: "homepage-intro", label: "Homepage Intro Video" },
  { value: "homepage-corousal", label: "Homepage Carousel" },
];

const nextOrder = (videos: VideoRecord[]) =>
  videos.length > 0 ? Math.max(...videos.map((v) => v.order || 0)) + 1 : 1;

const sortByOrder = (videos: VideoRecord[]) =>
  videos.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

interface PendingUpload {
  id: string;
  file: File;
}

const ManageVideos = () => {
  const [activePage, setActivePage] = useState<string>(PAGE_OPTIONS[0].value);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replaceProgress, setReplaceProgress] = useState(0);

  const [editTarget, setEditTarget] = useState<VideoRecord | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<VideoRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [previewVideo, setPreviewVideo] = useState<VideoRecord | null>(null);

  const [reordering, setReordering] = useState(false);

  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const loadVideos = async (pageName: string) => {
    setLoading(true);
    try {
      const list = await ManageVideosService.list(pageName);
      setVideos(sortByOrder(list));
    } catch (err) {
      Notification.error(
        getApiErrorMessage(err, "Could not load videos."),
        "Load failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setPendingFiles(files.map((file) => ({ id: crypto.randomUUID(), file })));
    setUploadProgress({});
    if (addFileInputRef.current) addFileInputRef.current.value = "";
  };

  const removePending = (id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const cancelPending = () => {
    setPendingFiles([]);
    setUploadProgress({});
  };

  const handlePendingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPendingFiles((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const confirmUploadAll = async () => {
    if (pendingFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({});
    try {
      const startOrder = nextOrder(videos);
      const orderById = new Map(
        pendingFiles.map((p, i) => [p.id, startOrder + i]),
      );

      const payload = pendingFiles.map((p) => ({
        page_name: activePage,
        file: p.file.name,
        order: orderById.get(p.id)!,
        content_type: p.file.type || "video/mp4",
      }));

      const created = await ManageVideosService.create(payload);

      const results = await Promise.allSettled(
        pendingFiles.map(async (p, i) => {
          const order = orderById.get(p.id)!;
          const record =
            created.find((r) => r.file === p.file.name && r.order === order) ??
            created[i];

          if (!record?.upload_url) {
            throw new Error(`No upload URL returned for ${p.file.name}`);
          }

          await ManageVideosService.uploadToS3(
            record.upload_url,
            p.file,
            (pct) => setUploadProgress((prev) => ({ ...prev, [p.id]: pct })),
          );
        }),
      );

      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length === 0) {
        Notification.success(
          `${pendingFiles.length} video${
            pendingFiles.length > 1 ? "s" : ""
          } uploaded successfully.`,
        );
      } else {
        failed.forEach((f) =>
          console.error((f as PromiseRejectedResult).reason),
        );
        Notification.error(
          `${failed.length} of ${pendingFiles.length} uploads failed. Check the browser console for details.`,
          "Some uploads failed",
        );
      }

      setPendingFiles([]);
      await loadVideos(activePage);
    } catch (err) {
      Notification.error(
        getApiErrorMessage(err, "Could not upload videos."),
        "Upload failed",
      );
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const startReplace = (video: VideoRecord) => {
    setReplacingId(getVideoId(video));
    replaceFileInputRef.current?.click();
  };

  const handleReplaceFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    const id = replacingId;
    if (!file || !id) {
      setReplacingId(null);
      return;
    }

    setReplaceProgress(0);
    try {
      const result = await ManageVideosService.update({
        id,
        file: file.name,
        content_type: file.type || "video/mp4",
      });

      if (!result.upload_url) {
        throw new Error("Server did not return an upload URL.");
      }

      await ManageVideosService.uploadToS3(
        result.upload_url,
        file,
        setReplaceProgress,
      );

      Notification.success("Video replaced successfully.");
      await loadVideos(activePage);
    } catch (err) {
      Notification.error(
        getApiErrorMessage(err, "Could not replace video."),
        "Replace failed",
      );
    } finally {
      setReplacingId(null);
      setReplaceProgress(0);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  };

  const openEditModal = (video: VideoRecord) => {
    setEditTarget(video);
    setEditTitle(video.title ?? "");
    setEditDescription(video.description ?? "");
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      await ManageVideosService.update({
        id: getVideoId(editTarget),
        title: editTitle || undefined,
        description: editDescription || undefined,
      });
      Notification.success("Video details updated.");
      setEditTarget(null);
      await loadVideos(activePage);
    } catch (err) {
      Notification.error(
        getApiErrorMessage(err, "Could not update video."),
        "Update failed",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ManageVideosService.remove(getVideoId(deleteTarget));
      Notification.success("Video deleted.");
      setDeleteTarget(null);
      await loadVideos(activePage);
    } catch (err) {
      Notification.error(
        getApiErrorMessage(err, "Could not delete video."),
        "Delete failed",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleVideoDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = videos.findIndex((v) => getVideoId(v) === active.id);
    const newIndex = videos.findIndex((v) => getVideoId(v) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(videos, oldIndex, newIndex).map((v, i) => ({
      ...v,
      order: i + 1,
    }));

    setVideos(reordered);

    const arrangement = reordered.reduce<Record<string, string>>((acc, v) => {
      acc[String(v.order)] = getVideoId(v);
      return acc;
    }, {});

    setReordering(true);
    try {
      await ManageVideosService.arrange(arrangement);
    } catch (err) {
      Notification.error(
        getApiErrorMessage(err, "Could not save the new order."),
        "Reorder failed",
      );
    } finally {
      await loadVideos(activePage);
      setReordering(false);
    }
  };
  useEffect(() => {
    loadVideos(activePage);
  }, [activePage]);
  return (
    <Box>
      <Flex gap="xs" align="center" wrap="wrap" justify="space-between">
        <SegmentedControl
          size="xs"
          value={activePage}
          onChange={setActivePage}
          data={PAGE_OPTIONS}
        />

        <Group gap="xs">
          <Tooltip label="Refresh">
            <ActionIcon
              variant="light"
              onClick={() => loadVideos(activePage)}
              disabled={loading}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>

          <input
            ref={addFileInputRef}
            type="file"
            accept="video/*"
            multiple
            hidden
            onChange={handleFilesSelected}
          />
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            disabled={uploading}
            onClick={() => addFileInputRef.current?.click()}
          >
            Upload Videos
          </Button>
        </Group>
      </Flex>

      {pendingFiles.length > 0 && (
        <Box
          my="sm"
          p="sm"
          style={{
            border: "1px solid var(--mantine-color-gray-3)",
            borderRadius: 8,
          }}
        >
          <Group justify="space-between" mb="xs" align="flex-start">
            <Text size="sm" fw={600}>
              {pendingFiles.length} video
              {pendingFiles.length > 1 ? "s" : ""} ready to upload
            </Text>
            <Text size="xs" c="dimmed">
              Drag to reorder — the top video plays first
            </Text>
          </Group>

          <DndContext
            sensors={dragSensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePendingDragEnd}
          >
            <SortableContext
              items={pendingFiles.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack gap="xs">
                {pendingFiles.map((p, i) => (
                  <SortablePendingRow
                    key={p.id}
                    id={p.id}
                    index={i}
                    name={p.file.name}
                    disabled={uploading}
                    uploading={uploading}
                    progress={uploadProgress[p.id] ?? 0}
                    onRemove={() => removePending(p.id)}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>

          <Group justify="flex-end" mt="sm">
            <Button
              variant="subtle"
              size="xs"
              onClick={cancelPending}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button size="xs" loading={uploading} onClick={confirmUploadAll}>
              Upload {pendingFiles.length} video
              {pendingFiles.length > 1 ? "s" : ""}
            </Button>
          </Group>
        </Box>
      )}

      {/* hidden input reused for "Replace" across all rows */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={handleReplaceFileSelected}
      />

      <Box my="md">
        {loading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : videos.length === 0 ? (
          <Center py="xl">
            <Stack gap={4} align="center">
              <IconVideo
                size={28}
                stroke={1.5}
                color="var(--mantine-color-gray-5)"
              />
              <Text size="sm" c="dimmed">
                No videos yet for “
                {PAGE_OPTIONS.find((p) => p.value === activePage)?.label}”.
              </Text>
              <Text size="xs" c="dimmed">
                Upload one using the button above.
              </Text>
            </Stack>
          </Center>
        ) : (
          <>
            {activePage === "homepage-intro" && (
              <Text size="xs" c="dimmed" mb="xs">
                The highlighted video at the top is the one shown as the
                homepage intro — drag a row to the top to feature it.
              </Text>
            )}
            <DndContext
              sensors={dragSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleVideoDragEnd}
            >
              <SortableContext
                items={videos.map((v) => getVideoId(v))}
                strategy={verticalListSortingStrategy}
              >
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={80}>Sr No.</Table.Th>
                      <Table.Th>File</Table.Th>
                      <Table.Th>Title</Table.Th>
                      <Table.Th w={160}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {videos.map((video, index) => {
                      const id = getVideoId(video);
                      const isReplacing = replacingId === id;
                      const isFeatured =
                        activePage === "homepage-intro" && index === 0;

                      return (
                        <SortableVideoRow
                          key={id || video.file}
                          video={video}
                          srNo={index + 1}
                          disabled={reordering}
                          isReplacing={isReplacing}
                          isFeatured={isFeatured}
                          replaceProgress={replaceProgress}
                          onPreview={() => setPreviewVideo(video)}
                          onEdit={() => openEditModal(video)}
                          onReplace={() => startReplace(video)}
                          onDelete={() => setDeleteTarget(video)}
                        />
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </SortableContext>
            </DndContext>
          </>
        )}
      </Box>

      {/* Preview */}
      <Modal
        opened={previewVideo !== null}
        onClose={() => setPreviewVideo(null)}
        title={previewVideo?.file}
        centered
        size="lg"
      >
        {previewVideo?.s3_link && (
          <video
            src={previewVideo.s3_link}
            controls
            autoPlay
            style={{ width: "100%", borderRadius: 8, background: "#000" }}
          />
        )}
      </Modal>

      {/* Edit metadata */}
      <Modal
        opened={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit video details"
        centered
      >
        <Stack gap="sm">
          <TextInput
            label="Title"
            placeholder="Optional"
            value={editTitle}
            onChange={(e) => setEditTitle(e.currentTarget.value)}
          />
          <Textarea
            label="Description"
            placeholder="Optional"
            value={editDescription}
            onChange={(e) => setEditDescription(e.currentTarget.value)}
            minRows={2}
          />
          <Text size="xs" c="dimmed">
            Display order is set by dragging the video's row in the table.
          </Text>
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button loading={savingEdit} onClick={saveEdit}>
              Save changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete confirm */}
      <Modal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete video"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.file}</strong>? This removes the file from S3
            and can't be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button color="red" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

interface SortablePendingRowProps {
  id: string;
  index: number;
  name: string;
  disabled: boolean;
  uploading: boolean;
  progress: number;
  onRemove: () => void;
}

const SortablePendingRow = ({
  id,
  index,
  name,
  disabled,
  uploading,
  progress,
  onRemove,
}: SortablePendingRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Group ref={setNodeRef} style={style} gap="xs" wrap="nowrap">
      <ActionIcon
        variant="subtle"
        style={{ cursor: disabled ? "not-allowed" : "grab" }}
        disabled={disabled}
        aria-label={`Drag to reorder ${name}`}
        {...attributes}
        {...listeners}
      >
        <IconGripVertical size={14} />
      </ActionIcon>
      <Badge variant="light" size="sm" w={28}>
        {index + 1}
      </Badge>
      <Text size="sm" style={{ flex: 1, minWidth: 0 }} truncate>
        {name}
      </Text>
      {uploading ? (
        <Box w={110}>
          <Progress value={progress} size="sm" />
        </Box>
      ) : (
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
        >
          <IconX size={14} />
        </ActionIcon>
      )}
    </Group>
  );
};

interface SortableVideoRowProps {
  video: VideoRecord;
  srNo: number;
  disabled: boolean;
  isReplacing: boolean;
  isFeatured: boolean;
  replaceProgress: number;
  onPreview: () => void;
  onEdit: () => void;
  onReplace: () => void;
  onDelete: () => void;
}

const SortableVideoRow = ({
  video,
  srNo,
  disabled,
  isReplacing,
  isFeatured,
  replaceProgress,
  onPreview,
  onEdit,
  onReplace,
  onDelete,
}: SortableVideoRowProps) => {
  const id = getVideoId(video);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: isDragging
      ? "var(--mantine-color-gray-0)"
      : isFeatured
        ? "var(--mantine-color-green-0)"
        : undefined,
    boxShadow: isFeatured
      ? "inset 3px 0 0 var(--mantine-color-green-6)"
      : undefined,
  };

  return (
    <Table.Tr ref={setNodeRef} style={style}>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <ActionIcon
            variant="subtle"
            style={{ cursor: disabled ? "not-allowed" : "grab" }}
            disabled={disabled}
            aria-label={`Drag to reorder ${video.file}`}
            {...attributes}
            {...listeners}
          >
            <IconGripVertical size={14} />
          </ActionIcon>
          <Badge
            variant="light"
            size="sm"
            color={isFeatured ? "green" : undefined}
          >
            {srNo}
          </Badge>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <Text size="sm" fw={500} truncate maw={220}>
            {video.file}
          </Text>
          {isFeatured && (
            <Badge size="xs" color="green" variant="filled">
              Live
            </Badge>
          )}
        </Group>
        {video.description && (
          <Text size="xs" c="dimmed" truncate maw={260}>
            {video.description}
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Text size="sm" c={video.title ? undefined : "dimmed"}>
          {video.title || "—"}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <Tooltip label="Preview">
            <ActionIcon
              variant="subtle"
              disabled={!video.s3_link}
              onClick={onPreview}
            >
              <IconPlayerPlay size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Edit details">
            <ActionIcon variant="subtle" onClick={onEdit}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Replace file">
            <ActionIcon
              variant="subtle"
              loading={isReplacing}
              onClick={onReplace}
            >
              <IconUpload size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="subtle" color="red" onClick={onDelete}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        {isReplacing && replaceProgress > 0 && (
          <Progress value={replaceProgress} size="xs" mt={4} animated />
        )}
      </Table.Td>
    </Table.Tr>
  );
};

export default ManageVideos;
