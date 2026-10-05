import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowLeftRight,
  IconArrowRight,
  IconCheck,
  IconCurrencyDollar,
  IconDatabase,
  IconEdit,
  IconMail,
  IconMessages,
  IconSearch,
  IconUser,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "../../../store/language/language.store";
import {
  type AdminUserItem,
  type CustomTierItem,
  type DefaultTierGroup,
  type UpdatePricingPayload,
  getAdminPricingDataApi,
  patchPricingTierRatesApi,
  reassignUserTierApi,
  toggleUserStatusApi,
} from "../../../api/manageBillingApi";

const formatBytesToGb = (bytes: number): number => {
  return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
};

const gbToBytes = (gb: number): number => {
  return Math.round(gb * 1024 * 1024 * 1024);
};

export default function ManageBillings() {
  const { translation } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [defaultTier, setDefaultTier] = useState<DefaultTierGroup | null>(null);
  const [customTiers, setCustomTiers] = useState<CustomTierItem[]>([]);

  const [defaultSearch, setDefaultSearch] = useState("");
  const [customSearch, setCustomSearch] = useState("");

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

  const loadData = async () => {
    setLoading(true);
    const details = await getAdminPricingDataApi();
    if (details) {
      setDefaultTier(details.default);
      setCustomTiers(details.custom || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEditDefault = () => {
    if (!defaultTier) return;
    setModalMode("edit_default");
    setTargetUserId(null);
    setActiveTierVersion(defaultTier.pricing.version);

    setEditFreeAccounts(defaultTier.pricing.chat_accounts.free_quantity);
    setEditAccountPrice(
      Number(defaultTier.pricing.chat_accounts.price_per_unit),
    );
    setEditFreeGb(formatBytesToGb(defaultTier.pricing.storage.free_bytes));
    setEditStoragePrice(Number(defaultTier.pricing.storage.price_per_gb));
    setChangeReason("");
    setChangeReasonError(null);
    setRateModalOpened(true);
  };

  const handleOpenEditCustom = (customItem: CustomTierItem) => {
    setModalMode("edit_custom");
    setTargetUserId(customItem.user_id);
    setActiveTierVersion(customItem.pricing.version);

    setEditFreeAccounts(customItem.pricing.chat_accounts.free_quantity);
    setEditAccountPrice(
      Number(customItem.pricing.chat_accounts.price_per_unit),
    );
    setEditFreeGb(formatBytesToGb(customItem.pricing.storage.free_bytes));
    setEditStoragePrice(Number(customItem.pricing.storage.price_per_gb));
    setChangeReason("");
    setChangeReasonError(null);
    setRateModalOpened(true);
  };

  const handleOpenMoveToCustom = (userId: string) => {
    setModalMode("move_to_custom");
    setTargetUserId(userId);
    setActiveTierVersion(defaultTier?.pricing?.version ?? 1);

    const basePricing = defaultTier?.pricing;
    setEditFreeAccounts(basePricing?.chat_accounts.free_quantity ?? 5);
    setEditAccountPrice(Number(basePricing?.chat_accounts.price_per_unit ?? 1));
    setEditFreeGb(
      basePricing ? formatBytesToGb(basePricing.storage.free_bytes) : 5,
    );
    setEditStoragePrice(Number(basePricing?.storage.price_per_gb ?? 0.025));
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

    const currencyCode = (defaultTier?.pricing?.currency || "USD")
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
      payload = {
        pricing_type: "default",
        ...commonRates,
      };
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
      await loadData();
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
      await loadData();
    }
  };

  const handleToggleUserStatus = async (user: AdminUserItem) => {
    const isCurrentlyActive = user.status === "active";
    const previousStatus = user.status;
    const nextStatus: "active" | "deactive" = isCurrentlyActive
      ? "deactive"
      : "active";

    const updateUserList = (items: AdminUserItem[]) =>
      items.map((u) =>
        u.user_id === user.user_id ? { ...u, status: nextStatus } : u,
      );

    setDefaultTier((prev) =>
      prev
        ? {
            ...prev,
            users: {
              ...prev.users,
              items: updateUserList(prev.users.items),
            },
          }
        : prev,
    );

    setCustomTiers((prev) =>
      prev.map((u) =>
        u.user_id === user.user_id ? { ...u, status: nextStatus } : u,
      ),
    );

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
        color: nextStatus === "active" ? "teal" : "gray",
        icon: <IconCheck size={16} />,
      });
    } else {
      const rollbackList = (items: AdminUserItem[]) =>
        items.map((u) =>
          u.user_id === user.user_id ? { ...u, status: previousStatus } : u,
        );

      setDefaultTier((prev) =>
        prev
          ? {
              ...prev,
              users: {
                ...prev.users,
                items: rollbackList(prev.users.items),
              },
            }
          : prev,
      );

      setCustomTiers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id ? { ...u, status: previousStatus } : u,
        ),
      );
    }
  };

  const filteredDefaultUsers = useMemo(() => {
    const items = defaultTier?.users.items || [];
    if (!defaultSearch.trim()) return items;
    const q = defaultSearch.toLowerCase();
    return items.filter(
      (u) =>
        u.user_id.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)),
    );
  }, [defaultTier, defaultSearch]);

  const filteredCustomUsers = useMemo(() => {
    if (!customSearch.trim()) return customTiers;
    const q = customSearch.toLowerCase();
    return customTiers.filter(
      (c) =>
        c.user_id.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.username && c.username.toLowerCase().includes(q)),
    );
  }, [customTiers, customSearch]);

  const renderUserInfo = (user: AdminUserItem) => {
    const isActive = user.status === "active";
    const isUpdating = statusUpdatingUserId === user.user_id;

    return (
      <Group justify="space-between" align="center" wrap="nowrap" w="100%">
        <Group gap="xs" wrap="nowrap" align="center" style={{ minWidth: 0 }}>
          <ThemeIcon
            size={30}
            radius="xl"
            variant="light"
            color={isActive ? "indigo" : "gray"}
          >
            <IconUser size={16} />
          </ThemeIcon>
          <div style={{ minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap" align="center">
              {user.username && (
                <Text size="xs" fw={700} c="dark" truncate>
                  {user.username}
                </Text>
              )}
              <Text
                size="xs"
                fw={user.username ? 400 : 600}
                className="font-mono text-gray-700"
                truncate
              >
                {user.user_id}
              </Text>
              <Badge size="xs" variant="dot" color={isActive ? "teal" : "gray"}>
                {user.status}
              </Badge>
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
              onChange={() => handleToggleUserStatus(user)}
              style={{ pointerEvents: isUpdating ? "none" : undefined }}
            />
          </span>
        </Tooltip>
      </Group>
    );
  };

  const renderEstimateBadges = (estimate?: AdminUserItem["estimate"]) => {
    if (!estimate) return null;
    return (
      <Group gap={6} wrap="wrap">
        <Badge
          size="xs"
          variant="light"
          color="indigo"
          leftSection={<IconCurrencyDollar size={11} />}
        >
          {translation("admin_billing.txtTotal", "Total")}: $
          {estimate.cost.total}
        </Badge>
        <Badge size="xs" variant="outline" color="gray">
          {translation("admin_billing.txtAccountsTotal", "Accounts")}: $
          {estimate.cost.chat_accounts}
        </Badge>
        <Badge size="xs" variant="outline" color="gray">
          {translation("admin_billing.txtStorageTotal", "Storage")}: $
          {estimate.cost.storage}
        </Badge>
      </Group>
    );
  };

  return (
    <div className="w-full relative" style={{ minHeight: 400 }}>
      <LoadingOverlay
        visible={loading}
        zIndex={10}
        overlayProps={{ radius: "sm", blur: 1 }}
        loaderProps={{ color: "indigo", type: "dots" }}
      />

      <Stack gap={4} mb="xl">
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

      <Stack gap="xl">
        {defaultTier && (
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
                    {defaultTier.pricing.version} •{" "}
                    {translation("admin_billing.txtCurrency", "Currency")}:{" "}
                    {defaultTier.pricing.currency}
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
                      {defaultTier.pricing.chat_accounts.free_quantity}{" "}
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
                      ${defaultTier.pricing.chat_accounts.price_per_unit} /mo
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
                      {formatBytesToGb(defaultTier.pricing.storage.free_bytes)}{" "}
                      GB
                    </b>
                  </Text>
                  <Text size="xs" c="dimmed">
                    {translation(
                      "admin_billing.txtRatePerExtraGB",
                      "Rate per extra GB",
                    )}
                    :{" "}
                    <b className="text-gray-900">
                      ${defaultTier.pricing.storage.price_per_gb} /GB
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
            className="shadow-xs h-full"
          >
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
                  {defaultTier?.users.total ?? 0}{" "}
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

              <Divider />

              <ScrollArea.Autosize mah={540} offsetScrollbars>
                <Stack gap="xs">
                  {filteredDefaultUsers.length > 0 ? (
                    filteredDefaultUsers.map((u) => (
                      <Paper
                        key={u.user_id}
                        p="xs"
                        radius="md"
                        withBorder
                        bg="gray.0"
                        className="flex flex-col gap-2 hover:bg-gray-100 transition-colors"
                      >
                        {renderUserInfo(u)}

                        <Group justify="space-between" align="center" pt={2}>
                          {renderEstimateBadges(u.estimate)}

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
                    ))
                  ) : (
                    <Text size="xs" c="dimmed" ta="center" py="xl">
                      {translation(
                        "admin_billing.txtNoUsersDefaultTier",
                        "No users found in default tier.",
                      )}
                    </Text>
                  )}
                </Stack>
              </ScrollArea.Autosize>
            </Stack>
          </Card>

          {/* CUSTOM PLAN USERS */}
          <Card
            withBorder
            radius="lg"
            p="md"
            bg="white"
            className="shadow-xs h-full"
          >
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
                  {customTiers.length}{" "}
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
                value={customSearch}
                onChange={(e) => setCustomSearch(e.currentTarget.value)}
              />

              <Divider />

              <ScrollArea.Autosize mah={540} offsetScrollbars>
                <Stack gap="xs">
                  {filteredCustomUsers.length > 0 ? (
                    filteredCustomUsers.map((u) => (
                      <Paper
                        key={u.user_id}
                        p="xs"
                        radius="md"
                        withBorder
                        bg="cyan.0"
                        className="flex flex-col gap-2 hover:bg-cyan-100/50 transition-colors"
                      >
                        {renderUserInfo(u)}

                        <Group gap={6}>
                          <Badge size="xs" variant="outline" color="cyan">
                            {translation(
                              "admin_billing.txtAccounts",
                              "Accounts",
                            )}
                            : {u.pricing.chat_accounts.free_quantity}{" "}
                            {translation("admin_billing.txtFree", "free")} ($
                            {u.pricing.chat_accounts.price_per_unit}
                            /unit)
                          </Badge>
                          <Badge size="xs" variant="outline" color="teal">
                            {translation("admin_billing.txtStorage", "Storage")}
                            : {formatBytesToGb(u.pricing.storage.free_bytes)} GB
                            {translation("admin_billing.txtFree", "free")} ($
                            {u.pricing.storage.price_per_gb}/GB)
                          </Badge>
                        </Group>

                        <Group justify="space-between" align="center" pt={2}>
                          {renderEstimateBadges(u.estimate)}

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
                    ))
                  ) : (
                    <Text size="xs" c="dimmed" ta="center" py="xl">
                      {translation(
                        "admin_billing.txtNoCustomPricingUsers",
                        "No custom pricing users found.",
                      )}
                    </Text>
                  )}
                </Stack>
              </ScrollArea.Autosize>
            </Stack>
          </Card>
        </SimpleGrid>
      </Stack>

      {/* POPUP MODAL: CONFIGURE RATES */}
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
    </div>
  );
}
