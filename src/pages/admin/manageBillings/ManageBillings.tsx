import { useMemo, useState } from "react";
import {
  Badge,
  Group,
  LoadingOverlay,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useTranslation } from "../../../store/language/language.store";
import type {
  AdminUserItem,
  PricingRule,
  UpdatePricingPayload,
} from "../../../api/manageBillingApi";
import useManageBillingApi, { type RateModalMode } from "./useManageBillingApi";
import UserTierCards, { formatBytesToGb } from "./UserTierCards";
import {
  UserOverviewModal,
  RatesModal,
  StatusConfirmModal,
  type ExtraRatesState,
} from "./BillingModals";

const gbToBytes = (gb: number): number => {
  return Math.round(gb * 1024 * 1024 * 1024);
};

type ExtraPricingSource = {
  bot_accounts?: PricingRule["bot_accounts"];
  service_calls?: PricingRule["service_calls"];
  compute_duration?: PricingRule["compute_duration"];
};

const EMPTY_EXTRA_RATES: ExtraRatesState = {
  bot_accounts: null,
  service_calls: null,
  compute_duration: null,
};

const buildExtraRates = (
  primary?: ExtraPricingSource | null,
  fallback?: ExtraPricingSource | null,
): ExtraRatesState => {
  const bot = primary?.bot_accounts ?? fallback?.bot_accounts;
  const service = primary?.service_calls ?? fallback?.service_calls;
  const compute = primary?.compute_duration ?? fallback?.compute_duration;

  return {
    bot_accounts: bot
      ? {
          price_per_unit: Number(bot.price_per_unit ?? 0),
        }
      : null,
    service_calls: service
      ? {
          free_units: Number(service.free_units ?? 0),
          unit_size: Number(service.unit_size ?? 1000),
          unit_price: Number(service.unit_price ?? 0),
        }
      : null,
    compute_duration: compute
      ? {
          unit: compute.unit || "minute",
          free_units: Number(compute.free_units ?? 0),
          unit_price: Number(compute.unit_price ?? 0),
        }
      : null,
  };
};

