import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowLeftRight,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconChevronRight,
  IconCurrencyDollar,
  IconDatabase,
  IconEdit,
  IconExternalLink,
  IconMail,
  IconMessages,
  IconSearch,
  IconUser,
  IconUserCheck,
  IconUserX,
  IconUsers,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "../../../store/language/language.store";
import {
  type AdminUserItem,
  type OverviewQueryParams,
  type PricingRule,
  type UpdatePricingPayload,
  getAdminOverviewDataApi,
  patchPricingTierRatesApi,
  reassignUserTierApi,
  toggleUserStatusApi,
} from "../../../api/manageBillingApi";
import {
  getUserBillingOverviewApi,
  type UserBillingOverviewDetails,
} from "../../../api/manageBillingApi";

const formatBytesToGb = (bytes: number): number => {
  return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
};

const gbToBytes = (gb: number): number => {
  return Math.round(gb * 1024 * 1024 * 1024);
};

const formatBytesLocalized = (
  bytes: number = 0,
  lang: string = "en",
): string => {
  if (!bytes || bytes <= 0) return lang === "uk" ? "0 МБ" : "0 MB";
  const k = 1024;
  const sizesEn = ["Bytes", "KB", "MB", "GB", "TB"];
  const sizesUk = ["Байт", "КБ", "МБ", "ГБ", "ТБ"];
  const sizes = lang === "uk" ? sizesUk : sizesEn;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const parseCost = (val: string | number | undefined | null): number => {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

type FilterTabType = "all" | "unsettled" | "active" | "deactive";

export default function ManageBillings() {
  const { translation, currentLang } = useTranslation();

  const [initialLoading, setInitialLoading] = useState(true);
  const [period, setPeriod] = useState<string>("");
  const [defaultPricing, setDefaultPricing] = useState<PricingRule | null>(
    null,
  );

  // Independent Column Loading States
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // Independent Tab Filter States
  const [defaultTab, setDefaultTab] = useState<FilterTabType>("all");
  const [customTab, setCustomTab] = useState<FilterTabType>("all");

  // User Items & Pagination Cursor States
  const [defaultUsers, setDefaultUsers] = useState<AdminUserItem[]>([]);
  const [defaultNextCursor, setDefaultNextCursor] = useState<string | null>(
    null,
  );
  const [defaultTotal, setDefaultTotal] = useState<number>(0);

  const [customUsers, setCustomUsers] = useState<AdminUserItem[]>([]);
  const [customNextCursor, setCustomNextCursor] = useState<string | null>(null);
  const [customTotal, setCustomTotal] = useState<number>(0);

  // Local Search States
  const [defaultSearch, setDefaultSearch] = useState("");
  const [customSearch, setCustomSearch] = useState("");

  // Rate Editing Modal States
  const [rateModalOpened, setRateModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState<
    "edit_default" | "edit_custom" | "move_to_custom"
  >("edit_default");
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [activeTierVersion, setActiveTierVersion] = useState<number>(1);
  const [editFreeAccounts, setEditFreeAccounts] = useState<number>(0);
  const [editAccountPrice, setEditAccountPrice] = useState<number>(0);
  const [editFreeGb, setEditFreeGb] = useState<number>(0);
  const [editStoragePrice, setEditStoragePrice] = useState<number>(0);
  const [changeReason, setChangeReason] = useState<string>("");
  const [changeReasonError, setChangeReasonError] = useState<string | null>(
    null,
  );
  const [submittingRate, setSubmittingRate] = useState(false);

  const [statusUpdatingUserId, setStatusUpdatingUserId] = useState<
    string | null
  >(null);
  const [confirmModalOpened, setConfirmModalOpened] = useState(false);
  const [targetStatusUser, setTargetStatusUser] =
    useState<AdminUserItem | null>(null);
  const [statusConfirmText, setStatusConfirmText] = useState("");

  // User Billing Overview Popup States
  const [overviewModalOpened, setOverviewModalOpened] = useState(false);
  const [selectedOverviewUser, setSelectedOverviewUser] =
    useState<AdminUserItem | null>(null);
  const [overviewSelectedPeriod, setOverviewSelectedPeriod] =
    useState<string>("");
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [userEstimateData, setUserEstimateData] = useState<
    UserBillingOverviewDetails["estimate"] | null
  >(null);
  const [userInvoiceGenerated, setUserInvoiceGenerated] =
    useState<boolean>(false);

  // Helper to map tab selection to query params
  const buildQueryParams = (
    tierType: "default" | "custom",
    activeTab: FilterTabType,
    cursor?: string | null,
  ): OverviewQueryParams => {
    const params: OverviewQueryParams = {
      limit: 10,
      type: tierType,
    };

    if (cursor) {
      params.cursor = cursor;
    }

    if (activeTab === "unsettled") {
      params.dues = "unpaid";
    } else if (activeTab === "active") {
      params.status = "active";
    } else if (activeTab === "deactive") {
      params.status = "deactive";
    }

    return params;
  };

  // Fetch Default Tier Users
  const fetchDefaultTier = async (
    tab: FilterTabType = defaultTab,
    cursor: string | null = null,
    isNext = false,
  ) => {
    setLoadingDefault(true);
    const params = buildQueryParams("default", tab, cursor);
    const details = await getAdminOverviewDataApi(params);

    if (details) {
      if (details.period) setPeriod(details.period);
      if (details.default_pricing) setDefaultPricing(details.default_pricing);

      const items = details.users?.items || [];
      setDefaultUsers((prev) => (isNext ? [...prev, ...items] : items));
      setDefaultNextCursor(details.users?.next_cursor ?? null);
      setDefaultTotal(details.users?.total ?? 0);
    }
    setLoadingDefault(false);
  };

  const fetchCustomTier = async (
    tab: FilterTabType = customTab,
    cursor: string | null = null,
    isNext = false,
  ) => {
    setLoadingCustom(true);
    const params = buildQueryParams("custom", tab, cursor);
    const details = await getAdminOverviewDataApi(params);

    if (details) {
      const items = details.users?.items || [];
      setCustomUsers((prev) => (isNext ? [...prev, ...items] : items));
      setCustomNextCursor(details.users?.next_cursor ?? null);
      setCustomTotal(details.users?.total ?? 0);
    }
    setLoadingCustom(false);
  };

  // Initial Dual Fetch
  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      await Promise.all([fetchDefaultTier("all"), fetchCustomTier("all")]);
      setInitialLoading(false);
    };
    init();
  }, []);

  // Tab switch handlers
  const handleDefaultTabChange = (newTab: FilterTabType) => {
    if (newTab === defaultTab) return;
    setDefaultTab(newTab);
    fetchDefaultTier(newTab, null, false);
  };

  const handleCustomTabChange = (newTab: FilterTabType) => {
    if (newTab === customTab) return;
    setCustomTab(newTab);
    fetchCustomTier(newTab, null, false);
  };

  // Modal overview loader
  const loadUserOverview = async (userId: string, targetPeriod?: string) => {
    if (!userId) return;
    setOverviewLoading(true);

    try {
      const details = await getUserBillingOverviewApi(userId, targetPeriod);

      if (details) {
        setUserEstimateData(details.estimate ?? null);
        setUserInvoiceGenerated(Boolean(details.invoice_generated));

        if (details.period) {
          setOverviewSelectedPeriod(details.period);
        }
        if (Array.isArray(details.available_periods)) {
          setAvailablePeriods(details.available_periods);
        }
      } else {
        setUserEstimateData(null);
      }
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleOpenUserOverview = (user: AdminUserItem) => {
    setSelectedOverviewUser(user);
    setUserEstimateData(null);
    setOverviewSelectedPeriod("");
    setAvailablePeriods([]);
    setOverviewModalOpened(true);
    loadUserOverview(user.user_id);
  };

  const handleOverviewPeriodChange = (newPeriod: string | null) => {
    if (
      !newPeriod ||
      newPeriod === overviewSelectedPeriod ||
      !selectedOverviewUser
    )
      return;
    setOverviewSelectedPeriod(newPeriod);
    loadUserOverview(selectedOverviewUser.user_id, newPeriod);
  };

  const periodSelectOptions = useMemo(() => {
    const locale = currentLang === "uk" ? "uk-UA" : "en-US";

    return availablePeriods.map((p) => {
      const [year, month] = p.split("-").map(Number);
      let label = p;

      if (year && month) {
        const d = new Date(year, month - 1, 1);
        label = d.toLocaleString(locale, {
          month: "long",
          year: "numeric",
        });
      }

      return { value: p, label };
    });
  }, [availablePeriods, currentLang]);

  const filteredDefaultUsers = useMemo(() => {
    if (!defaultSearch.trim()) return defaultUsers;
    const q = defaultSearch.toLowerCase();
    return defaultUsers.filter(
      (u) =>
        u.user_id.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)),
    );
  }, [defaultUsers, defaultSearch]);

  const filteredCustomUsers = useMemo(() => {
    if (!customSearch.trim()) return customUsers;
    const q = customSearch.toLowerCase();
    return customUsers.filter(
      (c) =>
        c.user_id.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.username && c.username.toLowerCase().includes(q)),
    );
  }, [customUsers, customSearch]);

  const handleOpenEditDefault = () => {
    if (!defaultPricing) return;
    setModalMode("edit_default");
    setTargetUserId(null);
    setActiveTierVersion(defaultPricing.version);

    setEditFreeAccounts(defaultPricing.chat_accounts.free_quantity);
    setEditAccountPrice(Number(defaultPricing.chat_accounts.price_per_unit));
    setEditFreeGb(formatBytesToGb(defaultPricing.storage.free_bytes));
    setEditStoragePrice(Number(defaultPricing.storage.price_per_gb));
    setChangeReason("");
    setChangeReasonError(null);
    setRateModalOpened(true);
  };

  const handleOpenEditCustom = (customItem: AdminUserItem) => {
    setModalMode("edit_custom");
    setTargetUserId(customItem.user_id);
    setActiveTierVersion(customItem.pricing.version || 1);

    const customAccounts =
      customItem.pricing.chat_accounts || defaultPricing?.chat_accounts;
    const customStorage = customItem.pricing.storage || defaultPricing?.storage;

    setEditFreeAccounts(customAccounts?.free_quantity ?? 4);
    setEditAccountPrice(Number(customAccounts?.price_per_unit ?? 0.03));
    setEditFreeGb(
      customStorage ? formatBytesToGb(customStorage.free_bytes) : 5,
    );
    setEditStoragePrice(Number(customStorage?.price_per_gb ?? 0.025));
    setChangeReason("");
    setChangeReasonError(null);
    setRateModalOpened(true);
  };

  const handleOpenMoveToCustom = (userId: string) => {
    setModalMode("move_to_custom");
    setTargetUserId(userId);
    setActiveTierVersion(defaultPricing?.version ?? 1);

    setEditFreeAccounts(defaultPricing?.chat_accounts.free_quantity ?? 4);
    setEditAccountPrice(
      Number(defaultPricing?.chat_accounts.price_per_unit ?? 0.03),
    );
    setEditFreeGb(
      defaultPricing ? formatBytesToGb(defaultPricing.storage.free_bytes) : 5,
    );
    setEditStoragePrice(Number(defaultPricing?.storage.price_per_gb ?? 0.025));
    setChangeReason("");
    setChangeReasonError(null);
    setRateModalOpened(true);
  };

  const handleSaveRates = async () => {
    if (!changeReason.trim()) {
      setChangeReasonError(
        translation(
          "admin_billing.errorChangeReasonRequired",
          "Please provide a reason for this rate change.",
        ),
      );
      return;
    }

    setSubmittingRate(true);
    const currencyCode = (defaultPricing?.currency || "USD")
      .slice(0, 3)
      .toUpperCase();

    const commonRates = {
      currency: currencyCode,
      change_reason: changeReason.trim(),
      expected_version: activeTierVersion,
      chat_accounts: {
        free_quantity: Math.round(Number(editFreeAccounts) || 0),
        price_per_unit: String(editAccountPrice ?? 0),
      },
      storage: {
        free_bytes: Math.round(gbToBytes(Number(editFreeGb) || 0)),
        price_per_gb: String(editStoragePrice ?? 0),
      },
    };

    let payload: UpdatePricingPayload;
    if (modalMode === "edit_default") {
      payload = { pricing_type: "default", ...commonRates };
    } else {
      if (!targetUserId) {
        setSubmittingRate(false);
        return;
      }
      payload = {
        pricing_type: "custom",
        user_id: targetUserId,
        ...commonRates,
      };
    }

    const success = await patchPricingTierRatesApi(payload);
    if (success) {
      notifications.show({
        title: "",
        message:
          modalMode === "move_to_custom"
            ? translation(
                "admin_billing.notiUserMovedSuccess",
                "User moved to custom pricing tier successfully.",
              )
            : translation(
                "admin_billing.notiPricingUpdated",
                "Tier pricing configuration updated successfully.",
              ),
        color: "green",
        icon: <IconCheck size={16} />,
      });
      setRateModalOpened(false);
      await Promise.all([
        fetchDefaultTier(defaultTab, null, false),
        fetchCustomTier(customTab, null, false),
      ]);
    }
    setSubmittingRate(false);
  };

  const handleReturnToDefault = async (userId: string) => {
    const success = await reassignUserTierApi({
      user_id: userId,
      target_tier: "default",
    });

    if (success) {
      notifications.show({
        title: "",
        message: translation(
          "admin_billing.notiUserReturnedDefault",
          "User reassigned to standard default pricing.",
        ),
        color: "green",
        icon: <IconCheck size={16} />,
      });
      await Promise.all([
        fetchDefaultTier(defaultTab, null, false),
        fetchCustomTier(customTab, null, false),
      ]);
    }
  };

  const handlePromptToggleStatus = (user: AdminUserItem) => {
    setTargetStatusUser(user);
    setStatusConfirmText("");
    setConfirmModalOpened(true);
  };

  const expectedActionWord =
    targetStatusUser?.status === "active" ? "deactivate" : "activate";

  const handleConfirmStatusChange = async () => {
    if (!targetStatusUser) return;
    if (statusConfirmText.trim().toLowerCase() !== expectedActionWord) return;

    const userToUpdate = targetStatusUser;
    setConfirmModalOpened(false);
    setTargetStatusUser(null);
    setStatusConfirmText("");

    await handleToggleUserStatus(userToUpdate);
  };

  const handleToggleUserStatus = async (user: AdminUserItem) => {
    const isCurrentlyActive = user.status === "active";
    const previousStatus = user.status;
    const nextStatus: "active" | "deactive" = isCurrentlyActive
      ? "deactive"
      : "active";

    const updateStatusInList = (list: AdminUserItem[]) =>
      list.map((u) =>
        u.user_id === user.user_id ? { ...u, status: nextStatus } : u,
      );

    setDefaultUsers((prev) => updateStatusInList(prev));
    setCustomUsers((prev) => updateStatusInList(prev));

    setStatusUpdatingUserId(user.user_id);
    const success = await toggleUserStatusApi(user.user_id, nextStatus);
    setStatusUpdatingUserId(null);

    if (success) {
      notifications.show({
        title: "",
        message:
          nextStatus === "active"
            ? translation(
                "admin_billing.notiUserActivated",
                "User account has been activated successfully.",
              )
            : translation(
                "admin_billing.notiUserDeactivated",
                "User account has been deactivated successfully.",
              ),
        color: nextStatus === "active" ? "teal" : "red",
        icon: <IconCheck size={16} />,
      });
    } else {
      const revertStatusInList = (list: AdminUserItem[]) =>
        list.map((u) =>
          u.user_id === user.user_id ? { ...u, status: previousStatus } : u,
        );

      setDefaultUsers((prev) => revertStatusInList(prev));
      setCustomUsers((prev) => revertStatusInList(prev));
    }
  };

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

  // Metrics extraction for User Overview Modal
  const latestChat = userEstimateData?.latest_day?.chat_accounts;
  const latestStorage = userEstimateData?.latest_day?.storage;
  const billingUnit = userEstimateData?.latest_day?.pricing?.billing_unit;
  const rateSuffix = billingUnit === "per_day" ? "/d" : "/acct";

  const modalChatUsage = latestChat?.usage ?? 0;
  const modalChatFree = latestChat?.free_units ?? 4;
  const modalChatBillable =
    latestChat?.billable_units ?? Math.max(0, modalChatUsage - modalChatFree);
  const modalChatRate = parseCost(latestChat?.unit_price ?? "0.03");

  const modalStorageUsageBytes = latestStorage?.usage_bytes ?? 0;
  const modalStorageFreeBytes = latestStorage?.free_bytes ?? 5368709120;
  const modalStorageRate = parseCost(latestStorage?.unit_price ?? "0.025");

  const modalChatCost = parseCost(userEstimateData?.cost?.chat_accounts);
  const modalStorageCost = parseCost(userEstimateData?.cost?.storage);
  const modalTotalCost = parseCost(userEstimateData?.cost?.total);

  return (
    <div className="w-full relative" style={{ minHeight: 400 }}>
      <LoadingOverlay
        visible={initialLoading}
        zIndex={10}
        overlayProps={{ radius: "sm", blur: 1 }}
        loaderProps={{ color: "indigo", type: "dots" }}
      />

      <Group justify="space-between" align="flex-end" mb="xl">
        <Stack gap={4}>
          <Title order={3} style={{ letterSpacing: "-0.5px" }}>
            {translation(
              "admin_billing.titlePage",
              "Manage Pricing & Billing Tiers",
            )}
          </Title>
          <Text size="sm" c="dimmed">
            {translation(
              "admin_billing.subtitlePage",
              "Configure default allowances, customize tier pricing rules, and manage user assignments and status.",
            )}
          </Text>
        </Stack>

        {period && (
          <Badge size="md" variant="light" color="indigo" radius="sm">
            {translation("admin_billing.lblBillingPeriod", "Period")}: {period}
          </Badge>
        )}
      </Group>

      <Stack gap="xl">
        {defaultPricing && (
          <Card withBorder radius="lg" p="lg" bg="white" className="shadow-xs">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group gap="xs" mb={4}>
                    <Title order={4}>Standard Default Plan</Title>
                    <Badge color="indigo" variant="light" radius="sm">
                      {translation(
                        "admin_billing.badgeDefaultTier",
                        "Global Default",
                      )}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {translation("admin_billing.txtVersion", "Version")}{" "}
                    {defaultPricing.version} •{" "}
                    {translation("admin_billing.txtCurrency", "Currency")}:{" "}
                    {defaultPricing.currency}
                  </Text>
                </div>

                <Button
                  size="xs"
                  variant="light"
                  color="indigo"
                  leftSection={<IconEdit size={14} />}
                  onClick={handleOpenEditDefault}
                >
                  {translation(
                    "admin_billing.btnEditPricing",
                    "Edit Default Rates",
                  )}
                </Button>
              </Group>

              <Divider />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <Paper p="sm" radius="md" bg="gray.0" withBorder>
                  <Group gap="xs" mb={4}>
                    <ThemeIcon
                      size={24}
                      radius="xl"
                      color="indigo"
                      variant="light"
                    >
                      <IconMessages size={14} />
                    </ThemeIcon>
                    <Text size="xs" fw={700}>
                      {translation(
                        "admin_billing.txtChatAccounts",
                        "Chat Accounts",
                      )}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {translation(
                      "admin_billing.txtFreeQuantity",
                      "Free Quantity",
                    )}
                    :{" "}
                    <b className="text-gray-900">
                      {defaultPricing.chat_accounts.free_quantity}{" "}
                      {translation("admin_billing.txtAccounts", "accounts")}
                    </b>
                  </Text>
                  <Text size="xs" c="dimmed">
                    {translation(
                      "admin_billing.txtRatePerExtraUnit",
                      "Rate per extra unit",
                    )}
                    :{" "}
                    <b className="text-gray-900">
                      ${defaultPricing.chat_accounts.price_per_unit} /
                      {translation("admin_billing.txtPerDay", "day")}
                    </b>
                  </Text>
                </Paper>

                <Paper p="sm" radius="md" bg="gray.0" withBorder>
                  <Group gap="xs" mb={4}>
                    <ThemeIcon
                      size={24}
                      radius="xl"
                      color="teal"
                      variant="light"
                    >
                      <IconDatabase size={14} />
                    </ThemeIcon>
                    <Text size="xs" fw={700}>
                      {translation(
                        "admin_billing.txtStorageAllowance",
                        "Storage Allowance",
                      )}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {translation(
                      "admin_billing.txtFreeStorage",
                      "Free Storage",
                    )}
                    :{" "}
                    <b className="text-gray-900">
                      {formatBytesToGb(defaultPricing.storage.free_bytes)} GB
                    </b>
                  </Text>
                  <Text size="xs" c="dimmed">
                    {translation(
                      "admin_billing.txtRatePerExtraGB",
                      "Rate per extra GB",
                    )}
                    :{" "}
                    <b className="text-gray-900">
                      ${defaultPricing.storage.price_per_gb} /GB
                    </b>
                  </Text>
                </Paper>
              </SimpleGrid>
            </Stack>
          </Card>
        )}

        {/* SIDE-BY-SIDE USER LISTS */}
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
                <Group gap="xs">
                  <ThemeIcon
                    size={28}
                    radius="xl"
                    color="indigo"
                    variant="light"
                  >
                    <IconUser size={16} />
                  </ThemeIcon>
                  <Text fw={700} size="sm">
                    {translation(
                      "admin_billing.txtUserDefaultPricing",
                      "Users on Default Pricing",
                    )}
                  </Text>
                </Group>
                <Badge color="indigo" variant="light">
                  {defaultTotal}{" "}
                  {translation("admin_billing.txtUsers", "Users")}
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
                                onClick={() =>
                                  handleOpenMoveToCustom(u.user_id)
                                }
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
                                {translation("admin_billing.txtFree", "free")}{" "}
                                ($
                                {u.pricing.chat_accounts.price_per_unit}/unit)
                              </Badge>
                              {u.pricing.storage && (
                                <Badge size="xs" variant="outline" color="teal">
                                  {translation(
                                    "admin_billing.txtStorage",
                                    "Storage",
                                  )}
                                  :{" "}
                                  {formatBytesToGb(
                                    u.pricing.storage.free_bytes,
                                  )}{" "}
                                  GB{" "}
                                  {translation("admin_billing.txtFree", "free")}{" "}
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
                                  onClick={() =>
                                    handleReturnToDefault(u.user_id)
                                  }
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
                  onClick={() =>
                    fetchCustomTier(customTab, customNextCursor, true)
                  }
                >
                  {translation("admin_billing.btnLoadMore", "Load More Users")}
                </Button>
              )}
            </Stack>
          </Card>
        </SimpleGrid>
      </Stack>

      {/* MODAL 1: USER BILLING OVERVIEW POPUP */}
      <Modal
        opened={overviewModalOpened}
        onClose={() => {
          setOverviewModalOpened(false);
          setSelectedOverviewUser(null);
          setUserEstimateData(null);
          setAvailablePeriods([]);
        }}
        title={
          <Group gap="xs">
            <ThemeIcon size={26} radius="md" color="indigo" variant="light">
              <IconCurrencyDollar size={16} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">
                {translation(
                  "admin_billing.titleUserBillingOverview",
                  "User Billing Overview",
                )}
              </Text>
              <Text size="xs" c="dimmed">
                {selectedOverviewUser?.username
                  ? `${selectedOverviewUser.username} (${selectedOverviewUser.user_id})`
                  : selectedOverviewUser?.user_id}
              </Text>
            </div>
          </Group>
        }
        radius="lg"
        size="lg"
        centered
      >
        <Stack gap="md" style={{ position: "relative", minHeight: 250 }}>
          {overviewLoading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                borderRadius: "inherit",
              }}
            >
              <Loader size="sm" color="indigo" />
            </div>
          )}

          <Paper p="sm" bg="gray.0" radius="md" withBorder>
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="xs">
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                  {translation(
                    "admin_billing.lblBillingCycle",
                    "Billing Cycle",
                  )}
                  :
                </Text>
                <Select
                  size="xs"
                  w={170}
                  data={periodSelectOptions}
                  value={overviewSelectedPeriod}
                  onChange={handleOverviewPeriodChange}
                  leftSection={<IconCalendar size={13} />}
                  allowDeselect={false}
                  disabled={periodSelectOptions.length <= 1}
                  styles={{ input: { fontWeight: 600, fontSize: "12px" } }}
                />
              </Group>

              {userEstimateData?.accrued_from &&
                userEstimateData?.accrued_through && (
                  <Badge size="sm" variant="light" color="gray" radius="sm">
                    {userEstimateData.accrued_from} —{" "}
                    {userEstimateData.accrued_through}
                  </Badge>
                )}
            </Group>
          </Paper>

          <Card withBorder radius="md" p="md" bg="indigo.0">
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" fw={600} c="indigo.8" tt="uppercase">
                  {translation(
                    "admin_billing.txtCurrentAccruedCost",
                    "Current Accrued Cost",
                  )}
                </Text>
                <Title order={2} c="indigo.9">
                  ${modalTotalCost.toFixed(2)}
                </Title>
              </div>

              {!userInvoiceGenerated && (
                <Badge
                  size="sm"
                  color="gray"
                  variant="filled"
                  radius="sm"
                  leftSection={<IconAlertCircle size={12} />}
                >
                  {translation(
                    "admin_billing.txtInvoiceNotGenerated",
                    "Invoice not generated yet",
                  )}
                </Badge>
              )}
            </Group>
          </Card>

          <Paper withBorder radius="md" p="xs" bg="white">
            <Text size="xs" fw={700} mb="xs" c="dark">
              {translation(
                "admin_billing.titleDailyBreakdown",
                "Daily Utility Breakdown",
              )}
            </Text>
            <Table verticalSpacing="xs" striped highlightOnHover>
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th>
                    {translation("admin_billing.thBilledItem", "Billed Item")}
                  </Table.Th>
                  <Table.Th>
                    {translation(
                      "admin_billing.thActivityRate",
                      "Activity / Rate",
                    )}
                  </Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>
                    {translation(
                      "admin_billing.thCurrentCost",
                      "Current Cost ($)",
                    )}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={500}>
                    {translation(
                      "admin_billing.itemChatAccounts",
                      `Chat Accounts (${modalChatFree} free)`,
                    ).replace(/{count}/g, String(modalChatFree))}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {translation(
                        "admin_billing.detailChatAccounts",
                        `${modalChatUsage} used (${modalChatBillable} billable) • $${modalChatRate.toFixed(4)}${rateSuffix}`,
                      )
                        .replace(/{usage}/g, String(modalChatUsage))
                        .replace(/{billable}/g, String(modalChatBillable))
                        .replace(/{rate}/g, modalChatRate.toFixed(4))
                        .replace(/{unit}/g, rateSuffix)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }} fw={600}>
                    ${modalChatCost.toFixed(2)}
                  </Table.Td>
                </Table.Tr>

                <Table.Tr>
                  <Table.Td fw={500}>
                    {translation(
                      "admin_billing.itemStorageOverage",
                      `Storage Overage (${formatBytesLocalized(modalStorageFreeBytes, currentLang)} free)`,
                    ).replace(
                      /{size}/g,
                      formatBytesLocalized(modalStorageFreeBytes, currentLang),
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {translation(
                        "admin_billing.detailStorageOverage",
                        `${formatBytesLocalized(modalStorageUsageBytes, currentLang)} used • $${modalStorageRate.toFixed(4)}/GB`,
                      )
                        .replace(
                          /{usage}/g,
                          formatBytesLocalized(
                            modalStorageUsageBytes,
                            currentLang,
                          ),
                        )
                        .replace(/{rate}/g, modalStorageRate.toFixed(4))}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }} fw={600}>
                    ${modalStorageCost.toFixed(2)}
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>

          <Group justify="flex-end" mt="xs">
            <Button
              size="xs"
              variant="default"
              onClick={() => {
                setOverviewModalOpened(false);
                setSelectedOverviewUser(null);
                setUserEstimateData(null);
                setAvailablePeriods([]);
              }}
            >
              {translation("admin_billing.buttonClose", "Close")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 2: CONFIGURE RATES */}
      <Modal
        opened={rateModalOpened}
        onClose={() => setRateModalOpened(false)}
        title={
          <Text fw={700} size="md">
            {modalMode === "edit_default"
              ? translation(
                  "admin_billing.titleEditDefaultRates",
                  "Edit Standard Default Rates",
                )
              : modalMode === "move_to_custom"
                ? translation(
                    "admin_billing.titleMoveToCustom",
                    "Set Custom Rates for ",
                  ) + (targetUserId || "")
                : translation(
                    "admin_billing.titleEditCustomRates",
                    "Edit Custom Rates: ",
                  ) + (targetUserId || "")}
          </Text>
        }
        radius="lg"
        size="md"
        centered
      >
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            {modalMode === "move_to_custom"
              ? translation(
                  "admin_billing.textMoveToCustom",
                  "Specify the custom rates and allowances to apply when moving this user to the custom pricing tier.",
                )
              : translation(
                  "admin_billing.textEditCustomRates",
                  "Adjust included free usage allowances and overage charges.",
                )}
          </Text>

          <Divider label="Chat Accounts" labelPosition="left" />

          <SimpleGrid cols={2} spacing="xs">
            <NumberInput
              label={translation(
                "admin_billing.labelFreeQuantity",
                "Free Quantity",
              )}
              description={translation(
                "admin_billing.descriptionFreeAccounts",
                "Included free accounts",
              )}
              size="xs"
              min={0}
              value={editFreeAccounts}
              onChange={(val) => setEditFreeAccounts(Number(val) || 0)}
            />
            <NumberInput
              label={translation(
                "admin_billing.labelAccountPrice",
                "Rate per extra unit ($)",
              )}
              description={translation(
                "admin_billing.descriptionAccountPrice",
                "Price per additional account",
              )}
              size="xs"
              min={0}
              decimalScale={2}
              value={editAccountPrice}
              onChange={(val) => setEditAccountPrice(Number(val) || 0)}
            />
          </SimpleGrid>

          <Divider label="Storage Allocation" labelPosition="left" />

          <SimpleGrid cols={2} spacing="xs">
            <NumberInput
              label={translation(
                "admin_billing.labelFreeStorage",
                "Free Storage (GB)",
              )}
              description={translation(
                "admin_billing.descriptionFreeStorage",
                "Included GBs",
              )}
              size="xs"
              min={0}
              decimalScale={2}
              value={editFreeGb}
              onChange={(val) => setEditFreeGb(Number(val) || 0)}
            />
            <NumberInput
              label={translation(
                "admin_billing.labelStoragePrice",
                "Rate per extra GB ($)",
              )}
              description={translation(
                "admin_billing.descriptionStoragePrice",
                "Price per additional GB",
              )}
              size="xs"
              min={0}
              decimalScale={3}
              value={editStoragePrice}
              onChange={(val) => setEditStoragePrice(Number(val) || 0)}
            />
          </SimpleGrid>

          <Divider label="Audit & Reason" labelPosition="left" />

          <Textarea
            label={translation(
              "admin_billing.labelChangeReason",
              "Change Reason",
            )}
            description={translation(
              "admin_billing.descriptionChangeReason",
              "Briefly explain why this rate change is being made",
            )}
            placeholder={translation(
              "admin_billing.placeholderChangeReason",
              "e.g., Annual plan adjustment, Promotional deal, Tier renegotiation...",
            )}
            size="xs"
            rows={3}
            withAsterisk
            value={changeReason}
            error={changeReasonError}
            onChange={(e) => {
              setChangeReason(e.currentTarget.value);
              if (changeReasonError) setChangeReasonError(null);
            }}
          />

          <Group justify="flex-end" gap="xs" mt="lg">
            <Button
              variant="default"
              size="xs"
              onClick={() => setRateModalOpened(false)}
            >
              {translation("admin_billing.buttonCancel", "Cancel")}
            </Button>
            <Button
              size="xs"
              color={modalMode === "edit_default" ? "indigo" : "cyan"}
              loading={submittingRate}
              onClick={handleSaveRates}
            >
              {modalMode === "move_to_custom"
                ? translation(
                    "admin_billing.buttonMoveToCustom",
                    "Move & Apply Custom Rates",
                  )
                : translation("admin_billing.buttonSaveRates", "Save Rates")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 3: CONFIRM STATUS CHANGE */}
      <Modal
        opened={confirmModalOpened}
        onClose={() => {
          setConfirmModalOpened(false);
          setTargetStatusUser(null);
          setStatusConfirmText("");
        }}
        title={
          <Text fw={700} size="md">
            {expectedActionWord === "deactivate"
              ? translation(
                  "admin_billing.titleConfirmDeactivate",
                  "Confirm User Deactivation",
                )
              : translation(
                  "admin_billing.titleConfirmActivate",
                  "Confirm User Activation",
                )}
          </Text>
        }
        centered
        radius="md"
        size="sm"
      >
        <Stack gap="sm">
          <Text size="sm">
            {expectedActionWord === "deactivate"
              ? translation(
                  "admin_billing.msgConfirmDeactivate",
                  "Are you sure you want to deactivate this account? The user will temporarily lose access.",
                )
              : translation(
                  "admin_billing.msgConfirmActivate",
                  "Are you sure you want to activate this account? The user will regain access immediately.",
                )}
          </Text>

          <Paper p="xs" bg="gray.1" radius="sm">
            <Text size="xs" c="dimmed">
              {translation("admin_billing.labelTargetUser", "Target user:")}{" "}
              <b className="text-gray-900 font-mono">
                {targetStatusUser?.username
                  ? `${targetStatusUser.username} (${targetStatusUser.user_id})`
                  : targetStatusUser?.user_id}
              </b>
            </Text>
          </Paper>

          <Text size="xs" c="dimmed" mt={4}>
            {translation(
              "admin_billing.txtTypeToConfirm",
              "To confirm, please type",
            )}{" "}
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                color:
                  expectedActionWord === "deactivate"
                    ? "var(--mantine-color-red-7)"
                    : "var(--mantine-color-teal-7)",
              }}
            >
              {expectedActionWord}
            </span>{" "}
            {translation("admin_billing.txtBelow", "below:")}
          </Text>

          <TextInput
            size="xs"
            placeholder={expectedActionWord}
            value={statusConfirmText}
            onChange={(e) => setStatusConfirmText(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                statusConfirmText.trim().toLowerCase() === expectedActionWord
              ) {
                handleConfirmStatusChange();
              }
            }}
            autoFocus
          />

          <Group justify="flex-end" gap="xs" mt="md">
            <Button
              variant="default"
              size="xs"
              onClick={() => {
                setConfirmModalOpened(false);
                setTargetStatusUser(null);
                setStatusConfirmText("");
              }}
            >
              {translation("admin_billing.buttonCancel", "Cancel")}
            </Button>

            <Button
              size="xs"
              color={expectedActionWord === "deactivate" ? "red" : "teal"}
              disabled={
                statusConfirmText.trim().toLowerCase() !== expectedActionWord
              }
              onClick={handleConfirmStatusChange}
            >
              {expectedActionWord === "deactivate"
                ? translation(
                    "admin_billing.btnConfirmDeactivate",
                    "Deactivate User",
                  )
                : translation(
                    "admin_billing.btnConfirmActivate",
                    "Activate User",
                  )}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
