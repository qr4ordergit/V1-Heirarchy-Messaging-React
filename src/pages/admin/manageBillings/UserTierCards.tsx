import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowLeftRight,
  IconArrowRight,
  IconCalendar,
  IconChevronRight,
  IconCurrencyDollar,
  IconEdit,
  IconExternalLink,
  IconMail,
  IconSearch,
  IconUser,
  IconUserCheck,
  IconUserX,
  IconUsers,
} from "@tabler/icons-react";
import { useTranslation } from "../../../store/language/language.store";
import type { AdminUserItem } from "../../../api/manageBillingApi";
import type { FilterTabType } from "./useManageBillingApi";

export const formatBytesToGb = (bytes: number): number => {
  return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
};

interface Props {
  // Shared
  statusUpdatingUserId: string | null;
  handleOpenUserOverview: (user: AdminUserItem) => void;
  handlePromptToggleStatus: (user: AdminUserItem) => void;

  // Default tier card
  loadingDefault: boolean;
  defaultTotal: number;
  defaultSearch: string;
  setDefaultSearch: (value: string) => void;
  defaultTab: FilterTabType;
  handleDefaultTabChange: (tab: FilterTabType) => void;
  filteredDefaultUsers: AdminUserItem[];
  defaultNextCursor: string | null;
  fetchDefaultTier: (
    tab?: FilterTabType,
    cursor?: string | null,
    isNext?: boolean,
  ) => Promise<void>;
  handleOpenEditDefault: () => void;
  handleOpenMoveToCustom: (userId: string) => void;

  // Custom tier card
  loadingCustom: boolean;
  customTotal: number;
  customSearch: string;
  setCustomSearch: (value: string) => void;
  customTab: FilterTabType;
  handleCustomTabChange: (tab: FilterTabType) => void;
  filteredCustomUsers: AdminUserItem[];
  customNextCursor: string | null;
  fetchCustomTier: (
    tab?: FilterTabType,
    cursor?: string | null,
    isNext?: boolean,
  ) => Promise<void>;
  handleOpenEditCustom: (user: AdminUserItem) => void;
  handleReturnToDefault: (userId: string) => void;
}

