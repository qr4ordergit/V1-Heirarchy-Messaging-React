import { useEffect, useState } from "react";
import {
  Alert,
  Group,
  Loader,
  Modal,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import {
  fetchAccounts,
  fetchSubUserAccessDetail,
  updateUserAccess,
  type Account,
} from "../../api/accountApi";

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
  const [siblingAccounts, setSiblingAccounts] = useState<Account[]>([]);
  const [addedSubUserIds, setAddedSubUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const handleToggle = async (subUserId: string, shouldAdd: boolean) => {
    if (!targetUser) return;

    setTogglingUserId(subUserId);
    setError(null);
    try {
      await updateUserAccess(targetUser.user_id, shouldAdd ? "add" : "remove", [
        subUserId,
      ]);

      setAddedSubUserIds((prev) => {
        const next = new Set(prev);
        if (shouldAdd) next.add(subUserId);
        else next.delete(subUserId);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update access.");
    } finally {
      setTogglingUserId(null);
    }
  };
  useEffect(() => {
    if (!opened || !targetUser) {
      setSiblingAccounts([]);
      setAddedSubUserIds(new Set());
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [allAccounts, detail] = await Promise.all([
          fetchAccounts(),
          fetchSubUserAccessDetail(targetUser.user_id),
        ]);

        if (cancelled) return;

        setSiblingAccounts(
          allAccounts.filter((a) => a.user_id !== targetUser.user_id),
        );

        setAddedSubUserIds(
          new Set(detail.sub_users.map((subUser) => subUser?.user_id)),
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load sub-accounts.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [opened, targetUser]);
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Manage Sub Users"
      centered
      radius="md"
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
              const isToggling = togglingUserId === account.user_id;

              return (
                <Group
                  key={account.user_id}
                  justify="space-between"
                  wrap="nowrap"
                >
                  <Text size="sm">{getDisplayName(account)}</Text>
                  {isToggling ? (
                    <Loader size={16} />
                  ) : (
                    <Switch
                      checked={isAdded}
                      onChange={(e) =>
                        handleToggle(account.user_id, e.currentTarget.checked)
                      }
                    />
                  )}
                </Group>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
