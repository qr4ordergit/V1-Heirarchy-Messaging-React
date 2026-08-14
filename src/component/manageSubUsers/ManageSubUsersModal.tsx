import { useEffect, useMemo, useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import {
  fetchSubUserAccessDetail,
  updateUserAccess,
  type Account,
} from "../../api/accountApi";
import { useAccountsStore } from "../../store/accounts/accounts.store";

interface ManageSubUsersModalProps {
  opened: boolean;
  targetUser: Account | null;
  onClose: () => void;
}

const getDisplayName = (account: Account) =>
  account.display_name?.trim() ||
  account.email?.split("@")[0] ||
  account.user_id;

export default function ManageSubUsersModal({
  opened,
  targetUser,
  onClose,
}: ManageSubUsersModalProps) {
  const accounts = useAccountsStore((s) => s.accounts);
  const accountsLoading = useAccountsStore((s) => s.loading);
  const loadAccountsCached = useAccountsStore((s) => s.fetchAccounts);

  const [addedSubUserIds, setAddedSubUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [initialSubUserIds, setInitialSubUserIds] = useState<Set<string>>(
    new Set(),
  );

  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const siblingAccounts = useMemo(
    () =>
      targetUser
        ? accounts.filter((a) => a.user_id !== targetUser.user_id)
        : [],
    [accounts, targetUser],
  );

  const isDirty = useMemo(() => {
    if (addedSubUserIds.size !== initialSubUserIds.size) return true;
    for (const id of addedSubUserIds) {
      if (!initialSubUserIds.has(id)) return true;
    }
    return false;
  }, [addedSubUserIds, initialSubUserIds]);

  const handleToggle = (subUserId: string, shouldAdd: boolean) => {
    setAddedSubUserIds((prev) => {
      const next = new Set(prev);
      if (shouldAdd) next.add(subUserId);
      else next.delete(subUserId);
      return next;
    });
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSave = async () => {
    if (!targetUser) return;

    setSaving(true);
    setError(null);
    try {
      await updateUserAccess(targetUser.user_id, Array.from(addedSubUserIds));
      setInitialSubUserIds(new Set(addedSubUserIds));
      notifications.show({
        color: "teal",
        title: "Access updated",
        message: "Sub-user access was saved successfully.",
      });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update access.";
      setError(message);
      notifications.show({
        color: "red",
        title: "Couldn't update access",
        message,
      });
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    if (!opened || !targetUser) {
      setAddedSubUserIds(new Set());
      setInitialSubUserIds(new Set());
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setDetailLoading(true);
      setError(null);
      try {
        const [, detail] = await Promise.all([
          loadAccountsCached(),
          fetchSubUserAccessDetail(targetUser.user_id),
        ]);

        if (cancelled) return;

        const ids = new Set(
          detail.sub_users.map((subUser) => subUser?.user_id),
        );
        setAddedSubUserIds(ids);
        setInitialSubUserIds(ids);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load sub-accounts.",
          );
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [opened, targetUser, loadAccountsCached]);
  const loading = detailLoading || (accountsLoading && accounts.length === 0);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Manage Sub Users"
      centered
      radius="md"
      closeOnClickOutside={!saving}
      closeOnEscape={!saving}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Choose which accounts{" "}
          <strong>{targetUser ? getDisplayName(targetUser) : ""}</strong> can
          access.
        </Text>

        {error && (
          <Alert color="red" title="Couldn't update sub-accounts">
            {error}
          </Alert>
        )}

        {loading ? (
          <Group justify="center" py="md">
            <Loader size="sm" />
          </Group>
        ) : siblingAccounts.length === 0 ? (
          <Text size="sm" c="dimmed">
            No other accounts available to grant access to.
          </Text>
        ) : (
          <Stack gap={6}>
            {siblingAccounts.map((account) => {
              const isAdded = addedSubUserIds.has(account.user_id);

              return (
                <Group
                  key={account.user_id}
                  justify="space-between"
                  wrap="nowrap"
                >
                  <Text size="sm">{getDisplayName(account)}</Text>
                  <Switch
                    checked={isAdded}
                    disabled={saving}
                    onChange={(e) =>
                      handleToggle(account.user_id, e.currentTarget.checked)
                    }
                  />
                </Group>
              );
            })}
          </Stack>
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            radius="xl"
            variant="gradient"
            loading={saving}
            disabled={loading || !isDirty}
            onClick={handleSave}
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
