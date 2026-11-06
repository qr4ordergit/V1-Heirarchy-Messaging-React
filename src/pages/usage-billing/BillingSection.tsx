import type { MouseEvent } from "react";
import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Card,
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
  IconCalendar,
  IconChevronDown,
  IconCreditCard,
  IconDownload,
  IconExternalLink,
  IconFileInvoice,
  IconWallet,
} from "@tabler/icons-react";
import type { InvoiceItem } from "../../api/usageBillingApi";
import { useTranslation } from "../../store/language/language.store";

export interface BillingItem {
  item: string;
  detail: string;
  cost: number;
}

const formatPeriodMonth = (periodStr: string, lang = "en") => {
  if (!periodStr) return "";
  const [year, month] = periodStr.split("-").map(Number);
  if (year && month) {
    const d = new Date(year, month - 1, 1);
    return d.toLocaleString(lang === "uk" ? "uk-UA" : "en-US", {
      month: "long",
      year: "numeric",
    });
  }
  return periodStr;
};

interface Props {
  curtLang: string;

  // Outstanding invoices
  pendingInvoices: InvoiceItem[];
  pdfUrls: Record<string, string>;
  loadingPdfPeriods: Record<string, boolean>;
  downloadingPeriod: string | null;
  onAccordionChange: (activeIds: string | string[] | null) => void;
  onDownloadInvoice: (e: MouseEvent, periodStr: string) => void;
  onPayBill: () => void;

  // Daily breakdown
  loadingPeriod: boolean;
  billingItems: BillingItem[];
  accruedFrom?: string;
  accruedThrough?: string;

  // Summary card
  periodSelectOptions: { value: string; label: string }[];
  selectedPeriod: string;
  onPeriodChange: (val: string | null) => void;
  totalEstimatedCost: number;
  isInvoiceGenerated: boolean;
}