/** Side-by-side "Default pricing" and "Custom pricing" user lists */
export default function UserTierCards({
  statusUpdatingUserId,
  handleOpenUserOverview,
  handlePromptToggleStatus,
  loadingDefault,
  defaultTotal,
  defaultSearch,
  setDefaultSearch,
  defaultTab,
  handleDefaultTabChange,
  filteredDefaultUsers,
  defaultNextCursor,
  fetchDefaultTier,
  handleOpenEditDefault,
  handleOpenMoveToCustom,
  loadingCustom,
  customTotal,
  customSearch,
  setCustomSearch,
  customTab,
  handleCustomTabChange,
  filteredCustomUsers,
  customNextCursor,
  fetchCustomTier,
  handleOpenEditCustom,
  handleReturnToDefault,
}: Props) {
  const { translation } = useTranslation();

  // Reusable Pill Filter Tabs for Default & Custom cards
  const renderFilterTabs = (
    currentTab: FilterTabType,
    onChange: (t: FilterTabType) => void,
    activeColor: string,
  ) => (
    <Group gap={6} pt={2} wrap="wrap">
      <Button
        size="compact-xs"
        radius="xl"
        variant={currentTab === "all" ? "filled" : "default"}
        color={activeColor}
        leftSection={<IconUsers size={12} />}
        onClick={() => onChange("all")}
      >
        {translation("admin_billing.tabAllUsers", "All")}
      </Button>
      <Button
        size="compact-xs"
        radius="xl"
        variant={currentTab === "unsettled" ? "filled" : "default"}
        color="red"
        leftSection={<IconAlertCircle size={12} />}
        onClick={() => onChange("unsettled")}
      >
        {translation("admin_billing.tabUnsettledUsers", "Unsettled")}
      </Button>
      <Button
        size="compact-xs"
        radius="xl"
        variant={currentTab === "active" ? "filled" : "default"}
        color="teal"
        leftSection={<IconUserCheck size={12} />}
        onClick={() => onChange("active")}
      >
        {translation("admin_billing.tabActiveUsers", "Active")}
      </Button>
      <Button
        size="compact-xs"
        radius="xl"
        variant={currentTab === "deactive" ? "filled" : "default"}
        color="gray"
        leftSection={<IconUserX size={12} />}
        onClick={() => onChange("deactive")}
      >
        {translation("admin_billing.tabDeactiveUsers", "Deactivated")}
      </Button>
    </Group>
  );

  const renderUserInfo = (user: AdminUserItem) => {
    const isActive = user.status === "active";
    const isUpdating = statusUpdatingUserId === user.user_id;
    const hasUnpaid = Boolean(user.unpaid && user.unpaid.count > 0);

    return (
      <Group justify="space-between" align="center" wrap="nowrap" w="100%">
        <Group
          gap="xs"
          wrap="nowrap"
          align="center"
          style={{ minWidth: 0, cursor: "pointer" }}
          onClick={() => handleOpenUserOverview(user)}
        >
          <ThemeIcon
            size={30}
            radius="xl"
            variant="light"
            color={hasUnpaid ? "red" : !isActive ? "gray" : "indigo"}
          >
            <IconUser size={16} />
          </ThemeIcon>
          <div style={{ minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap" align="center">
              {user.username && (
                <Text
                  size="xs"
                  fw={700}
                  c={!isActive ? "dimmed" : "dark"}
                  truncate
                >
                  {user.username}
                </Text>
              )}
              <Text
                size="xs"
                fw={user.username ? 400 : 600}
                className="font-mono"
                c={!isActive ? "dimmed" : "gray.8"}
                truncate
              >
                {user.user_id}
              </Text>
              <Badge size="xs" variant="dot" color={isActive ? "teal" : "gray"}>
                {user.status}
              </Badge>

              {hasUnpaid && (
                <Badge
                  size="xs"
                  color="red"
                  variant="filled"
                  leftSection={<IconAlertCircle size={10} />}
                >
                  {user.unpaid?.count}{" "}
                  {translation("admin_billing.txtUnpaidDue", "Due")} ($
                  {user.unpaid?.amount_outstanding})
                </Badge>
              )}
            </Group>
            {user.email && (
              <Group gap={4} wrap="nowrap">
                <IconMail size={12} className="text-gray-400 shrink-0" />
                <Text size="xs" c="dimmed" truncate>
                  {user.email}
                </Text>
              </Group>
            )}
          </div>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Tooltip
            label={translation(
              "admin_billing.ttViewOverview",
              "View billing overview",
            )}
            withArrow
          >
            <ActionIcon
              size="sm"
              variant="subtle"
              color={hasUnpaid ? "red" : "indigo"}
              onClick={() => handleOpenUserOverview(user)}
            >
              <IconExternalLink size={15} />
            </ActionIcon>
          </Tooltip>

          <Tooltip
            label={
              isActive
                ? translation(
                    "admin_billing.ttDeactivateUser",
                    "Click to deactivate user",
                  )
                : translation(
                    "admin_billing.ttActivateUser",
                    "Click to activate user",
                  )
            }
            withArrow
            position="left"
          >
            <span
              style={{
                display: "inline-flex",
                cursor: isUpdating ? "not-allowed" : "pointer",
              }}
            >
              <Switch
                size="xs"
                color="teal"
                checked={isActive}
                disabled={isUpdating}
                onChange={() => handlePromptToggleStatus(user)}
                style={{ pointerEvents: isUpdating ? "none" : undefined }}
                styles={{
                  track: {
                    backgroundColor: !isActive
                      ? "var(--mantine-color-gray-5)"
                      : undefined,
                    borderColor: !isActive
                      ? "var(--mantine-color-gray-6)"
                      : undefined,
                  },
                }}
              />
            </span>
          </Tooltip>
        </Group>
      </Group>
    );
  };

  const renderEstimateBadges = (user: AdminUserItem) => {
    const est = user.billing_estimate || user.estimate;
    if (!est?.cost?.total) return null;

    return (
      <Group
        gap={6}
        wrap="wrap"
        style={{ cursor: "pointer" }}
        onClick={() => handleOpenUserOverview(user)}
      >
        <Badge
          size="xs"
          variant="light"
          color="indigo"
          leftSection={<IconCurrencyDollar size={11} />}
        >
          {translation("admin_billing.txtTotal", "Total")}: ${est.cost.total}
        </Badge>
        {est.days_accrued !== undefined && (
          <Badge
            size="xs"
            variant="outline"
            color="gray"
            leftSection={<IconCalendar size={11} />}
          >
            {est.days_accrued} {translation("admin_billing.txtDays", "days")}
          </Badge>
        )}
      </Group>
    );
  };

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      {/* DEFAULT PLAN USERS */}
      <Card
        withBorder
        radius="lg"
        p="md"
        bg="white"
        className="shadow-xs h-full relative"
      >
        <LoadingOverlay
          visible={loadingDefault}
          zIndex={5}
          loaderProps={{ color: "indigo", size: "sm" }}
        />
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs" align="center">
              <ThemeIcon size={28} radius="xl" color="indigo" variant="light">
                <IconUser size={16} />
              </ThemeIcon>

              <Text fw={700} size="sm">
                {translation(
                  "admin_billing.txtUserDefaultPricing",
                  "Users on Default Pricing",
                )}
              </Text>

              <Tooltip
                label={translation(
                  "admin_billing.btnEditPricing",
                  "Edit Default Rates",
                )}
                withArrow
                position="top"
              >
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="indigo"
                  radius="md"
                  onClick={handleOpenEditDefault}
                  aria-label="Edit Default Rates"
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Badge color="indigo" variant="light">
              {defaultTotal} {translation("admin_billing.txtUsers", "Users")}
            </Badge>
          </Group>

          <TextInput
            placeholder={translation(
              "admin_billing.phSearchUser",
              "Search by ID, username, email...",
            )}
            size="xs"
            leftSection={<IconSearch size={14} />}
            value={defaultSearch}
            onChange={(e) => setDefaultSearch(e.currentTarget.value)}
          />

          {renderFilterTabs(defaultTab, handleDefaultTabChange, "indigo")}

          <Divider />

          <ScrollArea.Autosize mah={540} offsetScrollbars>
            <Stack gap="xs">
              {filteredDefaultUsers.length > 0 ? (
                filteredDefaultUsers.map((u) => {
                  const hasUnpaid = Boolean(u.unpaid && u.unpaid.count > 0);
                  const isDeactive = u.status === "deactive";

                  return (
                    <Paper
                      key={u.user_id}
                      p="xs"
                      radius="md"
                      withBorder
                      style={{
                        borderColor: hasUnpaid
                          ? "var(--mantine-color-red-5)"
                          : isDeactive
                            ? "var(--mantine-color-gray-4)"
                            : undefined,
                        backgroundColor: hasUnpaid
                          ? "var(--mantine-color-red-0)"
                          : isDeactive
                            ? "var(--mantine-color-gray-1)"
                            : undefined,
                        borderWidth: hasUnpaid ? 1.5 : 1,
                        opacity: isDeactive && !hasUnpaid ? 0.75 : 1,
                      }}
                      bg={hasUnpaid || isDeactive ? undefined : "gray.0"}
                      className="flex flex-col gap-2 hover:shadow-xs transition-all"
                    >
                      {renderUserInfo(u)}

                      <Group justify="space-between" align="center" pt={2}>
                        {renderEstimateBadges(u)}

                        <Tooltip
                          label={translation(
                            "admin_billing.tooltipMoveToCustom",
                            "Set custom pricing and move to custom",
                          )}
                          withArrow
                        >
                          <Button
                            size="compact-xs"
                            variant="light"
                            color="indigo"
                            rightSection={<IconArrowRight size={12} />}
                            onClick={() => handleOpenMoveToCustom(u.user_id)}
                          >
                            {translation(
                              "admin_billing.btnMoveToCustom",
                              "Move to Custom",
                            )}
                          </Button>
                        </Tooltip>
                      </Group>
                    </Paper>
                  );
                })
              ) : (
                <Text size="xs" c="dimmed" ta="center" py="xl">
                  {defaultTab === "unsettled"
                    ? translation(
                        "admin_billing.txtNoUnsettledUsers",
                        "No unsettled users found.",
                      )
                    : defaultTab === "active"
                      ? translation(
                          "admin_billing.txtNoActiveUsers",
                          "No active users found.",
                        )
                      : defaultTab === "deactive"
                        ? translation(
                            "admin_billing.txtNoDeactiveUsers",
                            "No deactivated users found.",
                          )
                        : translation(
                            "admin_billing.txtNoUsersDefaultTier",
                            "No users found in default tier.",
                          )}
                </Text>
              )}
            </Stack>
          </ScrollArea.Autosize>

          {/* Cursor-based pagination */}
          {defaultNextCursor && (
            <Button
              size="xs"
              variant="subtle"
              color="indigo"
              loading={loadingDefault}
              rightSection={<IconChevronRight size={14} />}
              onClick={() =>
                fetchDefaultTier(defaultTab, defaultNextCursor, true)
              }
            >
              {translation("admin_billing.btnLoadMore", "Load More Users")}
            </Button>
          )}
        </Stack>
      </Card>

      {/* CUSTOM PLAN USERS */}
      <Card
        withBorder
        radius="lg"
        p="md"
        bg="white"
        className="shadow-xs h-full relative"
      >
        <LoadingOverlay
          visible={loadingCustom}
          zIndex={5}
          loaderProps={{ color: "cyan", size: "sm" }}
        />
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon size={28} radius="xl" color="cyan" variant="light">
                <IconArrowLeftRight size={16} />
              </ThemeIcon>
              <Text fw={700} size="sm">
                {translation(
                  "admin_billing.txtUserCustomPricing",
                  "Users on Custom Pricing",
                )}
              </Text>
            </Group>
            <Badge color="cyan" variant="light">
              {customTotal} {translation("admin_billing.txtUsers", "Users")}
            </Badge>
          </Group>

          <TextInput
            placeholder={translation(
              "admin_billing.phSearchUser",
              "Search by ID, username, email...",
            )}
            size="xs"
            leftSection={<IconSearch size={14} />}
            value={customSearch}
            onChange={(e) => setCustomSearch(e.currentTarget.value)}
          />

          {renderFilterTabs(customTab, handleCustomTabChange, "cyan")}

          <Divider />

          <ScrollArea.Autosize mah={540} offsetScrollbars>
            <Stack gap="xs">
              {filteredCustomUsers.length > 0 ? (
                filteredCustomUsers.map((u) => {
                  const hasUnpaid = Boolean(u.unpaid && u.unpaid.count > 0);
                  const isDeactive = u.status === "deactive";

                  return (
                    <Paper
                      key={u.user_id}
                      p="xs"
                      radius="md"
                      withBorder
                      style={{
                        borderColor: hasUnpaid
                          ? "var(--mantine-color-red-5)"
                          : isDeactive
                            ? "var(--mantine-color-gray-4)"
                            : undefined,
                        backgroundColor: hasUnpaid
                          ? "var(--mantine-color-red-0)"
                          : isDeactive
                            ? "var(--mantine-color-gray-1)"
                            : undefined,
                        borderWidth: hasUnpaid ? 1.5 : 1,
                        opacity: isDeactive && !hasUnpaid ? 0.75 : 1,
                      }}
                      bg={hasUnpaid || isDeactive ? undefined : "cyan.0"}
                      className="flex flex-col gap-2 hover:shadow-xs transition-all"
                    >
                      {renderUserInfo(u)}

                      {u.pricing?.chat_accounts && (
                        <Group gap={6}>
                          <Badge size="xs" variant="outline" color="cyan">
                            {translation(
                              "admin_billing.txtAccounts",
                              "Accounts",
                            )}
                            : {u.pricing.chat_accounts.free_quantity}{" "}
                            {translation("admin_billing.txtFree", "free")} ($
                            {u.pricing.chat_accounts.price_per_unit}/unit)
                          </Badge>
                          {u.pricing.storage && (
                            <Badge size="xs" variant="outline" color="teal">
                              {translation(
                                "admin_billing.txtStorage",
                                "Storage",
                              )}
                              : {formatBytesToGb(u.pricing.storage.free_bytes)}{" "}
                              GB {translation("admin_billing.txtFree", "free")}{" "}
                              ($
                              {u.pricing.storage.price_per_gb}/GB)
                            </Badge>
                          )}
                        </Group>
                      )}

                      <Group justify="space-between" align="center" pt={2}>
                        {renderEstimateBadges(u)}

                        <Group gap="xs">
                          <Tooltip
                            label={translation(
                              "admin_billing.tooltipEditCustomPricing",
                              "Edit user's custom pricing rates",
                            )}
                            withArrow
                          >
                            <Button
                              size="compact-xs"
                              variant="light"
                              color="cyan"
                              leftSection={<IconEdit size={12} />}
                              onClick={() => handleOpenEditCustom(u)}
                            >
                              {translation(
                                "admin_billing.btnEditRates",
                                "Edit Rates",
                              )}
                            </Button>
                          </Tooltip>

                          <Tooltip
                            label={translation(
                              "admin_billing.tooltipRevertToDefault",
                              "Revert to standard default plan rates",
                            )}
                            withArrow
                          >
                            <Button
                              size="compact-xs"
                              variant="white"
                              color="dark"
                              leftSection={<IconArrowLeft size={12} />}
                              onClick={() => handleReturnToDefault(u.user_id)}
                            >
                              {translation(
                                "admin_billing.btnReturnToDefault",
                                "Return to Default",
                              )}
                            </Button>
                          </Tooltip>
                        </Group>
                      </Group>
                    </Paper>
                  );
                })
              ) : (
                <Text size="xs" c="dimmed" ta="center" py="xl">
                  {customTab === "unsettled"
                    ? translation(
                        "admin_billing.txtNoUnsettledUsers",
                        "No unsettled users found.",
                      )
                    : customTab === "active"
                      ? translation(
                          "admin_billing.txtNoActiveUsers",
                          "No active users found.",
                        )
                      : customTab === "deactive"
                        ? translation(
                            "admin_billing.txtNoDeactiveUsers",
                            "No deactivated users found.",
                          )
                        : translation(
                            "admin_billing.txtNoCustomPricingUsers",
                            "No custom pricing users found.",
                          )}
                </Text>
              )}
            </Stack>
          </ScrollArea.Autosize>

          {/* Cursor-based pagination */}
          {customNextCursor && (
            <Button
              size="xs"
              variant="subtle"
              color="cyan"
              loading={loadingCustom}
              rightSection={<IconChevronRight size={14} />}
              onClick={() => fetchCustomTier(customTab, customNextCursor, true)}
            >
              {translation("admin_billing.btnLoadMore", "Load More Users")}
            </Button>
          )}
        </Stack>
      </Card>
    </SimpleGrid>
  );
}
