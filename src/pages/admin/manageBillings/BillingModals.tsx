import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCalendar,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import { useTranslation } from "../../../store/language/language.store";
import type {
  AdminUserItem,
  UserBillingOverviewDetails,
} from "../../../api/manageBillingApi";
import type { RateModalMode } from "./useManageBillingApi";

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

export interface ExtraRatesState {
  bot_accounts: { price_per_unit: number } | null;
  service_calls: {
    free_units: number;
    unit_size: number;
    unit_price: number;
  } | null;
  compute_duration: {
    unit: string;
    free_units: number;
    unit_price: number;
  } | null;
}

interface UserOverviewModalProps {
  overviewModalOpened: boolean;
  onCloseOverview: () => void;
  selectedOverviewUser: AdminUserItem | null;
  overviewLoading: boolean;
  periodSelectOptions: { value: string; label: string }[];
  overviewSelectedPeriod: string;
  onOverviewPeriodChange: (newPeriod: string | null) => void;
  userEstimateData: UserBillingOverviewDetails["estimate"] | null;
  userInvoiceGenerated: boolean;
}

export function UserOverviewModal({
  overviewModalOpened,
  onCloseOverview,
  selectedOverviewUser,
  overviewLoading,
  periodSelectOptions,
  overviewSelectedPeriod,
  onOverviewPeriodChange,
  userEstimateData,
  userInvoiceGenerated,
}: UserOverviewModalProps) {
  const { translation, currentLang } = useTranslation();

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

  // Premium usernames
  const latestPremium = userEstimateData?.latest_day?.premium_usernames;
  const modalPremiumUsage = latestPremium?.usage ?? 0;
  const modalPremiumRate = parseCost(latestPremium?.unit_price ?? "0.01");
  const modalPremiumCost = parseCost(
    userEstimateData?.cost?.premium_usernames ?? latestPremium?.cost,
  );

  // Bot accounts
  const latestBot = userEstimateData?.latest_day?.bot_accounts;
  const modalBotUsage = latestBot?.usage ?? 0;
  const modalBotRate = parseCost(latestBot?.unit_price ?? "0.001");
  const modalBotCost = parseCost(
    userEstimateData?.cost?.bot_accounts ?? latestBot?.cost,
  );

  // Service calls
  const latestServiceCalls = userEstimateData?.latest_day?.service_calls;
  const modalServiceCallsUsage = parseCost(latestServiceCalls?.usage);
  const modalServiceCallsSize = latestServiceCalls?.unit_size ?? 1000;
  const modalServiceCallsRate = parseCost(latestServiceCalls?.unit_price);
  const modalServiceCallsCost = parseCost(
    userEstimateData?.cost?.service_calls ?? latestServiceCalls?.cost,
  );

  // Compute duration
  const latestCompute = userEstimateData?.latest_day?.compute_duration;
  const modalComputeUnits = parseCost(latestCompute?.billable_units);
  const modalComputeRate = parseCost(latestCompute?.unit_price);
  const modalComputeCost = parseCost(
    userEstimateData?.cost?.compute_duration ?? latestCompute?.cost,
  );

  const computeUnitMap: Record<string, string> = {
    second: "sec",
    minute: "min",
    hour: "hr",
  };
  const modalComputeUnit =
    computeUnitMap[latestCompute?.unit || "minute"] ||
    latestCompute?.unit ||
    "min";

  return (
    <Modal
      opened={overviewModalOpened}
      onClose={onCloseOverview}
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
                {translation("admin_billing.lblBillingCycle", "Billing Cycle")}:
              </Text>
              <Select
                size="xs"
                w={170}
                data={periodSelectOptions}
                value={overviewSelectedPeriod}
                onChange={onOverviewPeriodChange}
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

              {latestPremium && (
                <Table.Tr>
                  <Table.Td fw={500}>
                    {translation(
                      "admin_billing.itemPremiumUsernames",
                      "Premium Usernames",
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {translation(
                        "admin_billing.detailPremiumUsernames",
                        `${modalPremiumUsage} used • $${modalPremiumRate.toFixed(4)}/username`,
                      )
                        .replace(/{usage}/g, String(modalPremiumUsage))
                        .replace(/{rate}/g, modalPremiumRate.toFixed(4))}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }} fw={600}>
                    ${modalPremiumCost.toFixed(2)}
                  </Table.Td>
                </Table.Tr>
              )}

              {latestBot && (
                <Table.Tr>
                  <Table.Td fw={500}>
                    {translation(
                      "admin_billing.itemBotAccounts",
                      "Bot Accounts",
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {translation(
                        "admin_billing.detailBotAccounts",
                        `${modalBotUsage} used • $${modalBotRate.toFixed(4)}/bot`,
                      )
                        .replace(/{usage}/g, String(modalBotUsage))
                        .replace(/{rate}/g, modalBotRate.toFixed(4))}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }} fw={600}>
                    ${modalBotCost.toFixed(2)}
                  </Table.Td>
                </Table.Tr>
              )}

              {latestServiceCalls && (
                <Table.Tr>
                  <Table.Td fw={500}>
                    {translation(
                      "admin_billing.itemServiceCalls",
                      "Service Calls",
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {translation(
                        "admin_billing.detailServiceCalls",
                        `${modalServiceCallsUsage.toLocaleString()} calls • $${modalServiceCallsRate.toFixed(4)}/${modalServiceCallsSize.toLocaleString()} calls`,
                      )
                        .replace(
                          /{usage}/g,
                          modalServiceCallsUsage.toLocaleString(),
                        )
                        .replace(/{rate}/g, modalServiceCallsRate.toFixed(4))
                        .replace(
                          /{size}/g,
                          modalServiceCallsSize.toLocaleString(),
                        )}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }} fw={600}>
                    ${modalServiceCallsCost.toFixed(2)}
                  </Table.Td>
                </Table.Tr>
              )}

              {latestCompute && (
                <Table.Tr>
                  <Table.Td fw={500}>
                    {translation(
                      "admin_billing.itemComputeDuration",
                      "Compute Duration",
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {translation(
                        "admin_billing.detailComputeDuration",
                        `${modalComputeUnits.toFixed(2)} ${modalComputeUnit} • $${modalComputeRate.toFixed(4)}/${modalComputeUnit}`,
                      )
                        .replace(/{minutes}/g, modalComputeUnits.toFixed(2))
                        .replace(/{units}/g, modalComputeUnits.toFixed(2))
                        .replace(/{unit}/g, modalComputeUnit)
                        .replace(/{rate}/g, modalComputeRate.toFixed(4))}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }} fw={600}>
                    ${modalComputeCost.toFixed(2)}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        <Group justify="flex-end" mt="xs">
          <Button size="xs" variant="default" onClick={onCloseOverview}>
            {translation("admin_billing.buttonClose", "Close")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  MODAL 2: CONFIGURE RATES                                                  */
/* -------------------------------------------------------------------------- */

interface RatesModalProps {
  rateModalOpened: boolean;
  onClose: () => void;
  modalMode: RateModalMode;
  targetUserId: string | null;
  editFreeAccounts: number;
  setEditFreeAccounts: (val: number) => void;
  editAccountPrice: number;
  setEditAccountPrice: (val: number) => void;
  editFreeGb: number;
  setEditFreeGb: (val: number) => void;
  editStoragePrice: number;
  setEditStoragePrice: (val: number) => void;
  editPremiumPrice: number;
  setEditPremiumPrice: (val: number) => void;
  extraRates: ExtraRatesState;
  updateExtraRate: (
    section: keyof ExtraRatesState,
    field: string,
    value: number | string,
  ) => void;
  changeReason: string;
  setChangeReason: (val: string) => void;
  changeReasonError: string | null;
  setChangeReasonError: (val: string | null) => void;
  submittingRate: boolean;
  onSave: () => void;
}

export function RatesModal({
  rateModalOpened,
  onClose,
  modalMode,
  targetUserId,
  editFreeAccounts,
  setEditFreeAccounts,
  editAccountPrice,
  setEditAccountPrice,
  editFreeGb,
  setEditFreeGb,
  editStoragePrice,
  setEditStoragePrice,
  editPremiumPrice,
  setEditPremiumPrice,
  extraRates,
  updateExtraRate,
  changeReason,
  setChangeReason,
  changeReasonError,
  setChangeReasonError,
  submittingRate,
  onSave,
}: RatesModalProps) {
  const { translation } = useTranslation();

  return (
    <Modal
      opened={rateModalOpened}
      onClose={onClose}
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

        <Divider
          label={translation(
            "admin_billing.dividerPremiumUsernames",
            "Premium Usernames",
          )}
          labelPosition="left"
        />

        <NumberInput
          label={translation(
            "admin_billing.labelPremiumPrice",
            "Rate per username ($)",
          )}
          description={translation(
            "admin_billing.descriptionPremiumPrice",
            "Price per premium username",
          )}
          size="xs"
          min={0}
          decimalScale={3}
          value={editPremiumPrice}
          onChange={(val) => setEditPremiumPrice(Number(val) || 0)}
        />

        {extraRates.bot_accounts && (
          <>
            <Divider
              label={translation(
                "admin_billing.dividerBotAccounts",
                "Bot Accounts",
              )}
              labelPosition="left"
            />
            <NumberInput
              label={translation(
                "admin_billing.labelBotPrice",
                "Rate per bot account ($)",
              )}
              description={translation(
                "admin_billing.descriptionBotPrice",
                "Price per bot account",
              )}
              size="xs"
              min={0}
              decimalScale={6}
              value={extraRates.bot_accounts.price_per_unit}
              onChange={(val) =>
                updateExtraRate(
                  "bot_accounts",
                  "price_per_unit",
                  Number(val) || 0,
                )
              }
            />
          </>
        )}

        {extraRates.service_calls && (
          <>
            <Divider
              label={translation(
                "admin_billing.dividerServiceCalls",
                "Service Calls",
              )}
              labelPosition="left"
            />
            <SimpleGrid cols={2} spacing="xs">
              <NumberInput
                label={translation(
                  "admin_billing.labelFreeUnits",
                  "Free Units",
                )}
                description={translation(
                  "admin_billing.descriptionServiceFreeUnits",
                  "Included free units ({size} calls each)",
                ).replace(
                  /{size}/g,
                  extraRates.service_calls.unit_size.toLocaleString(),
                )}
                size="xs"
                min={0}
                value={extraRates.service_calls.free_units}
                onChange={(val) =>
                  updateExtraRate(
                    "service_calls",
                    "free_units",
                    Number(val) || 0,
                  )
                }
              />
              <NumberInput
                label={translation(
                  "admin_billing.labelPricePerUnit",
                  "Rate per unit ($)",
                )}
                description={translation(
                  "admin_billing.descriptionServicePrice",
                  "Price per {size} calls",
                ).replace(
                  /{size}/g,
                  extraRates.service_calls.unit_size.toLocaleString(),
                )}
                size="xs"
                min={0}
                decimalScale={6}
                value={extraRates.service_calls.unit_price}
                onChange={(val) =>
                  updateExtraRate(
                    "service_calls",
                    "unit_price",
                    Number(val) || 0,
                  )
                }
              />
            </SimpleGrid>
          </>
        )}

        {extraRates.compute_duration && (
          <>
            <Divider
              label={translation(
                "admin_billing.dividerComputeDuration",
                "Compute Duration",
              )}
              labelPosition="left"
            />
            <SimpleGrid cols={3} spacing="xs">
              <Select
                label={translation("admin_billing.labelComputeUnit", "Unit")}
                description={translation(
                  "admin_billing.descriptionComputeUnit",
                  "Billing time unit",
                )}
                size="xs"
                allowDeselect={false}
                data={[
                  {
                    value: "second",
                    label: translation("admin_billing.unitSecond", "Second"),
                  },
                  {
                    value: "minute",
                    label: translation("admin_billing.unitMinute", "Minute"),
                  },
                  {
                    value: "hour",
                    label: translation("admin_billing.unitHour", "Hour"),
                  },
                ]}
                value={extraRates.compute_duration.unit || "minute"}
                onChange={(val) => {
                  if (val) {
                    updateExtraRate("compute_duration", "unit", val);
                  }
                }}
              />
              <NumberInput
                label={translation(
                  "admin_billing.labelFreeUnits",
                  "Free Units",
                )}
                description={translation(
                  "admin_billing.descriptionComputeFreeUnits",
                  "Included free {unit}s",
                ).replace(
                  /{unit}/g,
                  extraRates.compute_duration.unit || "minute",
                )}
                size="xs"
                min={0}
                value={extraRates.compute_duration.free_units}
                onChange={(val) =>
                  updateExtraRate(
                    "compute_duration",
                    "free_units",
                    Number(val) || 0,
                  )
                }
              />
              <NumberInput
                label={translation(
                  "admin_billing.labelPricePerUnit",
                  "Rate per unit ($)",
                )}
                description={translation(
                  "admin_billing.descriptionComputePrice",
                  "Price per {unit}",
                ).replace(
                  /{unit}/g,
                  extraRates.compute_duration.unit || "minute",
                )}
                size="xs"
                min={0}
                decimalScale={6}
                value={extraRates.compute_duration.unit_price}
                onChange={(val) =>
                  updateExtraRate(
                    "compute_duration",
                    "unit_price",
                    Number(val) || 0,
                  )
                }
              />
            </SimpleGrid>
          </>
        )}

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
          <Button variant="default" size="xs" onClick={onClose}>
            {translation("admin_billing.buttonCancel", "Cancel")}
          </Button>
          <Button
            size="xs"
            color={modalMode === "edit_default" ? "indigo" : "cyan"}
            loading={submittingRate}
            onClick={onSave}
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
  );
}

/* -------------------------------------------------------------------------- */
/*  MODAL 3: CONFIRM STATUS CHANGE                                            */
/* -------------------------------------------------------------------------- */

interface StatusConfirmModalProps {
  confirmModalOpened: boolean;
  onClose: () => void;
  targetStatusUser: AdminUserItem | null;
  expectedActionWord: string;
  statusConfirmText: string;
  setStatusConfirmText: (val: string) => void;
  onConfirm: () => void;
}

export function StatusConfirmModal({
  confirmModalOpened,
  onClose,
  targetStatusUser,
  expectedActionWord,
  statusConfirmText,
  setStatusConfirmText,
  onConfirm,
}: StatusConfirmModalProps) {
  const { translation } = useTranslation();

  return (
    <Modal
      opened={confirmModalOpened}
      onClose={onClose}
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
              onConfirm();
            }
          }}
          autoFocus
        />

        <Group justify="flex-end" gap="xs" mt="md">
          <Button variant="default" size="xs" onClick={onClose}>
            {translation("admin_billing.buttonCancel", "Cancel")}
          </Button>

          <Button
            size="xs"
            color={expectedActionWord === "deactivate" ? "red" : "teal"}
            disabled={
              statusConfirmText.trim().toLowerCase() !== expectedActionWord
            }
            onClick={onConfirm}
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
  );
}
