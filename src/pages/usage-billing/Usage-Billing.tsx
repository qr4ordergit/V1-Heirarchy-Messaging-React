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
  IconSparkles,
  IconTable,
  IconWallet,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useAuthStore } from "../../store/auth/auth.store";

interface FeatureRow {
  feature: string;
  usage: string;
  isPaidOnly?: boolean;
}

export default function Plans() {
  const navigate = useNavigate();
  const userDetails = useAuthStore((state) => state.userDetails);
  const isPaid = Boolean((userDetails as any)?.is_paid);

  const [payingBill, setPayingBill] = useState(false);

  const freeFeatures: FeatureRow[] = [
    {
      feature:
        "Chat Accounts: First 5 accounts are free. Then, $1 per account per month.",
      usage: "1 Active  •  2 Deactive",
    },
    {
      feature: "Storage: Up to 5GB storage free. Then, 0.001$ per KB",
      usage: "20 MB",
    },
    { feature: "Hierarchical Account Access", usage: "Unlimited" },
    { feature: "One on One Chat - (Encrypted)", usage: "Unlimited" },
    { feature: "Group Chats - (Encrypted)", usage: "Unlimited" },
    { feature: "Double Encryption within Group Chats", usage: "Unlimited" },
    { feature: "Scheduled Messages", usage: "Unlimited" },
    { feature: "Disappearing Messages", usage: "Unlimited" },
  ];

  const paidFeatures: FeatureRow[] = [
    {
      feature: "Bulk Account Creation - (0.5$ per Upload)",
      usage: isPaid ? "3 uploads this month" : "Locked",
      isPaidOnly: true,
    },
    {
      feature: "Premium Usernames",
      usage: isPaid ? "1" : "Locked",
      isPaidOnly: true,
    },
    {
      feature: "Account Tags $ 0.02 per tag",
      usage: isPaid ? "5" : "Locked",
      isPaidOnly: true,
    },
    {
      feature: "Group Tags $ 0.02 per tag",
      usage: isPaid ? "6" : "Locked",
      isPaidOnly: true,
    },
    {
      feature: "Export/Download Chats with Media (0.1$ per export)",
      usage: isPaid ? "2 downloads this month" : "Locked",
      isPaidOnly: true,
    },
  ];

  const allCombinedFeatures: FeatureRow[] = [...freeFeatures, ...paidFeatures];

  const billingItems = [
    {
      item: "Base Subscription",
      detail: isPaid ? "Paid Membership" : "Free Plan",
      amount: isPaid ? 9.99 : 0.0,
    },
    {
      item: "Chat Accounts (> 5 free)",
      detail: "0 extra accounts",
      amount: 0.0,
    },
    {
      item: "Storage Overage (> 5GB free)",
      detail: "20 MB used of 5 GB",
      amount: 0.0,
    },
    {
      item: "Bulk Uploads",
      detail: isPaid ? "3 uploads @ $0.50" : "0 uploads",
      amount: isPaid ? 1.5 : 0.0,
    },
    {
      item: "Tags (Account & Group)",
      detail: isPaid ? "11 tags @ $0.02" : "0 tags",
      amount: isPaid ? 0.22 : 0.0,
    },
    {
      item: "Chat Exports",
      detail: isPaid ? "2 downloads @ $0.10" : "0 downloads",
      amount: isPaid ? 0.2 : 0.0,
    },
  ];

  const totalBill = billingItems.reduce((acc, curr) => acc + curr.amount, 0);

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
          <Table.Tr>
            <Table.Th style={{ width: "65%" }}>Feature Description</Table.Th>
            <Table.Th style={{ width: "35%", textAlign: "right" }}>
              Current Usage
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, index) => {
            const isLocked = row.usage === "Locked";
            return (
              <Table.Tr key={index}>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    {isLocked ? (
                      <IconLock size={15} color="#fa5252" />
                    ) : (
                      <IconCheck size={15} color="#40c057" />
                    )}
                    <Text size="sm" fw={row.isPaidOnly ? 600 : 400}>
                      {row.feature}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  {isLocked ? (
                    <Badge color="red" variant="light" size="sm" radius="sm">
                      Locked
                    </Badge>
                  ) : (
                    <Text
                      size="sm"
                      fw={600}
                      c={row.usage.includes("Unlimited") ? "dimmed" : "dark"}
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
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Text fw={600} size="sm" c="blue.9">
                Unlock Premium & Bulk Operations
              </Text>
              <Text size="xs" c="blue.7">
                Switch to paid membership to access custom handles, tag
                indexing, and chat export utilities.
              </Text>
            </Stack>
            <Button
              size="xs"
              variant="filled"
              color="indigo"
              radius="md"
              leftSection={<IconCrown size={14} />}
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
        {/* Top Header Row */}
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

        {/* Page Title */}
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
          {/* Accordion Item 1: Features & Usage (Visible by Default) */}
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
                  <Stack gap="xs">
                    <Text fw={700} size="sm" c="dimmed" tt="uppercase">
                      Free Included Features
                    </Text>
                    {renderTable(freeFeatures)}
                  </Stack>

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

          {/* Accordion Item 2: Billing & Invoices */}
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
                <div style={{ gridColumn: "span 2" }}>
                  <Paper withBorder radius="md" p="md" bg="white">
                    <Title order={5} mb="sm">
                      Monthly Utility Breakdown
                    </Title>
                    <Table verticalSpacing="sm">
                      <Table.Thead bg="gray.0">
                        <Table.Tr>
                          <Table.Th>Billed Item</Table.Th>
                          <Table.Th>Activity / Rate</Table.Th>
                          <Table.Th style={{ textAlign: "right" }}>
                            Cost ($)
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
                              ${item.amount.toFixed(2)}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </div>

                <Card withBorder radius="md" p="lg" bg="white">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={600} size="sm" c="dimmed">
                        Invoice Status
                      </Text>
                      <Badge
                        color={totalBill > 0 ? "orange" : "green"}
                        variant="light"
                      >
                        {totalBill > 0 ? "Due" : "No Charges Due"}
                      </Badge>
                    </Group>

                    <Divider />

                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" tt="uppercase">
                        Current Total Accrued
                      </Text>
                      <Title order={2}>${totalBill.toFixed(2)}</Title>
                    </Stack>

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
