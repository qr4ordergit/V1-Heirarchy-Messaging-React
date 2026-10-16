import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconCreditCard,
  IconCrown,
  IconDownload,
  IconLock,
  IconMail,
  IconTable,
  IconWallet,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useAuthStore } from "../../store/auth/auth.store";
import {
  getEstimateApi,
  getUsageApi,
  updateMembershipStatusApi,
  type EstimateData,
  type UsageData,
} from "../../api/usageBillingApi";
import { useTranslation } from "../../store/language/language.store";
import classes from "../accounts/Accounts.module.css";
import logo from "../../assets/logo.png";

export interface FeatureRowDef {
  key?: string;
  feature: string;
  featureDescription?: string;
  defaultUsageKey?: string;
  defaultUsageFallback?: string;
  format?: (
    val: any,
    rawData: UsageData | null,
    t: (path: string, fallback?: string) => string,
  ) => string | number;
  isPaidOnly?: boolean;
}

export interface FeatureRowRendered {
  key?: string;
  feature: string;
  featureDescription?: string;
  usage: string | number;
  isPaidOnly?: boolean;
}

// Localized bytes formatter (EN / UK)
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

const generateBillingPeriods = (lang: string = "en") => {
  const options = [];
  const currentDate = new Date();
  const locale = lang === "uk" ? "uk-UA" : "en-US";

  for (let i = 0; i < 12; i++) {
    const d = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1,
    );
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const periodValue = `${year}-${month}`;
    const monthLabel = d.toLocaleString(locale, {
      month: "long",
      year: "numeric",
    });

    options.push({
      value: periodValue,
      label: monthLabel,
    });
  }
  return options;
};

