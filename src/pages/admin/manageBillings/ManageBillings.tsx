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
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowLeftRight,
  IconArrowRight,
  IconCheck,
  IconDatabase,
  IconEdit,
  IconMail,
  IconMessages,
  IconSearch,
  IconUser,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "../../../store/language/language.store";
import { api } from "../../../api/axios";
import { API_ENDPOINTS } from "../../../utils/constant";
import { handleApiError } from "../../../utils/errorHandler";

export interface PricingRule {
  pricing_id: string;
  pricing_type: string;
  version: number;
  status: string;
  currency: string;
  chat_accounts: {
    free_quantity: number;
    price_per_unit: string | number;
  };
  storage: {
    free_bytes: number;
    price_per_gb: string | number;
  };
  effective_from: string | null;
  effective_until: string | null;
  updated_at: string;
}

export interface UserDetails {
  user_id: string;
  email?: string;
  status?: string;
  username?: string;
}

export interface DefaultUserItem {
  user_id: UserDetails | string;
}

export interface DefaultTierGroup {
  pricing: PricingRule;
  users: {
    total: number;
    items: DefaultUserItem[];
    next_cursor: string | null;
  };
}

export interface CustomTierItem {
  user_id: string;
  email?: string;
  status?: string;
  username?: string;
  pricing: PricingRule;
}

export interface AdminPricingResponse {
  message: string;
  details: {
    default: DefaultTierGroup;
    custom: CustomTierItem[];
  };
}

const formatBytesToGb = (bytes: number): number => {
  return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
};

const gbToBytes = (gb: number): number => {
  return Math.round(gb * 1024 * 1024 * 1024);
};

