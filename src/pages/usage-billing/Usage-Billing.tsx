import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Accordion,
  ActionIcon,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useAuthStore } from "../../store/auth/auth.store";
import { useTranslation } from "../../store/language/language.store";
import type { UsageData } from "../../api/usageBillingApi";
import useBillingApi from "./useBillingApi";
import FeaturesSection, { type FeatureRowRendered } from "./FeaturesSection";
import BillingSection, { type BillingItem } from "./BillingSection";
import classes from "../accounts/Accounts.module.css";
import logo from "../../assets/logo.png";

export type { FeatureRowRendered };

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

export default function UsageBilling() {
  const navigate = useNavigate();

  const { translation, currentLang } = useTranslation();
  const curtLang = currentLang || "en";

  const userDetails = useAuthStore((state) => state.userDetails);
  const isPaid = Boolean((userDetails as any)?.is_paid);

  // All state + API calls
  const {
    availablePeriods,
    selectedPeriod,
    upgrading,
    loadingData,
    loadingPeriod,
    usageData,
    estimateData,
    isInvoiceGenerated,
    invoices,
    downloadingPeriod,
    pdfUrls,
    loadingPdfPeriods,
    handleAccordionChange,
    handlePeriodChange,
    handleDownloadInvoice,
    handleUpgradeToPaid,
  } = useBillingApi();

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

  const pendingInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.status === "pending" ||
        parseFloat(inv.amount_outstanding || "0") > 0,
    );
  }, [invoices]);

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
  const latestPremium =
    estimateData?.latest_day?.premium_usernames ??
    estimateData?.premium_usernames;

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
  const storageFreeBytes = latestStorage?.free_bytes ?? 5368709120;
  const storageUnitPrice = parseCost(latestStorage?.unit_price ?? 0.025);

  const premiumUsage =
    latestPremium?.usage ?? usageData?.premium_usernames ?? 0;
  const premiumUnitPrice = parseCost(latestPremium?.unit_price ?? 0.01);
  const premiumEstimatedCost = parseCost(
    estimateData?.cost?.premium_usernames ??
      estimateData?.total_premium_usernames_cost ??
      latestPremium?.cost,
  );

  const formattedFreeStorage = formatBytesLocalized(storageFreeBytes, curtLang);
  const formattedUsageStorage = formatBytesLocalized(
    storageUsageBytes,
    curtLang,
  );

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
    `${formattedUsageStorage} used • $${storageUnitPrice.toFixed(4)}/GB/${unitWord}`,
  )
    .replace(/{usage}/g, formattedUsageStorage)
    .replace(/{rate}/g, storageUnitPrice.toFixed(4))
    .replace(/{unit}/g, unitWord);

  const premiumItemTitle = translation(
    "account_billing.itemPremiumUsernames",
    "Premium Usernames",
  );

  const premiumItemDetail = translation(
    "account_billing.detailPremiumUsernames",
    `${premiumUsage} used • $${premiumUnitPrice.toFixed(4)}/username/${unitWord}`,
  )
    .replace(/{usage}/g, String(premiumUsage))
    .replace(/{rate}/g, premiumUnitPrice.toFixed(4))
    .replace(/{unit}/g, unitWord);

  const billingItems: BillingItem[] = [
    {
      item: chatItemTitle,
      detail: chatItemDetail,
      cost: chatEstimatedCost,
    },
    ...(latestPremium
      ? [
          {
            item: premiumItemTitle,
            detail: premiumItemDetail,
            cost: premiumEstimatedCost,
          },
        ]
      : []),
    {
      item: storageItemTitle,
      detail: storageItemDetail,
      cost: storageEstimatedCost,
    },
  ];

  const handlePayBill = () => {
    setTimeout(() => {
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
            <FeaturesSection
              isPaid={isPaid}
              freeFeatures={freeFeatures}
              paidFeatures={paidFeatures}
              allCombinedFeatures={allCombinedFeatures}
              upgrading={upgrading}
              onUpgrade={handleUpgradeToPaid}
            />

            <BillingSection
              curtLang={curtLang}
              pendingInvoices={pendingInvoices}
              pdfUrls={pdfUrls}
              loadingPdfPeriods={loadingPdfPeriods}
              downloadingPeriod={downloadingPeriod}
              onAccordionChange={handleAccordionChange}
              onDownloadInvoice={handleDownloadInvoice}
              onPayBill={handlePayBill}
              loadingPeriod={loadingPeriod}
              billingItems={billingItems}
              accruedFrom={accruedFrom}
              accruedThrough={accruedThrough}
              periodSelectOptions={periodSelectOptions}
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              totalEstimatedCost={totalEstimatedCost}
              isInvoiceGenerated={isInvoiceGenerated}
            />
          </Accordion>
        )}
      </Container>
    </div>
  );
}