const parseCost = (val: string | number | undefined | null): number => {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function UsageBilling() {
  const navigate = useNavigate();

  const { translation, currentLang } = useTranslation();
  const curtLang = currentLang || "en";

  const userDetails = useAuthStore((state) => state.userDetails);
  const setUserDetails = useAuthStore((state) => (state as any).setUserDetails);
  const isPaid = Boolean((userDetails as any)?.is_paid);

  const billingPeriodOptions = useMemo(
    () => generateBillingPeriods(curtLang),
    [curtLang],
  );

  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    billingPeriodOptions[0]?.value || "2026-10",
  );

  const [payingBill, setPayingBill] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingPeriod, setLoadingPeriod] = useState(false);

  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [estimateData, setEstimateData] = useState<EstimateData | null>(null);
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState<boolean>(false);

  const loadBillingData = async (period: string, isInitial = false) => {
    if (isInitial) {
      setLoadingData(true);
    } else {
      setLoadingPeriod(true);
    }

    try {
      const [usageRes, estimateRes] = await Promise.all([
        getUsageApi(),
        getEstimateApi(),
      ]);

      if (usageRes) setUsageData(usageRes);
      if (estimateRes?.estimate) setEstimateData(estimateRes.estimate);

      const invoiceStatus = Boolean(estimateRes?.invoiceGenerated);
      setIsInvoiceGenerated(invoiceStatus);

      if (estimateRes?.period && estimateRes.period !== period) {
        setSelectedPeriod(estimateRes.period);
      }
    } finally {
      if (isInitial) {
        setLoadingData(false);
      } else {
        setLoadingPeriod(false);
      }
    }
  };

  useEffect(() => {
    loadBillingData(selectedPeriod, true);
  }, []);

  const handlePeriodChange = (val: string | null) => {
    if (!val || val === selectedPeriod) return;
    setSelectedPeriod(val);
    loadBillingData(val, false);
  };

  const accruedFrom = estimateData?.accrued_from;
  const accruedThrough = estimateData?.accrued_through;

  const chatEstimatedCost = parseCost(
    estimateData?.cost?.chat_accounts ?? estimateData?.total_chat_accounts_cost,
  );
  const storageEstimatedCost = parseCost(
    estimateData?.cost?.storage ?? estimateData?.total_storage_cost,
  );
  const totalEstimatedCost = parseCost(
    estimateData?.cost?.total ?? estimateData?.total_estimated_cost,
  );

  const latestChat =
    estimateData?.latest_day?.chat_accounts ?? estimateData?.chat_accounts;
  const latestStorage =
    estimateData?.latest_day?.storage ?? estimateData?.storage;

  const billingUnit = estimateData?.latest_day?.pricing?.billing_unit;
  const unitWord =
    billingUnit === "per_day"
      ? translation("account_billing.unitDay", "day")
      : translation("account_billing.unitMonth", "month");

  const rateUnitSuffix =
    billingUnit === "per_day"
      ? `/${translation("account_billing.unitDay", "d")}`
      : `/${translation("account_billing.unitAccount", "acct")}`;

  const chatUsage = latestChat?.usage ?? usageData?.chat_accounts ?? 0;
  const chatFreeUnits = latestChat?.free_units ?? 5;
  const chatBillableUnits =
    latestChat?.billable_units ?? Math.max(0, chatUsage - chatFreeUnits);
  const chatUnitPrice = parseCost(latestChat?.unit_price ?? 0.03);

  const storageUsageBytes =
    latestStorage?.usage_bytes ?? usageData?.storage_bytes?.total_bytes ?? 0;
  const storageFreeBytes = latestStorage?.free_bytes ?? 5368709120; // 5 GB
  const storageUnitPrice = parseCost(latestStorage?.unit_price ?? 0.025);

  const formattedFreeStorage = formatBytesLocalized(storageFreeBytes, curtLang);
  const formattedUsageStorage = formatBytesLocalized(
    storageUsageBytes,
    curtLang,
  );

  // Dynamic Feature Definitions rebuilt whenever language, usage, or estimate data changes
  const freeFeatureDefs: FeatureRowDef[] = useMemo(() => {
    return [
      {
        key: "chat_accounts",
        feature: translation(
          "account_billing.featChatAccountsTitle",
          "Chat Accounts",
        ),
        featureDescription: translation(
          "account_billing.featChatAccountsDesc",
          `First ${chatFreeUnits} accounts are free (Beyond ${chatFreeUnits} free accounts, $${chatUnitPrice.toFixed(4)} per account per ${unitWord})`,
        )
          .replace(/{free}/g, String(chatFreeUnits))
          .replace(/{price}/g, chatUnitPrice.toFixed(4))
          .replace(/{unit}/g, unitWord),
        format: (val) => (val !== undefined ? String(val) : "0"),
      },
      {
        key: "storage_bytes",
        feature: translation("account_billing.featStorageTitle", "Storage"),
        featureDescription: translation(
          "account_billing.featStorageDesc",
          `Up to ${formattedFreeStorage} storage free (Beyond ${formattedFreeStorage}, $${storageUnitPrice.toFixed(4)} per GB per ${unitWord})`,
        )
          .replace(/{free}/g, formattedFreeStorage)
          .replace(/{price}/g, storageUnitPrice.toFixed(4))
          .replace(/{unit}/g, unitWord),
        format: (val) => formatBytesLocalized(val?.total_bytes ?? 0, curtLang),
      },
      {
        key: "cloud_cost",
        feature: translation(
          "account_billing.featCloudCostTitle",
          "Cloud computing cost",
        ),
        featureDescription: translation(
          "account_billing.featCloudCostDesc",
          "Will be based on your actual daily usage",
        ),
        defaultUsageKey: "account_billing.txtCurrentlyFree",
        defaultUsageFallback: "Currently free",
      },
      {
        key: "bulk_account_creation",
        feature: translation(
          "account_billing.featBulkAccountsTitle",
          "Bulk account creation",
        ),
        defaultUsageKey: "account_billing.txtUnlimited",
        defaultUsageFallback: "Unlimited",
      },
      {
        key: "hierarchical_access",
        feature: translation(
          "account_billing.featHierarchicalAccessTitle",
          "Hierarchical Account Access",
        ),
        defaultUsageKey: "account_billing.txtUnlimited",
        defaultUsageFallback: "Unlimited",
      },
      {
        key: "one_on_one_chat",
        feature: translation(
          "account_billing.featOneOnOneTitle",
          "One on One Chat - (Encrypted)",
        ),
        defaultUsageKey: "account_billing.txtUnlimited",
        defaultUsageFallback: "Unlimited",
      },
      {
        key: "group_chats",
        feature: translation(
          "account_billing.featGroupChatsTitle",
          "Group Chats - (Encrypted)",
        ),
        defaultUsageKey: "account_billing.txtUnlimited",
        defaultUsageFallback: "Unlimited",
      },
      {
        key: "double_encryption",
        feature: translation(
          "account_billing.featDoubleEncryptionTitle",
          "Double Encryption with own password",
        ),
        defaultUsageKey: "account_billing.txtUnlimited",
        defaultUsageFallback: "Unlimited",
      },
      {
        key: "scheduled_messages",
        feature: translation(
          "account_billing.featScheduledMsgsTitle",
          "Scheduled Messages",
        ),
        defaultUsageKey: "account_billing.txtUnlimited",
        defaultUsageFallback: "Unlimited",
      },
      {
        key: "disappearing_messages",
        feature: translation(
          "account_billing.featDisappearingMsgsTitle",
          "Disappearing Messages",
        ),
        defaultUsageKey: "account_billing.txtUnlimited",
        defaultUsageFallback: "Unlimited",
      },
      {
        key: "account_tags",
        feature: translation(
          "account_billing.featAccountTagsTitle",
          "Account & Group Tags",
        ),
        featureDescription: translation(
          "account_billing.featAccountTagsDesc",
          "Convenient message filtering across your chats",
        ),
        format: (val, _, t) =>
          val !== undefined
            ? `${val} ${t("account_billing.txtCreatedSuffix", "created")}`
            : t("account_billing.txtUnlimited", "Unlimited"),
        defaultUsageKey: "account_billing.txtUnlimited",
        defaultUsageFallback: "Unlimited",
      },
      {
        key: "export_chats",
        feature: translation(
          "account_billing.featExportChatsTitle",
          "Export/Download Chats with Media",
        ),
        defaultUsageKey: "account_billing.txtUnlimited",
        defaultUsageFallback: "Unlimited",
      },
    ];
  }, [
    translation,
    curtLang,
    chatFreeUnits,
    chatUnitPrice,
    unitWord,
    formattedFreeStorage,
    storageUnitPrice,
  ]);

  const paidFeatureDefs: FeatureRowDef[] = useMemo(() => {
    return [
      {
        key: "premium_usernames",
        feature: translation(
          "account_billing.featPremiumUsernamesTitle",
          "Premium Usernames",
        ),
        featureDescription: translation(
          "account_billing.featPremiumUsernamesDesc",
          "Claim custom exclusive unique handles for your accounts",
        ),
        format: (val) => (val !== undefined ? String(val) : "0"),
        isPaidOnly: true,
      },
    ];
  }, [translation]);

  const resolveFeatures = (defs: FeatureRowDef[]): FeatureRowRendered[] => {
    return defs.map((def) => {
      let resolvedUsage: string | number = def.defaultUsageKey
        ? translation(
            def.defaultUsageKey,
            def.defaultUsageFallback ?? "Unlimited",
          )
        : "0";

      if (def.key && usageData && usageData[def.key] !== undefined) {
        const rawVal = usageData[def.key];
        resolvedUsage = def.format
          ? def.format(rawVal, usageData, translation)
          : String(rawVal);
      }

      return {
        key: def.key,
        feature: def.feature,
        featureDescription: def.featureDescription,
        usage: resolvedUsage,
        isPaidOnly: def.isPaidOnly,
      };
    });
  };

  const freeFeatures = useMemo(
    () => resolveFeatures(freeFeatureDefs),
    [freeFeatureDefs, usageData, translation],
  );
  const paidFeatures = useMemo(
    () => resolveFeatures(paidFeatureDefs),
    [paidFeatureDefs, usageData, translation],
  );
  const allCombinedFeatures = useMemo(
    () => [...freeFeatures, ...paidFeatures],
    [freeFeatures, paidFeatures],
  );

  // Dynamic localized Billed Items & Activity Details
  const chatItemTitle = translation(
    "account_billing.itemChatAccounts",
    `Chat Accounts (${chatFreeUnits} free)`,
  ).replace(/{count}/g, String(chatFreeUnits));

  const chatItemDetail = translation(
    "account_billing.detailChatAccounts",
    `${chatUsage} used (${chatBillableUnits} billable) • $${chatUnitPrice.toFixed(4)}${rateUnitSuffix}`,
  )
    .replace(/{usage}/g, String(chatUsage))
    .replace(/{billable}/g, String(chatBillableUnits))
    .replace(/{rate}/g, chatUnitPrice.toFixed(4))
    .replace(/{unit}/g, rateUnitSuffix);

  const storageItemTitle = translation(
    "account_billing.itemStorageOverage",
    `Storage Overage (${formattedFreeStorage} free)`,
  ).replace(/{size}/g, formattedFreeStorage);

  const storageItemDetail = translation(
    "account_billing.detailStorageOverage",
    `${formattedUsageStorage} used • $${storageUnitPrice.toFixed(4)}/GB-${unitWord}`,
  )
    .replace(/{usage}/g, formattedUsageStorage)
    .replace(/{rate}/g, storageUnitPrice.toFixed(4))
    .replace(/{unit}/g, unitWord);

  const billingItems = [
    {
      item: chatItemTitle,
      detail: chatItemDetail,
      cost: chatEstimatedCost,
    },
    {
      item: storageItemTitle,
      detail: storageItemDetail,
      cost: storageEstimatedCost,
    },
  ];

  const handleUpgradeToPaid = async () => {
    setUpgrading(true);
    const success = await updateMembershipStatusApi(true);
    if (success) {
      if (typeof setUserDetails === "function") {
        setUserDetails({
          ...userDetails,
          is_paid: true,
        });
      }
    }
    setUpgrading(false);
  };

  const handlePayBill = () => {
    setPayingBill(true);
    setTimeout(() => {
      setPayingBill(false);
      notifications.show({
        title: "",
        message: translation(
          "account_billing.notiPaymentSuccess",
          "Payment processed successfully.",
        ),
        color: "green",
      });
    }, 1200);
  };

  const renderTable = (rows: FeatureRowRendered[], showLockBanner = false) => (
    <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
      <Table
        striped
        highlightOnHover
        withTableBorder={false}
        verticalSpacing="sm"
      >
        <Table.Thead bg="gray.0">
          {!showLockBanner && (
            <Table.Tr>
              <Table.Th style={{ width: "65%" }}>
                {translation(
                  "account_billing.thFeatureDescription",
                  "Feature Description",
                )}
              </Table.Th>
              <Table.Th style={{ width: "35%", textAlign: "right" }}>
                {translation("account_billing.thCurrentUsage", "Current Usage")}
              </Table.Th>
            </Table.Tr>
          )}
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, index) => {
            const isLocked = Boolean(row.isPaidOnly && !isPaid);

            return (
              <Table.Tr key={index}>
                <Table.Td>
                  <Group gap="sm" align="flex-start" wrap="nowrap">
                    <ThemeIcon
                      size={22}
                      radius="xl"
                      variant="light"
                      color={isLocked ? "red" : "teal"}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    >
                      {isLocked ? (
                        <IconLock size={13} />
                      ) : (
                        <IconCheck size={13} />
                      )}
                    </ThemeIcon>

                    <Stack gap={1}>
                      <Text size="sm" fw={row.isPaidOnly ? 600 : 500}>
                        {row.feature}
                      </Text>
                      {row.featureDescription && (
                        <Text size="xs" c="dimmed" lh={1.35}>
                          {row.featureDescription}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Table.Td>

                <Table.Td
                  style={{ textAlign: "right", verticalAlign: "middle" }}
                >
                  {isLocked ? (
                    <Button
                      component="a"
                      href={`mailto:support@messenger.com?subject=Inquiry%20Regarding%20${encodeURIComponent(
                        row.feature,
                      )}&body=Hello%20Team%2C%0A%0AI%20am%20interested%20in%20unlocking%20${encodeURIComponent(
                        row.feature,
                      )}%20for%20my%20Hub.`}
                      variant="light"
                      color="gray"
                      size="compact-xs"
                      radius="xl"
                      leftSection={<IconMail size={13} />}
                      style={{ fontWeight: 500 }}
                    >
                      {translation(
                        "account_billing.btnContactUs",
                        "Contact us",
                      )}
                    </Button>
                  ) : (
                    <Text
                      size="sm"
                      fw={600}
                      c={
                        String(row.usage).includes(
                          translation(
                            "account_billing.txtUnlimited",
                            "Unlimited",
                          ),
                        )
                          ? "dimmed"
                          : "dark"
                      }
                    >
                      {row.usage}
                    </Text>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      {showLockBanner && !isPaid && (
        <Paper p="md" bg="blue.0" style={{ borderTop: "1px solid #d0ebff" }}>
          <Group justify="flex-end">
            <Button
              size="sm"
              variant="filled"
              color="indigo"
              radius="md"
              leftSection={<IconCrown size={15} />}
              loading={upgrading}
              onClick={handleUpgradeToPaid}
            >
              {translation(
                "account_billing.btnUpgradeToPaid",
                "Upgrade to Paid",
              )}
            </Button>
          </Group>
        </Paper>
      )}
    </Paper>
  );

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        padding: "24px 16px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <Container size="lg">
        {/* Top Header */}
        <Group justify="flex-start" align="center" gap="md" mb="lg">
          <Tooltip
            label={translation("account_billing.tooltipGoBack", "Go back")}
            position="right"
            withArrow
          >
            <ActionIcon
              variant="default"
              size="lg"
              radius="md"
              onClick={() => navigate(-1)}
              aria-label={translation(
                "account_billing.tooltipGoBack",
                "Go back",
              )}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Tooltip>

          <Group gap="sm" align="center">
            <img src={logo} alt="Ukrchat logo" className={classes.brandLogo} />
            <Text className={classes.brand}>Ukrchat.com</Text>
          </Group>
        </Group>

        {/* Page Title */}
        <Stack gap={4} mb="xl">
          <Title order={2} style={{ letterSpacing: "-0.5px" }}>
            {translation(
              "account_billing.titlePage",
              "Available Feature List & Usage Table",
            )}
          </Title>
          <Text size="sm" c="dimmed">
            {isPaid
              ? translation(
                  "account_billing.subtitlePaid",
                  "All features unlocked. Track your live quotas, limits, and monthly utility expenses.",
                )
              : translation(
                  "account_billing.subtitleFree",
                  "Review your active free allowances or upgrade to unlock advanced hierarchy tools.",
                )}
          </Text>
        </Stack>

        {loadingData ? (
          <Paper withBorder radius="md" p="xl" bg="white">
            <Group justify="center" gap="sm">
              <Loader size="sm" color="indigo" />
              <Text size="sm" c="dimmed">
                {translation(
                  "account_billing.loadingBillingData",
                  "Loading usage & billing estimates...",
                )}
              </Text>
            </Group>
          </Paper>
        ) : (
          <Accordion
            variant="separated"
            radius="md"
            defaultValue="features"
            styles={{
              item: { backgroundColor: "#ffffff", border: "1px solid #e9ecef" },
              control: { padding: "16px 20px" },
              content: { padding: "8px 20px 20px 20px" },
            }}
          >
            {/* Section 1: Features & Usage */}
            <Accordion.Item value="features">
              <Accordion.Control
                icon={
                  <ThemeIcon
                    variant="light"
                    color="indigo"
                    radius="md"
                    size={32}
                  >
                    <IconTable size={18} />
                  </ThemeIcon>
                }
              >
                <div>
                  <Text fw={600} size="md">
                    {translation(
                      "account_billing.accordionFeaturesTitle",
                      "Features & Usage",
                    )}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {translation(
                      "account_billing.accordionFeaturesDesc",
                      "Detailed quota tracking, limits, and active features",
                    )}
                  </Text>
                </div>
              </Accordion.Control>

              <Accordion.Panel>
                {isPaid ? (
                  <Stack gap="md">
                    <Text fw={600} size="sm" c="dimmed" tt="uppercase">
                      {translation(
                        "account_billing.txtActiveSubAllowances",
                        "Active Subscription Allowances",
                      )}
                    </Text>
                    {renderTable(allCombinedFeatures)}
                  </Stack>
                ) : (
                  <Stack gap="xl">
                    <Stack gap="xs">{renderTable(freeFeatures)}</Stack>
                    <Stack gap="xs">
                      <Text fw={700} size="sm" c="red.7" tt="uppercase">
                        {translation(
                          "account_billing.txtPaidFeaturesNotice",
                          "Paid Features — Unlock by switching to Paid Membership",
                        )}
                      </Text>
                      {renderTable(paidFeatures, true)}
                    </Stack>
                  </Stack>
                )}
              </Accordion.Panel>
            </Accordion.Item>

            {/* Section 2: Billing & Invoices */}
            <Accordion.Item value="billing">
              <Accordion.Control
                icon={
                  <ThemeIcon variant="light" color="teal" radius="md" size={32}>
                    <IconCreditCard size={18} />
                  </ThemeIcon>
                }
              >
                <div>
                  <Text fw={600} size="md">
                    {translation(
                      "account_billing.accordionBillingTitle",
                      "Billing & Invoices",
                    )}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {translation(
                      "account_billing.accordionBillingDesc",
                      "Monthly charges, variable utility usage, and payment checkout",
                    )}
                  </Text>
                </div>
              </Accordion.Control>

              <Accordion.Panel>
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  {/* Daily Utility Breakdown */}
                  <div style={{ gridColumn: "span 2" }}>
                    <Paper
                      withBorder
                      radius="md"
                      p="md"
                      bg="white"
                      style={{ position: "relative" }}
                    >
                      {loadingPeriod && (
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

                      <Group
                        justify="space-between"
                        align="center"
                        mb="sm"
                        wrap="nowrap"
                      >
                        <Title order={5}>
                          {translation(
                            "account_billing.titleDailyBreakdown",
                            "Daily Utility Breakdown",
                          )}
                        </Title>

                        {accruedFrom && accruedThrough && (
                          <Badge
                            size="sm"
                            variant="light"
                            color="gray"
                            radius="sm"
                            leftSection={<IconCalendar size={12} />}
                            styles={{
                              root: { textTransform: "none", fontWeight: 500 },
                            }}
                          >
                            {accruedFrom} — {accruedThrough}
                          </Badge>
                        )}
                      </Group>

                      <Table verticalSpacing="sm">
                        <Table.Thead bg="gray.0">
                          <Table.Tr>
                            <Table.Th>
                              {translation(
                                "account_billing.thBilledItem",
                                "Billed Item",
                              )}
                            </Table.Th>
                            <Table.Th>
                              {translation(
                                "account_billing.thActivityRate",
                                "Activity / Rate",
                              )}
                            </Table.Th>
                            <Table.Th style={{ textAlign: "right" }}>
                              {translation(
                                "account_billing.thCurrentCost",
                                "Current Cost ($)",
                              )}
                            </Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {billingItems.map((item, idx) => (
                            <Table.Tr key={idx}>
                              <Table.Td fw={500}>{item.item}</Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed">
                                  {item.detail}
                                </Text>
                              </Table.Td>
                              <Table.Td style={{ textAlign: "right" }} fw={600}>
                                ${item.cost.toFixed(2)}
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Paper>
                  </div>

                  {/* Invoice Summary Card */}
                  <Card withBorder radius="md" p="lg" bg="white">
                    <Stack gap="md">
                      <Group
                        justify="space-between"
                        align="center"
                        wrap="nowrap"
                      >
                        <Text fw={600} size="xs" c="dimmed" tt="uppercase">
                          {translation(
                            "account_billing.lblBillingCycle",
                            "Billing Cycle",
                          )}
                        </Text>
                        <Select
                          size="xs"
                          w={160}
                          data={billingPeriodOptions}
                          value={selectedPeriod}
                          onChange={handlePeriodChange}
                          leftSection={<IconCalendar size={13} />}
                          allowDeselect={false}
                          styles={{
                            input: {
                              fontWeight: 600,
                              fontSize: "12px",
                            },
                          }}
                        />
                      </Group>

                      <Divider />

                      <Group
                        justify="space-between"
                        align="flex-end"
                        wrap="wrap"
                      >
                        <Stack gap={2}>
                          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                            {translation(
                              "account_billing.txtCurrentAccruedCost",
                              "Current Accrued Cost",
                            )}
                          </Text>
                          <Title order={2}>
                            ${totalEstimatedCost.toFixed(2)}
                          </Title>
                        </Stack>

                        {!isInvoiceGenerated && (
                          <Badge
                            size="sm"
                            color="gray"
                            variant="light"
                            radius="sm"
                            leftSection={<IconAlertCircle size={12} />}
                          >
                            {translation(
                              "account_billing.txtInvoiceNotGenerated",
                              "Invoice not generated yet",
                            )}
                          </Badge>
                        )}
                      </Group>

                      {isInvoiceGenerated && (
                        <Stack gap="xs" mt="xs">
                          <Button
                            fullWidth
                            color="indigo"
                            size="md"
                            radius="md"
                            leftSection={<IconWallet size={16} />}
                            loading={payingBill}
                            onClick={handlePayBill}
                          >
                            {translation(
                              "account_billing.btnPayCurrentBill",
                              "Pay Current Bill",
                            )}
                          </Button>

                          <Button
                            fullWidth
                            variant="subtle"
                            color="gray"
                            size="xs"
                            leftSection={<IconDownload size={14} />}
                            onClick={() =>
                              notifications.show({
                                title: "",
                                message: translation(
                                  "account_billing.notiInvoiceDownloadStarted",
                                  "Invoice download started.",
                                ),
                                color: "blue",
                              })
                            }
                          >
                            {translation(
                              "account_billing.btnDownloadPdfSummary",
                              "Download PDF Summary",
                            )}
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        )}
      </Container>
    </div>
  );
}
