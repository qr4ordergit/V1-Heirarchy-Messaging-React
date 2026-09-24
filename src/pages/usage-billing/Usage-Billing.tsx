import { useState } from "react";
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
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useAuthStore } from "../../store/auth/auth.store";
import { updateMembershipStatusApi } from "../../api/usageBillingApi";

export interface FeatureRow {
  key?: string;
  feature: string;
  featureDescription?: string;
  usage: string | number;
  isPaidOnly?: boolean;
}

export default function UsageBilling() {
  const navigate = useNavigate();
  const userDetails = useAuthStore((state) => state.userDetails);
  const setUserDetails = useAuthStore((state) => (state as any).setUserDetails);
  const isPaid = Boolean((userDetails as any)?.is_paid);

  const [payingBill, setPayingBill] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Mock API Response Container: Replace this object when your API is connected
  const apiUsageData = {
    chat_accounts_active: 1,
    storage_used: "20 MB",
    cloud_cost: "Currently free",
    premium_usernames_count: 1,
  };

  const freeFeatures: FeatureRow[] = [
    {
      key: "chat_accounts",
      feature: "Chat Accounts",
      featureDescription:
        "First 5 accounts are free (Beyond 5 free accounts, $1 per account per month)",
      usage: `${apiUsageData.chat_accounts_active}`,
    },
    {
      key: "storage",
      feature: "Storage",
      featureDescription:
        "Up to 5GB storage free (Beyond 5GB, $0.025 per GB per month)",
      usage: apiUsageData.storage_used,
    },
    {
      key: "cloud_cost",
      feature: "Cloud computing cost",
      featureDescription: "Will be based on your actual daily usage",
      usage: apiUsageData.cloud_cost,
    },
    { feature: "Bulk account creation", usage: "Unlimited" },
    { feature: "Hierarchical Account Access", usage: "Unlimited" },
    { feature: "One on One Chat - (Encrypted)", usage: "Unlimited" },
    { feature: "Group Chats - (Encrypted)", usage: "Unlimited" },
    { feature: "Double Encryption with own password", usage: "Unlimited" },
    { feature: "Scheduled Messages", usage: "Unlimited" },
    { feature: "Disappearing Messages", usage: "Unlimited" },
    {
      feature: "Account & Group Tags",
      featureDescription: "Convenient message filtering across your chats",
      usage: "Unlimited",
    },
    {
      feature: "Export/Download Chats with Media",
      usage: "Unlimited",
    },
  ];

  const paidFeatures: FeatureRow[] = [
    {
      key: "premium_usernames",
      feature: "Premium Usernames",
      usage: `${apiUsageData.premium_usernames_count}`,
      isPaidOnly: true,
    },
  ];

  const allCombinedFeatures: FeatureRow[] = [...freeFeatures, ...paidFeatures];

  // Billing calculation states
  const billingItems = [
    {
      item: "Chat Accounts (> 5 free)",
      detail: "0 extra accounts",
      currentAmount: 0.0,
      estimatedAmount: 0.0,
    },
    {
      item: "Storage Overage (> 5GB free)",
      detail: "20 MB used of 5 GB",
      currentAmount: 0.0,
      estimatedAmount: 0.0,
    },
  ];

  const currentTotal = billingItems.reduce(
    (acc, curr) => acc + curr.currentAmount,
    0,
  );
  const estimatedMonthEndTotal = billingItems.reduce(
    (acc, curr) => acc + curr.estimatedAmount,
    0,
  );

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

  const renderTable = (rows: FeatureRow[], showLockBanner = false) => (
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
            // Evaluates locked if it is a paid-only feature and user is not paid
            const isLocked = Boolean(row.isPaidOnly && !isPaid);

            return (
              <Table.Tr key={index}>
                {/* Feature Name & Subtitle */}
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

                {/* Usage / Contact Action */}
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
                      )}%20for%20my%20Hub.%20Please%20guide%20me%20with%20the%20details.`}
                      variant="light"
                      color="grey"
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

      {/* Upgrade Banner */}
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
        {/* Top Header */}
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

        {/* Title */}
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

        {/* Accordion Layout */}
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
          {/* Section 1: Features & Quotas */}
          <Accordion.Item value="features">
            <Accordion.Control
              icon={
                <ThemeIcon variant="light" color="indigo" radius="md" size={32}>
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

          {/* Section 2: Billing & Projections */}
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
                  Monthly charges, variable utility usage, and payment checkout
                </Text>
              </div>
            </Accordion.Control>

            <Accordion.Panel>
              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                {/* Table Breakdown */}
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
                              ${item.currentAmount.toFixed(2)}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </div>

                {/* Invoice Status & Month-End Estimates */}
                <Card withBorder radius="md" p="lg" bg="white">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={600} size="sm" c="dimmed">
                        Invoice Status
                      </Text>
                      <Badge
                        color={currentTotal > 0 ? "orange" : "green"}
                        variant="light"
                      >
                        {currentTotal > 0 ? "Due" : "No Charges Due"}
                      </Badge>
                    </Group>

                    <Divider />

                    {/* Current Price */}
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                        Current Accrued Cost
                      </Text>
                      <Title order={2}>${currentTotal.toFixed(2)}</Title>
                    </Stack>

                    {/* Month-End Estimated Price */}
                    <Paper p="xs" bg="gray.0" radius="md" withBorder>
                      <Group justify="space-between" align="center">
                        <Group gap={6}>
                          <ThemeIcon
                            size={20}
                            color="indigo"
                            variant="light"
                            radius="xl"
                          >
                            <IconTrendingUp size={12} />
                          </ThemeIcon>
                          <Text size="xs" fw={500} c="dimmed">
                            Est. Month-End:
                          </Text>
                        </Group>
                        <Text size="sm" fw={700} c="indigo.8">
                          ${estimatedMonthEndTotal.toFixed(2)}
                        </Text>
                      </Group>
                    </Paper>

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
                  </Stack>
                </Card>
              </SimpleGrid>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Container>
    </div>
  );
}