export default function ManageBillings() {
  const { translation, currentLang } = useTranslation();

  const {
    initialLoading,
    period,
    defaultPricing,
    loadingDefault,
    loadingCustom,
    defaultTab,
    customTab,
    defaultUsers,
    defaultNextCursor,
    defaultTotal,
    customUsers,
    customNextCursor,
    customTotal,
    submittingRate,
    statusUpdatingUserId,
    overviewModalOpened,
    selectedOverviewUser,
    overviewSelectedPeriod,
    availablePeriods,
    overviewLoading,
    userEstimateData,
    userInvoiceGenerated,
    fetchDefaultTier,
    fetchCustomTier,
    handleDefaultTabChange,
    handleCustomTabChange,
    handleOpenUserOverview,
    handleOverviewPeriodChange,
    handleCloseOverview,
    saveRates,
    handleReturnToDefault,
    handleToggleUserStatus,
  } = useManageBillingApi();

  const [defaultSearch, setDefaultSearch] = useState("");
  const [customSearch, setCustomSearch] = useState("");

  const [rateModalOpened, setRateModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState<RateModalMode>("edit_default");
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [activeTierVersion, setActiveTierVersion] = useState<number>(1);
  const [editFreeAccounts, setEditFreeAccounts] = useState<number>(0);
  const [editAccountPrice, setEditAccountPrice] = useState<number>(0);
  const [editFreeGb, setEditFreeGb] = useState<number>(0);
  const [editStoragePrice, setEditStoragePrice] = useState<number>(0);
  const [editPremiumPrice, setEditPremiumPrice] = useState<number>(0);
  const [extraRates, setExtraRates] =
    useState<ExtraRatesState>(EMPTY_EXTRA_RATES);
  const [changeReason, setChangeReason] = useState<string>("");
  const [changeReasonError, setChangeReasonError] = useState<string | null>(
    null,
  );

  const updateExtraRate = (
    section: keyof ExtraRatesState,
    field: string,
    value: number | string,
  ) =>
    setExtraRates((prev) =>
      prev[section]
        ? ({
            ...prev,
            [section]: { ...prev[section], [field]: value },
          } as ExtraRatesState)
        : prev,
    );

  const [confirmModalOpened, setConfirmModalOpened] = useState(false);
  const [targetStatusUser, setTargetStatusUser] =
    useState<AdminUserItem | null>(null);
  const [statusConfirmText, setStatusConfirmText] = useState("");

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

  const filteredDefaultUsers = useMemo(() => {
    if (!defaultSearch.trim()) return defaultUsers;
    const q = defaultSearch.toLowerCase();
    return defaultUsers.filter(
      (u) =>
        u.user_id.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)),
    );
  }, [defaultUsers, defaultSearch]);

  const filteredCustomUsers = useMemo(() => {
    if (!customSearch.trim()) return customUsers;
    const q = customSearch.toLowerCase();
    return customUsers.filter(
      (c) =>
        c.user_id.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.username && c.username.toLowerCase().includes(q)),
    );
  }, [customUsers, customSearch]);

  const handleOpenEditDefault = () => {
    if (!defaultPricing) return;
    setModalMode("edit_default");
    setTargetUserId(null);
    setActiveTierVersion(defaultPricing.version);

    setEditFreeAccounts(defaultPricing.chat_accounts.free_quantity);
    setEditAccountPrice(Number(defaultPricing.chat_accounts.price_per_unit));
    setEditFreeGb(formatBytesToGb(defaultPricing.storage.free_bytes));
    setEditStoragePrice(Number(defaultPricing.storage.price_per_gb));
    setEditPremiumPrice(
      Number(defaultPricing.premium_usernames?.price_per_unit ?? 0.01),
    );
    setExtraRates(buildExtraRates(defaultPricing));
    setChangeReason("");
    setChangeReasonError(null);
    setRateModalOpened(true);
  };

  const handleOpenEditCustom = (customItem: AdminUserItem) => {
    setModalMode("edit_custom");
    setTargetUserId(customItem.user_id);
    setActiveTierVersion(customItem.pricing.version || 1);

    const customAccounts =
      customItem.pricing.chat_accounts || defaultPricing?.chat_accounts;
    const customStorage = customItem.pricing.storage || defaultPricing?.storage;
    const customPremium =
      customItem.pricing.premium_usernames || defaultPricing?.premium_usernames;

    setEditFreeAccounts(customAccounts?.free_quantity ?? 4);
    setEditAccountPrice(Number(customAccounts?.price_per_unit ?? 0.03));
    setEditFreeGb(
      customStorage ? formatBytesToGb(customStorage.free_bytes) : 5,
    );
    setEditStoragePrice(Number(customStorage?.price_per_gb ?? 0.025));
    setEditPremiumPrice(Number(customPremium?.price_per_unit ?? 0.01));
    setExtraRates(buildExtraRates(customItem.pricing, defaultPricing));
    setChangeReason("");
    setChangeReasonError(null);
    setRateModalOpened(true);
  };

  const handleOpenMoveToCustom = (userId: string) => {
    setModalMode("move_to_custom");
    setTargetUserId(userId);
    setActiveTierVersion(defaultPricing?.version ?? 1);

    setEditFreeAccounts(defaultPricing?.chat_accounts.free_quantity ?? 4);
    setEditAccountPrice(
      Number(defaultPricing?.chat_accounts.price_per_unit ?? 0.03),
    );
    setEditFreeGb(
      defaultPricing ? formatBytesToGb(defaultPricing.storage.free_bytes) : 5,
    );
    setEditStoragePrice(Number(defaultPricing?.storage.price_per_gb ?? 0.025));
    setEditPremiumPrice(
      Number(defaultPricing?.premium_usernames?.price_per_unit ?? 0.01),
    );
    setExtraRates(buildExtraRates(defaultPricing));
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

    const currencyCode = (defaultPricing?.currency || "USD")
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
      premium_usernames: {
        price_per_unit: String(editPremiumPrice ?? 0),
      },
      ...(extraRates.bot_accounts && {
        bot_accounts: {
          price_per_unit: String(extraRates.bot_accounts.price_per_unit ?? 0),
        },
      }),
      ...(extraRates.service_calls && {
        service_calls: {
          free_units: Number(extraRates.service_calls.free_units) || 0,
          unit_size: extraRates.service_calls.unit_size,
          unit_price: String(extraRates.service_calls.unit_price ?? 0),
        },
      }),
      ...(extraRates.compute_duration && {
        compute_duration: {
          unit: extraRates.compute_duration.unit || "minute",
          free_units: Number(extraRates.compute_duration.free_units) || 0,
          unit_price: String(extraRates.compute_duration.unit_price ?? 0),
        },
      }),
    };

    let payload: UpdatePricingPayload;
    if (modalMode === "edit_default") {
      payload = { pricing_type: "default", ...commonRates };
    } else {
      if (!targetUserId) {
        return;
      }
      payload = {
        pricing_type: "custom",
        user_id: targetUserId,
        ...commonRates,
      };
    }

    await saveRates(payload, modalMode, () => setRateModalOpened(false));
  };

  const handlePromptToggleStatus = (user: AdminUserItem) => {
    setTargetStatusUser(user);
    setStatusConfirmText("");
    setConfirmModalOpened(true);
  };

  const expectedActionWord =
    targetStatusUser?.status === "active" ? "deactivate" : "activate";

  const handleCloseConfirmModal = () => {
    setConfirmModalOpened(false);
    setTargetStatusUser(null);
    setStatusConfirmText("");
  };

  const handleConfirmStatusChange = async () => {
    if (!targetStatusUser) return;
    if (statusConfirmText.trim().toLowerCase() !== expectedActionWord) return;

    const userToUpdate = targetStatusUser;
    setConfirmModalOpened(false);
    setTargetStatusUser(null);
    setStatusConfirmText("");

    await handleToggleUserStatus(userToUpdate);
  };

  return (
    <div className="w-full relative" style={{ minHeight: 400 }}>
      <LoadingOverlay
        visible={initialLoading}
        zIndex={10}
        overlayProps={{ radius: "sm", blur: 1 }}
        loaderProps={{ color: "indigo", type: "dots" }}
      />

      <Group justify="space-between" align="flex-end" mb="xl">
        <Stack gap={4}>
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

        {period && (
          <Badge size="md" variant="light" color="indigo" radius="sm">
            {translation("admin_billing.lblBillingPeriod", "Period")}: {period}
          </Badge>
        )}
      </Group>

      <Stack gap="xl">
        <UserTierCards
          statusUpdatingUserId={statusUpdatingUserId}
          handleOpenUserOverview={handleOpenUserOverview}
          handlePromptToggleStatus={handlePromptToggleStatus}
          loadingDefault={loadingDefault}
          defaultTotal={defaultTotal}
          defaultSearch={defaultSearch}
          setDefaultSearch={setDefaultSearch}
          defaultTab={defaultTab}
          handleDefaultTabChange={handleDefaultTabChange}
          filteredDefaultUsers={filteredDefaultUsers}
          defaultNextCursor={defaultNextCursor}
          fetchDefaultTier={fetchDefaultTier}
          handleOpenEditDefault={handleOpenEditDefault}
          handleOpenMoveToCustom={handleOpenMoveToCustom}
          loadingCustom={loadingCustom}
          customTotal={customTotal}
          customSearch={customSearch}
          setCustomSearch={setCustomSearch}
          customTab={customTab}
          handleCustomTabChange={handleCustomTabChange}
          filteredCustomUsers={filteredCustomUsers}
          customNextCursor={customNextCursor}
          fetchCustomTier={fetchCustomTier}
          handleOpenEditCustom={handleOpenEditCustom}
          handleReturnToDefault={handleReturnToDefault}
        />
      </Stack>

      <UserOverviewModal
        overviewModalOpened={overviewModalOpened}
        onCloseOverview={handleCloseOverview}
        selectedOverviewUser={selectedOverviewUser}
        overviewLoading={overviewLoading}
        periodSelectOptions={periodSelectOptions}
        overviewSelectedPeriod={overviewSelectedPeriod}
        onOverviewPeriodChange={handleOverviewPeriodChange}
        userEstimateData={userEstimateData}
        userInvoiceGenerated={userInvoiceGenerated}
      />

      <RatesModal
        rateModalOpened={rateModalOpened}
        onClose={() => setRateModalOpened(false)}
        modalMode={modalMode}
        targetUserId={targetUserId}
        editFreeAccounts={editFreeAccounts}
        setEditFreeAccounts={setEditFreeAccounts}
        editAccountPrice={editAccountPrice}
        setEditAccountPrice={setEditAccountPrice}
        editFreeGb={editFreeGb}
        setEditFreeGb={setEditFreeGb}
        editStoragePrice={editStoragePrice}
        setEditStoragePrice={setEditStoragePrice}
        editPremiumPrice={editPremiumPrice}
        setEditPremiumPrice={setEditPremiumPrice}
        extraRates={extraRates}
        updateExtraRate={updateExtraRate}
        changeReason={changeReason}
        setChangeReason={setChangeReason}
        changeReasonError={changeReasonError}
        setChangeReasonError={setChangeReasonError}
        submittingRate={submittingRate}
        onSave={handleSaveRates}
      />

      <StatusConfirmModal
        confirmModalOpened={confirmModalOpened}
        onClose={handleCloseConfirmModal}
        targetStatusUser={targetStatusUser}
        expectedActionWord={expectedActionWord}
        statusConfirmText={statusConfirmText}
        setStatusConfirmText={setStatusConfirmText}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}
