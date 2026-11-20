import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { useTranslation } from "../../../store/language/language.store";
import {
  type AdminUserItem,
  type OverviewQueryParams,
  type PricingRule,
  type UpdatePricingPayload,
  type UserBillingOverviewDetails,
  getAdminOverviewDataApi,
  getUserBillingOverviewApi,
  patchPricingTierRatesApi,
  reassignUserTierApi,
  toggleUserStatusApi,
} from "../../../api/manageBillingApi";

export type FilterTabType = "all" | "unsettled" | "active" | "deactive";
export type RateModalMode = "edit_default" | "edit_custom" | "move_to_custom";

/** All server data state + API calling logic for the Manage Billings page. */
export default function useManageBillingApi() {
  const { translation } = useTranslation();

  const [initialLoading, setInitialLoading] = useState(true);
  const [period, setPeriod] = useState<string>("");
  const [defaultPricing, setDefaultPricing] = useState<PricingRule | null>(
    null,
  );

  // Independent Column Loading States
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // Independent Tab Filter States
  const [defaultTab, setDefaultTab] = useState<FilterTabType>("all");
  const [customTab, setCustomTab] = useState<FilterTabType>("all");

  // User Items & Pagination Cursor States
  const [defaultUsers, setDefaultUsers] = useState<AdminUserItem[]>([]);
  const [defaultNextCursor, setDefaultNextCursor] = useState<string | null>(
    null,
  );
  const [defaultTotal, setDefaultTotal] = useState<number>(0);

  const [customUsers, setCustomUsers] = useState<AdminUserItem[]>([]);
  const [customNextCursor, setCustomNextCursor] = useState<string | null>(null);
  const [customTotal, setCustomTotal] = useState<number>(0);

  const [submittingRate, setSubmittingRate] = useState(false);
  const [statusUpdatingUserId, setStatusUpdatingUserId] = useState<
    string | null
  >(null);

  // User Billing Overview Popup States
  const [overviewModalOpened, setOverviewModalOpened] = useState(false);
  const [selectedOverviewUser, setSelectedOverviewUser] =
    useState<AdminUserItem | null>(null);
  const [overviewSelectedPeriod, setOverviewSelectedPeriod] =
    useState<string>("");
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<string|null>(null);
  const [userEstimateData, setUserEstimateData] = useState<
    UserBillingOverviewDetails["estimate"] | null
  >(null);
  const [userInvoiceGenerated, setUserInvoiceGenerated] =
    useState<boolean>(false);

  // Helper to map tab selection to query params
  const buildQueryParams = (
    tierType: "default" | "custom",
    activeTab: FilterTabType,
    cursor?: string | null,
  ): OverviewQueryParams => {
    const params: OverviewQueryParams = {
      limit: 10,
      type: tierType,
    };

    if (cursor) {
      params.cursor = cursor;
    }

    if (activeTab === "unsettled") {
      params.dues = "unpaid";
    } else if (activeTab === "active") {
      params.status = "active";
    } else if (activeTab === "deactive") {
      params.status = "deactive";
    }

    return params;
  };

  // Fetch Default Tier Users
  const fetchDefaultTier = async (
    tab: FilterTabType = defaultTab,
    cursor: string | null = null,
    isNext = false,
  ) => {
    setLoadingDefault(true);
    const params = buildQueryParams("default", tab, cursor);
    const details = await getAdminOverviewDataApi(params);

    if (details) {
      if (details.period) setPeriod(details.period);
      if (details.default_pricing) setDefaultPricing(details.default_pricing);

      const items = details.users?.items || [];
      setDefaultUsers((prev) => (isNext ? [...prev, ...items] : items));
      setDefaultNextCursor(details.users?.next_cursor ?? null);
      setDefaultTotal(details.users?.total ?? 0);
    }
    setLoadingDefault(false);
  };

  const fetchCustomTier = async (
    tab: FilterTabType = customTab,
    cursor: string | null = null,
    isNext = false,
  ) => {
    setLoadingCustom(true);
    const params = buildQueryParams("custom", tab, cursor);
    const details = await getAdminOverviewDataApi(params);

    if (details) {
      const items = details.users?.items || [];
      setCustomUsers((prev) => (isNext ? [...prev, ...items] : items));
      setCustomNextCursor(details.users?.next_cursor ?? null);
      setCustomTotal(details.users?.total ?? 0);
    }
    setLoadingCustom(false);
  };

  // Initial Dual Fetch
  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      await Promise.all([fetchDefaultTier("all"), fetchCustomTier("all")]);
      setInitialLoading(false);
    };
    init();
  }, []);

  // Tab switch handlers
  const handleDefaultTabChange = (newTab: FilterTabType) => {
    if (newTab === defaultTab) return;
    setDefaultTab(newTab);
    fetchDefaultTier(newTab, null, false);
  };

  const handleCustomTabChange = (newTab: FilterTabType) => {
    if (newTab === customTab) return;
    setCustomTab(newTab);
    fetchCustomTier(newTab, null, false);
  };

  // Modal overview loader
  const loadUserOverview = async (userId: string, targetPeriod?: string) => {
    if (!userId) return;
    setOverviewLoading(true);

    try {
      const details = await getUserBillingOverviewApi(userId, targetPeriod);
      
      if (details) {
        setUserEstimateData(details.estimate ?? null);
        setUserInvoiceGenerated(Boolean(details.invoice_generated));

        if (details.period) {
          setOverviewSelectedPeriod(details.period);
        }
        if (Array.isArray(details.available_periods)) {
          setAvailablePeriods(details.available_periods);
        }
        if (details.invoice && details.invoice !== null) {
          setInvoiceStatus(details.invoice.status)
        }else{
          setInvoiceStatus(null)
        }
      } else {
        setUserEstimateData(null);
      }
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleOpenUserOverview = (user: AdminUserItem) => {
    setSelectedOverviewUser(user);
    setUserEstimateData(null);
    setOverviewSelectedPeriod("");
    setAvailablePeriods([]);
    setOverviewModalOpened(true);
    loadUserOverview(user.user_id);
  };

  const handleOverviewPeriodChange = (newPeriod: string | null) => {
    if (
      !newPeriod ||
      newPeriod === overviewSelectedPeriod ||
      !selectedOverviewUser
    )
      return;
    setOverviewSelectedPeriod(newPeriod);
    loadUserOverview(selectedOverviewUser.user_id, newPeriod);
  };

  const handleCloseOverview = () => {
    setOverviewModalOpened(false);
    setSelectedOverviewUser(null);
    setUserEstimateData(null);
    setAvailablePeriods([]);
  };

  // PATCH tier rates (edit default / edit custom / move to custom)
  const saveRates = async (
    payload: UpdatePricingPayload,
    modalMode: RateModalMode,
    onSuccess: () => void,
  ) => {
    setSubmittingRate(true);

    const success = await patchPricingTierRatesApi(payload);
    if (success) {
      notifications.show({
        title: "",
        message:
          modalMode === "move_to_custom"
            ? translation(
                "admin_billing.notiUserMovedSuccess",
                "User moved to custom pricing tier successfully.",
              )
            : translation(
                "admin_billing.notiPricingUpdated",
                "Tier pricing configuration updated successfully.",
              ),
        color: "green",
        icon: <IconCheck size={16} />,
      });
      onSuccess();
      await Promise.all([
        fetchDefaultTier(defaultTab, null, false),
        fetchCustomTier(customTab, null, false),
      ]);
    }
    setSubmittingRate(false);
  };

  const handleReturnToDefault = async (userId: string) => {
    const success = await reassignUserTierApi({
      user_id: userId,
      target_tier: "default",
    });

    if (success) {
      notifications.show({
        title: "",
        message: translation(
          "admin_billing.notiUserReturnedDefault",
          "User reassigned to standard default pricing.",
        ),
        color: "green",
        icon: <IconCheck size={16} />,
      });
      await Promise.all([
        fetchDefaultTier(defaultTab, null, false),
        fetchCustomTier(customTab, null, false),
      ]);
    }
  };

  const handleToggleUserStatus = async (user: AdminUserItem) => {
    const isCurrentlyActive = user.status === "active";
    const previousStatus = user.status;
    const nextStatus: "active" | "deactive" = isCurrentlyActive
      ? "deactive"
      : "active";

    const updateStatusInList = (list: AdminUserItem[]) =>
      list.map((u) =>
        u.user_id === user.user_id ? { ...u, status: nextStatus } : u,
      );

    setDefaultUsers((prev) => updateStatusInList(prev));
    setCustomUsers((prev) => updateStatusInList(prev));

    setStatusUpdatingUserId(user.user_id);
    const success = await toggleUserStatusApi(user.user_id, nextStatus);
    setStatusUpdatingUserId(null);

    if (success) {
      notifications.show({
        title: "",
        message:
          nextStatus === "active"
            ? translation(
                "admin_billing.notiUserActivated",
                "User account has been activated successfully.",
              )
            : translation(
                "admin_billing.notiUserDeactivated",
                "User account has been deactivated successfully.",
              ),
        color: nextStatus === "active" ? "teal" : "red",
        icon: <IconCheck size={16} />,
      });
    } else {
      const revertStatusInList = (list: AdminUserItem[]) =>
        list.map((u) =>
          u.user_id === user.user_id ? { ...u, status: previousStatus } : u,
        );

      setDefaultUsers((prev) => revertStatusInList(prev));
      setCustomUsers((prev) => revertStatusInList(prev));
    }
  };

  return {
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
    invoiceStatus
  };
}
