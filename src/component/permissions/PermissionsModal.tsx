import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
} from "@mantine/core";
import {
  fetchPermissions,
  updatePermissions,
  type PermissionsTree,
} from "../../api/permissionsApi";
import PermissionsEditor from "../permissions/PermissionsEditor";

interface PermissionsModalProps {
  opened: boolean;
  userId: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PermissionsModal({
  opened,
  userId,
  onClose,
  onSaved,
}: PermissionsModalProps) {
  const [tree, setTree] = useState<PermissionsTree | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setTree(null);
      try {
        const result = await fetchPermissions(userId);
        if (!cancelled) setTree(result.permissions);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load permissions.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [opened, userId]);

  const togglePermission = (path: string[]) => {
    setTree((prev) => {
      if (!prev) return prev;

      const next: PermissionsTree = structuredClone(prev);
      let cursor: PermissionsTree = next;

      for (let i = 0; i < path.length - 1; i++) {
        cursor = cursor[path[i]] as PermissionsTree;
      }

      const lastKey = path[path.length - 1];
      cursor[lastKey] = !(cursor[lastKey] as boolean);

      return next;
    });
  };

  const handleSave = async () => {
    if (!userId || !tree) return;

    setSaving(true);
    setError(null);
    try {
      await updatePermissions(userId, tree);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save permissions.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Update Permissions ~ ${userId}`}
      centered
      radius="md"
      size="lg"
    >
      <Stack gap="md">
        {error && (
          <Alert color="red" title="Something went wrong">
            {error}
          </Alert>
        )}

        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : tree ? (
          <>
            <PermissionsEditor tree={tree} onToggle={togglePermission} />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={onClose}>
                Cancel
              </Button>
              <Button
                radius="xl"
                variant="gradient"
                loading={saving}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </Group>
          </>
        ) : null}
      </Stack>
    </Modal>
  );
}