// Extracts standardized fields whether user_id is a nested object or a plain string
const normalizeUser = (
  raw: DefaultUserItem | CustomTierItem,
): { user_id: string; email?: string; status?: string; username?: string } => {
  if (typeof raw.user_id === "object" && raw.user_id !== null) {
    return {
      user_id: raw.user_id.user_id,
      email: raw.user_id.email,
      status: raw.user_id.status,
      username: raw.user_id.username,
    };
  }
  return {
    user_id: raw.user_id as string,
    email: (raw as CustomTierItem).email,
    status: (raw as CustomTierItem).status,
    username: (raw as CustomTierItem).username,
  };
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
  const [activePricingId, setActivePricingId] = useState<string>("");

  const [editFreeAccounts, setEditFreeAccounts] = useState<number>(0);
  const [editAccountPrice, setEditAccountPrice] = useState<number>(0);
  const [editFreeGb, setEditFreeGb] = useState<number>(0);
  const [editStoragePrice, setEditStoragePrice] = useState<number>(0);
  const [submittingRate, setSubmittingRate] = useState(false);

  const fetchPricingData = async () => {
    setLoading(true);
    try {
      const endpoint = API_ENDPOINTS.ADMIN_PRICING || "/admin/pricing";
      const res = await api.get<AdminPricingResponse>(endpoint);

      if (res.data?.details) {
        setDefaultTier(res.data.details.default);
        setCustomTiers(res.data.details.custom || []);
      }
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingData();
  }, []);

  const handleOpenEditDefault = () => {
    if (!defaultTier) return;
    setModalMode("edit_default");
    setActivePricingId(defaultTier.pricing.pricing_id);
    setTargetUserId(null);

    setEditFreeAccounts(defaultTier.pricing.chat_accounts.free_quantity);
    setEditAccountPrice(
      Number(defaultTier.pricing.chat_accounts.price_per_unit),
    );
    setEditFreeGb(formatBytesToGb(defaultTier.pricing.storage.free_bytes));
    setEditStoragePrice(Number(defaultTier.pricing.storage.price_per_gb));
    setRateModalOpened(true);
  };

  const handleOpenEditCustom = (customItem: CustomTierItem) => {
    setModalMode("edit_custom");
    setActivePricingId(customItem.pricing.pricing_id);
    setTargetUserId(customItem.user_id);

    setEditFreeAccounts(customItem.pricing.chat_accounts.free_quantity);
    setEditAccountPrice(
      Number(customItem.pricing.chat_accounts.price_per_unit),
    );
    setEditFreeGb(formatBytesToGb(customItem.pricing.storage.free_bytes));
    setEditStoragePrice(Number(customItem.pricing.storage.price_per_gb));
    setRateModalOpened(true);
  };

  const handleOpenMoveToCustom = (userId: string) => {
    setModalMode("move_to_custom");
    setTargetUserId(userId);
    setActivePricingId(`custom#${userId}`);

    const basePricing = defaultTier?.pricing;
    setEditFreeAccounts(basePricing?.chat_accounts.free_quantity ?? 5);
    setEditAccountPrice(Number(basePricing?.chat_accounts.price_per_unit ?? 1));
    setEditFreeGb(
      basePricing ? formatBytesToGb(basePricing.storage.free_bytes) : 5,
    );
    setEditStoragePrice(Number(basePricing?.storage.price_per_gb ?? 0.025));
    setRateModalOpened(true);
  };

  const handleSaveRates = async () => {
    setSubmittingRate(true);
    const endpoint = API_ENDPOINTS.ADMIN_PRICING || "/admin/pricing";

    const pricingPayload = {
      chat_accounts: {
        free_quantity: editFreeAccounts,
        price_per_unit: String(editAccountPrice),
      },
      storage: {
        free_bytes: gbToBytes(editFreeGb),
        price_per_gb: String(editStoragePrice),
      },
    };

    try {
      if (modalMode === "move_to_custom" && targetUserId) {
        await api.post(`${endpoint}/reassign`, {
          user_id: targetUserId,
          target_tier: "custom",
          pricing: pricingPayload,
        });

        notifications.show({
          title: "",
          message: translation(
            "admin_billing.notiUserMovedSuccess",
            "User moved to custom pricing tier successfully.",
          ),
          color: "green",
          icon: <IconCheck size={16} />,
        });
      } else {
        await api.put(endpoint, {
          pricing_id: activePricingId,
          user_id: targetUserId ?? undefined,
          ...pricingPayload,
        });

        notifications.show({
          title: "",
          message: translation(
            "admin_billing.notiPricingUpdated",
            "Tier pricing configuration updated successfully.",
          ),
          color: "green",
          icon: <IconCheck size={16} />,
        });
      }

      setRateModalOpened(false);
      await fetchPricingData();
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setSubmittingRate(false);
    }
  };

  const handleReturnToDefault = async (userId: string) => {
    try {
      await api.post(
        `${API_ENDPOINTS.ADMIN_PRICING || "/admin/pricing"}/reassign`,
        {
          user_id: userId,
          target_tier: "default",
        },
      );

      notifications.show({
        title: "",
        message: translation(
          "admin_billing.notiUserReturnedDefault",
          "User reassigned to standard default pricing.",
        ),
        color: "green",
        icon: <IconCheck size={16} />,
      });

      await fetchPricingData();
    } catch (error: any) {
      handleApiError(error);
    }
  };

  const filteredDefaultUsers = useMemo(() => {
    const items = defaultTier?.users.items || [];
    if (!defaultSearch.trim()) return items;
    const q = defaultSearch.toLowerCase();
    return items.filter((item) => {
      const u = normalizeUser(item);
      return (
        u.user_id.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q))
      );
    });
  }, [defaultTier, defaultSearch]);

  const filteredCustomUsers = useMemo(() => {
    if (!customSearch.trim()) return customTiers;
    const q = customSearch.toLowerCase();
    return customTiers.filter((item) => {
      return (
        item.user_id.toLowerCase().includes(q) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.username && item.username.toLowerCase().includes(q))
      );
    });
  }, [customTiers, customSearch]);

  const renderUserInfo = (user: {
    user_id: string;
    username?: string;
    email?: string;
    status?: string;
  }) => (
    <Group gap="xs" wrap="nowrap" align="center">
      <ThemeIcon size={28} radius="xl" variant="light" color="gray">
        <IconUser size={15} />
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
          {user.status && (
            <Badge
              size="xs"
              variant="dot"
              color={user.status === "active" ? "teal" : "gray"}
            >
              {user.status}
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
  );

  return (
    <div className="w-full">
      <LoadingOverlay
        visible={loading}
        zIndex={10}
        overlayProps={{ radius: "sm", blur: 1 }}
        loaderProps={{ color: "indigo", type: "dots" }}
      />
      {/* Header */}
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
            "Configure default allowances, customize tier pricing rules, and allocate user assignments.",
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
                      Chat Accounts
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Free Quantity:{" "}
                    <b className="text-gray-900">
                      {defaultTier.pricing.chat_accounts.free_quantity}{" "}
                      {translation("admin_billing.txtAccounts", "accounts")}
                    </b>
                  </Text>
                  <Text size="xs" c="dimmed">
                    Rate per extra unit:{" "}
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
                    Free Storage:{" "}
                    <b className="text-gray-900">
                      {formatBytesToGb(defaultTier.pricing.storage.free_bytes)}{" "}
                      GB
                    </b>
                  </Text>
                  <Text size="xs" c="dimmed">
                    Rate per extra GB:{" "}
                    <b className="text-gray-900">
                      ${defaultTier.pricing.storage.price_per_gb} /GB
                    </b>
                  </Text>
                </Paper>
              </SimpleGrid>
            </Stack>
          </Card>
        )}

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
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

              <ScrollArea.Autosize mah={520} offsetScrollbars>
                <Stack gap="xs">
                  {filteredDefaultUsers.length > 0 ? (
                    filteredDefaultUsers.map((item) => {
                      const u = normalizeUser(item);
                      return (
                        <Paper
                          key={u.user_id}
                          p="xs"
                          radius="md"
                          withBorder
                          bg="gray.0"
                          className="flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                          {renderUserInfo(u)}

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
                        </Paper>
                      );
                    })
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

          {/* RIGHT: CUSTOM PLAN USERS */}
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

              <ScrollArea.Autosize mah={520} offsetScrollbars>
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
                        <Group justify="space-between" align="center">
                          {renderUserInfo(u)}

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

                        {/* Custom rates chips */}
                        <Group gap={6}>
                          <Badge size="xs" variant="outline" color="cyan">
                            Accounts: {u.pricing.chat_accounts.free_quantity}{" "}
                            {translation("admin_billing.txtFree", "free")} ($
                            {u.pricing.chat_accounts.price_per_unit}/unit)
                          </Badge>
                          <Badge size="xs" variant="outline" color="teal">
                            {translation("admin_billing.txtStorage", "Storage")}
                            : {formatBytesToGb(u.pricing.storage.free_bytes)} GB
                            {translation("admin_billing.txtFree", "free")} ($
                            {u.pricing.storage.price_per_gb}/GB)
                          </Badge>
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
                    `Set Custom Rates for `,
                  ) + (targetUserId || "")
                : translation(
                    "admin_billing.titleEditCustomRates",
                    `Edit Custom Rates: `,
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
