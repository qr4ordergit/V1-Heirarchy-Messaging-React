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
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconCreditCard,
  IconCrown,
  IconDownload,
  IconLock,
  IconMail,
  IconSparkles,
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

export interface FeatureRowDef {
  key?: string;
  featureKey: string;
  featureDefault: string;
  featureDescKey?: string;
  featureDescDefault?: string;
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

const formatBytes = (bytes: number = 0): string => {
  if (!bytes || bytes <= 0) return "0 MB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function UsageBilling() {
  const navigate = useNavigate();
  const { translation } = useTranslation();
  const userDetails = useAuthStore((state) => state.userDetails);
  const setUserDetails = useAuthStore((state) => (state as any).setUserDetails);
  const isPaid = Boolean((userDetails as any)?.is_paid);

  const [payingBill, setPayingBill] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [estimateData, setEstimateData] = useState<EstimateData | null>(null);
  const [canPayAndDownload, setCanPayAndDownload] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingData(true);
      const [usageRes, estimateRes] = await Promise.all([
        getUsageApi(),
        getEstimateApi(),
      ]);

      if (mounted) {
        if (usageRes) setUsageData(usageRes);
        if (estimateRes?.estimate) setEstimateData(estimateRes.estimate);
        setCanPayAndDownload(Boolean(estimateRes?.invoiceGenerated));
        setLoadingData(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const freeFeatureDefs: FeatureRowDef[] = [
    {
      key: "chat_accounts",
      featureKey: "billing.featChatAccountsTitle",
      featureDefault: "Chat Accounts",
      featureDescKey: "billing.featChatAccountsDesc",
      featureDescDefault:
        "First 5 accounts are free (Beyond 5 free accounts, $1 per account per month)",
      format: (val) => (val !== undefined ? String(val) : "0"),
    },
    {
      key: "storage_bytes",
      featureKey: "billing.featStorageTitle",
      featureDefault: "Storage",
      featureDescKey: "billing.featStorageDesc",
      featureDescDefault:
        "Up to 5GB storage free (Beyond 5GB, $0.025 per GB per month)",
      format: (val) => formatBytes(val?.total_bytes ?? 0),
    },
    {
      key: "cloud_cost",
      featureKey: "billing.featCloudCostTitle",
      featureDefault: "Cloud computing cost",
      featureDescKey: "billing.featCloudCostDesc",
      featureDescDefault: "Will be based on your actual daily usage",
      defaultUsageKey: "billing.txtCurrentlyFree",
      defaultUsageFallback: "Currently free",
    },
    {
      key: "bulk_account_creation",
      featureKey: "billing.featBulkAccountsTitle",
      featureDefault: "Bulk account creation",
      defaultUsageKey: "billing.txtUnlimited",
      defaultUsageFallback: "Unlimited",
    },
    {
      key: "hierarchical_access",
      featureKey: "billing.featHierarchicalAccessTitle",
      featureDefault: "Hierarchical Account Access",
      defaultUsageKey: "billing.txtUnlimited",
      defaultUsageFallback: "Unlimited",
    },
    {
      key: "one_on_one_chat",
      featureKey: "billing.featOneOnOneTitle",
      featureDefault: "One on One Chat - (Encrypted)",
      defaultUsageKey: "billing.txtUnlimited",
      defaultUsageFallback: "Unlimited",
    },
    {
      key: "group_chats",
      featureKey: "billing.featGroupChatsTitle",
      featureDefault: "Group Chats - (Encrypted)",
      defaultUsageKey: "billing.txtUnlimited",
      defaultUsageFallback: "Unlimited",
    },
    {
      key: "double_encryption",
      featureKey: "billing.featDoubleEncryptionTitle",
      featureDefault: "Double Encryption with own password",
      defaultUsageKey: "billing.txtUnlimited",
      defaultUsageFallback: "Unlimited",
    },
    {
      key: "scheduled_messages",
      featureKey: "billing.featScheduledMsgsTitle",
      featureDefault: "Scheduled Messages",
      defaultUsageKey: "billing.txtUnlimited",
      defaultUsageFallback: "Unlimited",
    },
    {
      key: "disappearing_messages",
      featureKey: "billing.featDisappearingMsgsTitle",
      featureDefault: "Disappearing Messages",
      defaultUsageKey: "billing.txtUnlimited",
      defaultUsageFallback: "Unlimited",
    },
    {
      key: "account_tags",
      featureKey: "billing.featAccountTagsTitle",
      featureDefault: "Account & Group Tags",
      featureDescKey: "billing.featAccountTagsDesc",
      featureDescDefault: "Convenient message filtering across your chats",
      format: (val, _, t) =>
        val !== undefined
          ? `${val} ${t("billing.txtCreatedSuffix", "created")}`
          : t("billing.txtUnlimited", "Unlimited"),
      defaultUsageKey: "billing.txtUnlimited",
      defaultUsageFallback: "Unlimited",
    },
    {
      key: "export_chats",
      featureKey: "billing.featExportChatsTitle",
      featureDefault: "Export/Download Chats with Media",
      defaultUsageKey: "billing.txtUnlimited",
      defaultUsageFallback: "Unlimited",
    },
  ];

  const paidFeatureDefs: FeatureRowDef[] = [
    {
      key: "premium_usernames",
      featureKey: "billing.featPremiumUsernamesTitle",
      featureDefault: "Premium Usernames",
      featureDescKey: "billing.featPremiumUsernamesDesc",
      featureDescDefault:
        "Claim custom exclusive unique handles for your accounts",
      format: (val) => (val !== undefined ? String(val) : "0"),
      isPaidOnly: true,
    },
  ];

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
        feature: translation(def.featureKey, def.featureDefault),
        featureDescription: def.featureDescKey
          ? translation(def.featureDescKey, def.featureDescDefault ?? "")
          : undefined,
        usage: resolvedUsage,
        isPaidOnly: def.isPaidOnly,
      };
    });
  };

  const freeFeatures = useMemo(
    () => resolveFeatures(freeFeatureDefs),
    [usageData, translation],
  );
  const paidFeatures = useMemo(
    () => resolveFeatures(paidFeatureDefs),
    [usageData, translation],
  );
  const allCombinedFeatures = useMemo(
    () => [...freeFeatures, ...paidFeatures],
    [freeFeatures, paidFeatures],
  );

  const chatAccountEst = estimateData?.chat_accounts;
  const storageEst = estimateData?.storage;

  const chatUsage = chatAccountEst?.usage ?? 0;
  const chatFreeUnits = chatAccountEst?.free_units ?? 5;
  const chatUnitPrice = chatAccountEst?.unit_price ?? 1.0;
  const chatEstimatedCost = chatAccountEst?.estimated_cost ?? 0.0;
  const chatBillableUnits = chatAccountEst?.billable_units ?? 0;

  const storageUsageBytes = storageEst?.usage_bytes ?? 0;
  const storageFreeBytes = storageEst?.free_bytes ?? 5368709120;
  const storageUnitPrice = storageEst?.unit_price ?? 0.025;
  const storageEstimatedCost = storageEst?.estimated_cost ?? 0.0;

  const totalEstimatedCost = estimateData?.total_estimated_cost ?? 0.0;

  const chatItemTitle = translation(
    "billing.itemChatAccounts",
    `Chat Accounts (> ${chatFreeUnits} free)`,
  ).replace("{count}", String(chatFreeUnits));

  const chatItemDetail = translation(
    "billing.detailChatAccounts",
    `${chatUsage} used (${chatBillableUnits} billable) • $${chatUnitPrice.toFixed(2)}/acct`,
  )
    .replace("{usage}", String(chatUsage))
    .replace("{billable}", String(chatBillableUnits))
    .replace("{rate}", chatUnitPrice.toFixed(2));

  const storageItemTitle = translation(
    "billing.itemStorageOverage",
    `Storage Overage (> ${formatBytes(storageFreeBytes)} free)`,
  ).replace("{size}", formatBytes(storageFreeBytes));

  const storageItemDetail = translation(
    "billing.detailStorageOverage",
    `${formatBytes(storageUsageBytes)} used • $${storageUnitPrice.toFixed(3)}/GB`,
  )
    .replace("{usage}", formatBytes(storageUsageBytes))
    .replace("{rate}", storageUnitPrice.toFixed(3));

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
          "billing.notiPaymentSuccess",
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
                  "billing.thFeatureDescription",
                  "Feature Description",
                )}
              </Table.Th>
              <Table.Th style={{ width: "35%", textAlign: "right" }}>
                {translation("billing.thCurrentUsage", "Current Usage")}
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
                      {translation("billing.btnContactUs", "Contact us")}
                    </Button>
                  ) : (
                    <Text
                      size="sm"
                      fw={600}
                      c={
                        String(row.usage).includes(
                          translation("billing.txtUnlimited", "Unlimited"),
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
              {translation("billing.btnUpgradeToPaid", "Upgrade to Paid")}
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
        {/* Header navigation & membership badge */}
        <Group justify="space-between" align="center" mb="lg">
          <Tooltip
            label={translation("billing.tooltipGoBack", "Go back")}
            position="right"
            withArrow
          >
            <ActionIcon
              variant="default"
              size="lg"
              radius="md"
              onClick={() => navigate(-1)}
              aria-label={translation("billing.tooltipGoBack", "Go back")}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Tooltip>

          <Group gap="xs">
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              {translation("billing.txtMembership", "Membership:")}
            </Text>
            {isPaid ? (
              <Badge
                size="lg"
                color="indigo"
                variant="filled"
                radius="sm"
                leftSection={<IconCrown size={14} />}
              >
                {translation("billing.badgePaidMembership", "Paid Membership")}
              </Badge>
            ) : (
              <Badge
                size="lg"
                color="gray"
                variant="light"
                radius="sm"
                leftSection={<IconSparkles size={14} />}
              >
                {translation("billing.badgeFreeMembership", "Free Membership")}
              </Badge>
            )}
          </Group>
        </Group>

        {/* Page Title */}
        <Stack gap={4} mb="xl">
          <Title order={2} style={{ letterSpacing: "-0.5px" }}>
            {translation(
              "billing.titlePage",
              "Available Feature List & Usage Table",
            )}
          </Title>
          <Text size="sm" c="dimmed">
            {isPaid
              ? translation(
                  "billing.subtitlePaid",
                  "All features unlocked. Track your live quotas, limits, and monthly utility expenses.",
                )
              : translation(
                  "billing.subtitleFree",
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
                  "billing.loadingBillingData",
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
                      "billing.accordionFeaturesTitle",
                      "Features & Usage",
                    )}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {translation(
                      "billing.accordionFeaturesDesc",
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
                        "billing.txtActiveSubAllowances",
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
                          "billing.txtPaidFeaturesNotice",
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
                      "billing.accordionBillingTitle",
                      "Billing & Invoices",
                    )}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {translation(
                      "billing.accordionBillingDesc",
                      "Monthly charges, variable utility usage, and payment checkout",
                    )}
                  </Text>
                </div>
              </Accordion.Control>

              <Accordion.Panel>
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  {/* Daily Utility Breakdown */}
                  <div style={{ gridColumn: "span 2" }}>
                    <Paper withBorder radius="md" p="md" bg="white">
                      <Title order={5} mb="sm">
                        {translation(
                          "billing.titleDailyBreakdown",
                          "Daily Utility Breakdown",
                        )}
                      </Title>
                      <Table verticalSpacing="sm">
                        <Table.Thead bg="gray.0">
                          <Table.Tr>
                            <Table.Th>
                              {translation(
                                "billing.thBilledItem",
                                "Billed Item",
                              )}
                            </Table.Th>
                            <Table.Th>
                              {translation(
                                "billing.thActivityRate",
                                "Activity / Rate",
                              )}
                            </Table.Th>
                            <Table.Th style={{ textAlign: "right" }}>
                              {translation(
                                "billing.thCurrentCost",
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
                      <Group justify="space-between">
                        <Text fw={600} size="sm" c="dimmed">
                          {translation(
                            "billing.txtInvoiceStatus",
                            "Invoice Status",
                          )}
                        </Text>
                        <Badge
                          color={totalEstimatedCost > 0 ? "orange" : "green"}
                          variant="light"
                        >
                          {totalEstimatedCost > 0
                            ? translation("billing.badgeDue", "Due")
                            : translation(
                                "billing.badgeNoChargesDue",
                                "No Charges Due",
                              )}
                        </Badge>
                      </Group>

                      <Divider />

                      {/* Current Accrued Cost */}
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                          {translation(
                            "billing.txtCurrentAccruedCost",
                            "Current Accrued Cost",
                          )}
                        </Text>
                        <Title order={2}>
                          ${totalEstimatedCost.toFixed(2)}
                        </Title>
                      </Stack>

                      {/* Action buttons conditionally rendered based on status */}
                      {canPayAndDownload ? (
                        <>
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
                              "billing.btnPayCurrentBill",
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
                                  "billing.notiInvoiceDownloadStarted",
                                  "Invoice download started.",
                                ),
                                color: "blue",
                              })
                            }
                          >
                            {translation(
                              "billing.btnDownloadPdfSummary",
                              "Download PDF Summary",
                            )}
                          </Button>
                        </>
                      ) : null}
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
