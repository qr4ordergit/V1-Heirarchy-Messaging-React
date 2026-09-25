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

export interface FeatureRowDef {
  key?: string;
  feature: string;
  featureDescription?: string;
  defaultUsage?: string;
  format?: (val: any, rawData?: UsageData) => string | number;
  isPaidOnly?: boolean;
}

export interface FeatureRowRendered extends FeatureRowDef {
  usage: string | number;
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
      feature: "Chat Accounts",
      featureDescription:
        "First 5 accounts are free (Beyond 5 free accounts, $1 per account per month)",
      format: (val) => (val !== undefined ? String(val) : "0"),
    },
    {
      key: "storage_bytes",
      feature: "Storage",
      featureDescription:
        "Up to 5GB storage free (Beyond 5GB, $0.025 per GB per month)",
      format: (val) => formatBytes(val?.total_bytes ?? 0),
    },
    {
      key: "cloud_cost",
      feature: "Cloud computing cost",
      featureDescription: "Will be based on your actual daily usage",
      defaultUsage: "Currently free",
    },
    {
      key: "bulk_account_creation",
      feature: "Bulk account creation",
      defaultUsage: "Unlimited",
    },
    {
      key: "hierarchical_access",
      feature: "Hierarchical Account Access",
      defaultUsage: "Unlimited",
    },
    {
      key: "one_on_one_chat",
      feature: "One on One Chat - (Encrypted)",
      defaultUsage: "Unlimited",
    },
    {
      key: "group_chats",
      feature: "Group Chats - (Encrypted)",
      defaultUsage: "Unlimited",
    },
    {
      key: "double_encryption",
      feature: "Double Encryption with own password",
      defaultUsage: "Unlimited",
    },
    {
      key: "scheduled_messages",
      feature: "Scheduled Messages",
      defaultUsage: "Unlimited",
    },
    {
      key: "disappearing_messages",
      feature: "Disappearing Messages",
      defaultUsage: "Unlimited",
    },
    {
      key: "account_tags",
      feature: "Account & Group Tags",
      featureDescription: "Convenient message filtering across your chats",
      format: (val) => (val !== undefined ? `${val} created` : "Unlimited"),
      defaultUsage: "Unlimited",
    },
    {
      key: "export_chats",
      feature: "Export/Download Chats with Media",
      defaultUsage: "Unlimited",
    },
  ];

  const paidFeatureDefs: FeatureRowDef[] = [
    {
      key: "premium_usernames",
      feature: "Premium Usernames",
      featureDescription:
        "Claim custom exclusive unique handles for your accounts",
      format: (val) => (val !== undefined ? String(val) : "0"),
      isPaidOnly: true,
    },
  ];

  const resolveFeatures = (defs: FeatureRowDef[]): FeatureRowRendered[] => {
    return defs.map((def) => {
      let resolvedUsage = def.defaultUsage ?? "0";

      if (def.key && usageData && usageData[def.key] !== undefined) {
        const rawVal = usageData[def.key];
        resolvedUsage = def.format
          ? String(def.format(rawVal, usageData))
          : String(rawVal);
      }

      return {
        ...def,
        usage: resolvedUsage,
      };
    });
  };

  const freeFeatures = useMemo(
    () => resolveFeatures(freeFeatureDefs),
    [usageData],
  );
  const paidFeatures = useMemo(
    () => resolveFeatures(paidFeatureDefs),
    [usageData],
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

  const storageUsageBytes = storageEst?.usage_bytes ?? 0;
  const storageFreeBytes = storageEst?.free_bytes ?? 5368709120;
  const storageUnitPrice = storageEst?.unit_price ?? 0.025;
  const storageEstimatedCost = storageEst?.estimated_cost ?? 0.0;

  const totalEstimatedCost = estimateData?.total_estimated_cost ?? 0.0;

  const billingItems = [
    {
      item: `Chat Accounts (> ${chatFreeUnits} free)`,
      detail: `${chatUsage} used (${chatAccountEst?.billable_units ?? 0} billable) • $${chatUnitPrice.toFixed(2)}/acct`,
      cost: chatEstimatedCost,
    },
    {
      item: `Storage Overage (> ${formatBytes(storageFreeBytes)} free)`,
      detail: `${formatBytes(storageUsageBytes)} used • $${storageUnitPrice.toFixed(3)}/GB`,
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
        message: "Payment processed successfully.",
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
              <Table.Th style={{ width: "65%" }}>Feature Description</Table.Th>
              <Table.Th style={{ width: "35%", textAlign: "right" }}>
                Current Usage
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
                      Contact us
                    </Button>
                  ) : (
                    <Text
                      size="sm"
                      fw={600}
                      c={
                        String(row.usage).includes("Unlimited")
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
              Upgrade to Paid
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
        <Group justify="space-between" align="center" mb="lg">
          <Tooltip label="Go back" position="right" withArrow>
            <ActionIcon
              variant="default"
              size="lg"
              radius="md"
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Tooltip>

          <Group gap="xs">
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Membership:
            </Text>
            {isPaid ? (
              <Badge
                size="lg"
                color="indigo"
                variant="filled"
                radius="sm"
                leftSection={<IconCrown size={14} />}
              >
                Paid Membership
              </Badge>
            ) : (
              <Badge
                size="lg"
                color="gray"
                variant="light"
                radius="sm"
                leftSection={<IconSparkles size={14} />}
              >
                Free Membership
              </Badge>
            )}
          </Group>
        </Group>

        <Stack gap={4} mb="xl">
          <Title order={2} style={{ letterSpacing: "-0.5px" }}>
            Available Feature List & Usage Table
          </Title>
          <Text size="sm" c="dimmed">
            {isPaid
              ? "All features unlocked. Track your live quotas, limits, and monthly utility expenses."
              : "Review your active free allowances or upgrade to unlock advanced hierarchy tools."}
          </Text>
        </Stack>

        {loadingData ? (
          <Paper withBorder radius="md" p="xl" bg="white">
            <Group justify="center" gap="sm">
              <Loader size="sm" color="indigo" />
              <Text size="sm" c="dimmed">
                Loading usage & billing estimates...
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
                    Features & Usage
                  </Text>
                  <Text size="xs" c="dimmed">
                    Detailed quota tracking, limits, and active features
                  </Text>
                </div>
              </Accordion.Control>

              <Accordion.Panel>
                {isPaid ? (
                  <Stack gap="md">
                    <Text fw={600} size="sm" c="dimmed" tt="uppercase">
                      Active Subscription Allowances
                    </Text>
                    {renderTable(allCombinedFeatures)}
                  </Stack>
                ) : (
                  <Stack gap="xl">
                    <Stack gap="xs">{renderTable(freeFeatures)}</Stack>
                    <Stack gap="xs">
                      <Text fw={700} size="sm" c="red.7" tt="uppercase">
                        Paid Features — Unlock by switching to Paid Membership
                      </Text>
                      {renderTable(paidFeatures, true)}
                    </Stack>
                  </Stack>
                )}
              </Accordion.Panel>
            </Accordion.Item>

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
                    Billing & Invoices
                  </Text>
                  <Text size="xs" c="dimmed">
                    Monthly charges, variable utility usage, and payment
                    checkout
                  </Text>
                </div>
              </Accordion.Control>

              <Accordion.Panel>
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  <div style={{ gridColumn: "span 2" }}>
                    <Paper withBorder radius="md" p="md" bg="white">
                      <Title order={5} mb="sm">
                        Daily Utility Breakdown
                      </Title>
                      <Table verticalSpacing="sm">
                        <Table.Thead bg="gray.0">
                          <Table.Tr>
                            <Table.Th>Billed Item</Table.Th>
                            <Table.Th>Activity / Rate</Table.Th>
                            <Table.Th style={{ textAlign: "right" }}>
                              Current Cost ($)
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
                          Invoice Status
                        </Text>
                        <Badge
                          color={totalEstimatedCost > 0 ? "orange" : "green"}
                          variant="light"
                        >
                          {totalEstimatedCost > 0 ? "Due" : "No Charges Due"}
                        </Badge>
                      </Group>

                      <Divider />

                      <Stack gap={2}>
                        <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                          Current Accrued Cost
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
                            Pay Current Bill
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
                                message: "Invoice download started.",
                                color: "blue",
                              })
                            }
                          >
                            Download PDF Summary
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