/** Accordion section 2: Billing & Invoices */
export default function BillingSection({
  curtLang,
  pendingInvoices,
  pdfUrls,
  loadingPdfPeriods,
  downloadingPeriod,
  onAccordionChange,
  onDownloadInvoice,
  onPayBill,
  loadingPeriod,
  billingItems,
  accruedFrom,
  accruedThrough,
  periodSelectOptions,
  selectedPeriod,
  onPeriodChange,
  totalEstimatedCost,
  isInvoiceGenerated,
}: Props) {
  const { translation } = useTranslation();

  const hasMultiplePeriods = periodSelectOptions.length > 1;

  return (
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
        <Stack gap="lg">
          {/* PENDING INVOICES ACCORDION */}
          {pendingInvoices.length > 0 && (
            <Paper
              withBorder
              radius="md"
              p="md"
              bg="red.0"
              style={{ borderColor: "var(--mantine-color-red-3)" }}
            >
              <Group justify="space-between" align="center" mb="xs">
                <Group gap="xs">
                  <ThemeIcon color="red" variant="light" radius="xl" size={26}>
                    <IconAlertCircle size={16} />
                  </ThemeIcon>
                  <Text fw={700} size="sm" c="red.9">
                    {translation(
                      "account_billing.titlePendingBills",
                      "Outstanding Invoices",
                    )}
                  </Text>
                  <Badge color="red" size="sm" variant="filled">
                    {pendingInvoices.length}{" "}
                    {translation("account_billing.txtDue", "Due")}
                  </Badge>
                </Group>
              </Group>

              <Accordion
                variant="separated"
                radius="md"
                onChange={onAccordionChange}
              >
                {pendingInvoices.map((inv) => {
                  const outstanding = parseFloat(
                    inv.amount_outstanding || inv.total_due || "0",
                  ).toFixed(2);
                  const currentInvoicePdfUrl =
                    pdfUrls[inv.period] || inv.pdf?.url;
                  const isPdfLoading = Boolean(loadingPdfPeriods[inv.period]);

                  return (
                    <Accordion.Item
                      key={inv.invoice_id}
                      value={inv.invoice_id}
                      style={{ backgroundColor: "#ffffff" }}
                    >
                      <Accordion.Control>
                        <Group
                          justify="space-between"
                          align="center"
                          wrap="nowrap"
                          w="100%"
                          pr="xs"
                        >
                          <Stack gap={2}>
                            <Group gap="xs">
                              <Text fw={700} size="sm">
                                {formatPeriodMonth(inv.period, curtLang)}
                              </Text>
                              <Badge size="xs" color="red" variant="light">
                                {translation(
                                  "account_billing.txtUnpaid",
                                  "Unpaid",
                                )}
                              </Badge>
                            </Group>
                            {inv.due_at && (
                              <Text size="xs" c="dimmed">
                                {translation("account_billing.lblDue", "Due")}:{" "}
                                {new Date(inv.due_at).toLocaleDateString()}
                              </Text>
                            )}
                          </Stack>

                          <Group
                            gap="sm"
                            wrap="nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Text fw={700} size="sm" c="red.8">
                              ${outstanding}
                            </Text>

                            <Tooltip
                              label={translation(
                                "account_billing.btnDownloadPdf",
                                "Download Invoice PDF",
                              )}
                              withArrow
                            >
                              <ActionIcon
                                variant="light"
                                color="indigo"
                                size="md"
                                radius="md"
                                loading={downloadingPeriod === inv.period}
                                onClick={(e) =>
                                  onDownloadInvoice(e, inv.period)
                                }
                              >
                                <IconDownload size={16} />
                              </ActionIcon>
                            </Tooltip>

                            <Button
                              size="xs"
                              color="green"
                              radius="md"
                              leftSection={<IconWallet size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onPayBill();
                              }}
                            >
                              {translation(
                                "account_billing.btnPayNow",
                                "Pay Now",
                              )}
                            </Button>
                          </Group>
                        </Group>
                      </Accordion.Control>

                      <Accordion.Panel>
                        <Divider mb="sm" />
                        <Stack gap="sm">
                          {/* Totals Summary */}
                          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                            <Paper p="xs" radius="md" bg="gray.0" withBorder>
                              <Text size="xs" c="dimmed">
                                {translation(
                                  "account_billing.lblChatAccountsCost",
                                  "Chat Accounts",
                                )}
                              </Text>
                              <Text fw={700} size="sm">
                                $
                                {parseFloat(
                                  inv.cost?.chat_accounts || "0",
                                ).toFixed(2)}
                              </Text>
                            </Paper>

                            <Paper p="xs" radius="md" bg="gray.0" withBorder>
                              <Text size="xs" c="dimmed">
                                {translation(
                                  "account_billing.lblStorageCost",
                                  "Storage",
                                )}
                              </Text>
                              <Text fw={700} size="sm">
                                $
                                {parseFloat(inv.cost?.storage || "0").toFixed(
                                  2,
                                )}
                              </Text>
                            </Paper>

                            <Paper p="xs" radius="md" bg="gray.0" withBorder>
                              <Text size="xs" c="dimmed">
                                {translation(
                                  "account_billing.lblDaysAccrued",
                                  "Days Accrued",
                                )}
                              </Text>
                              <Text fw={700} size="sm">
                                {inv.days_accrued}{" "}
                                {translation("account_billing.txtDays", "days")}
                              </Text>
                            </Paper>

                            <Paper
                              p="xs"
                              radius="md"
                              bg="red.0"
                              withBorder
                              style={{
                                borderColor: "var(--mantine-color-red-2)",
                              }}
                            >
                              <Text size="xs" c="red.8" fw={600}>
                                {translation(
                                  "account_billing.lblTotalOutstanding",
                                  "Outstanding",
                                )}
                              </Text>
                              <Text fw={800} size="sm" c="red.9">
                                ${outstanding}
                              </Text>
                            </Paper>
                          </SimpleGrid>

                          {/* PDF Preview Container */}
                          <Paper withBorder radius="md" p="xs" bg="white">
                            <Group
                              justify="space-between"
                              align="center"
                              mb="xs"
                            >
                              <Group gap="xs">
                                <ThemeIcon
                                  size={24}
                                  radius="md"
                                  color="indigo"
                                  variant="light"
                                >
                                  <IconFileInvoice size={14} />
                                </ThemeIcon>
                                <Text size="xs" fw={700}>
                                  {translation(
                                    "account_billing.titleInvoicePdfPreview",
                                    "Invoice Document Preview",
                                  )}
                                </Text>
                              </Group>

                              {currentInvoicePdfUrl && (
                                <Button
                                  component="a"
                                  href={currentInvoicePdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  variant="subtle"
                                  size="compact-xs"
                                  color="indigo"
                                  rightSection={<IconExternalLink size={12} />}
                                >
                                  {translation(
                                    "account_billing.btnOpenInNewTab",
                                    "Open in new tab",
                                  )}
                                </Button>
                              )}
                            </Group>

                            {isPdfLoading ? (
                              <div
                                style={{
                                  height: 480,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 8,
                                  backgroundColor: "#f8f9fa",
                                  borderRadius: 8,
                                }}
                              >
                                <Loader size="sm" color="indigo" />
                                <Text size="xs" c="dimmed">
                                  {translation(
                                    "account_billing.loadingInvoicePdf",
                                    "Loading invoice PDF...",
                                  )}
                                </Text>
                              </div>
                            ) : currentInvoicePdfUrl ? (
                              <div
                                style={{
                                  width: "100%",
                                  height: "550px",
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  border: "1px solid #e9ecef",
                                }}
                              >
                                <iframe
                                  src={currentInvoicePdfUrl}
                                  title={`Invoice-${inv.period}`}
                                  width="100%"
                                  height="100%"
                                  style={{ border: "none" }}
                                />
                              </div>
                            ) : (
                              <Paper
                                p="xl"
                                radius="md"
                                bg="gray.0"
                                style={{ textAlign: "center" }}
                              >
                                <Text size="xs" c="dimmed">
                                  {translation(
                                    "account_billing.txtPdfNotAvailable",
                                    "Invoice PDF preview is not available.",
                                  )}
                                </Text>
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="indigo"
                                  mt="xs"
                                  leftSection={<IconDownload size={14} />}
                                  onClick={(e) =>
                                    onDownloadInvoice(e, inv.period)
                                  }
                                >
                                  {translation(
                                    "account_billing.btnDownloadPdf",
                                    "Download Invoice PDF",
                                  )}
                                </Button>
                              </Paper>
                            )}
                          </Paper>
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            </Paper>
          )}

          {/* Daily Utility Breakdown & Current Cycle */}
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
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Text fw={600} size="xs" c="dimmed" tt="uppercase">
                    {translation(
                      "account_billing.lblBillingCycle",
                      "Billing Cycle",
                    )}
                  </Text>
                  <Select
                    size="xs"
                    w={160}
                    data={periodSelectOptions}
                    value={selectedPeriod}
                    onChange={onPeriodChange}
                    leftSection={<IconCalendar size={13} />}
                    rightSection={
                      downloadingPeriod ? (
                        <Loader size={12} color="indigo" />
                      ) : hasMultiplePeriods ? (
                        <IconChevronDown size={14} />
                      ) : (
                        <></>
                      )
                    }
                    rightSectionPointerEvents="none"
                    allowDeselect={false}
                    styles={{
                      input: { fontWeight: 600, fontSize: "12px" },
                    }}
                  />
                </Group>

                <Divider />

                <Group justify="space-between" align="flex-end" wrap="wrap">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                      {translation(
                        "account_billing.txtCurrentAccruedCost",
                        "Current Accrued Cost",
                      )}
                    </Text>
                    <Title order={2}>${totalEstimatedCost.toFixed(2)}</Title>
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
              </Stack>
            </Card>
          </SimpleGrid>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
