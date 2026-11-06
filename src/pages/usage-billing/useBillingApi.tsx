import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useAuthStore } from "../../store/auth/auth.store";
import {
  getEstimateApi,
  getUsageApi,
  getUserInvoicesApi,
  downloadInvoicePdfApi,
  updateMembershipStatusApi,
  type EstimateData,
  type UsageData,
  type InvoiceItem,
} from "../../api/usageBillingApi";
import { useTranslation } from "../../store/language/language.store";

/** All state + API calling logic for the Usage & Billing page. */
export default function useBillingApi() {
  const { translation } = useTranslation();

  const userDetails = useAuthStore((state) => state.userDetails);
  const setUserDetails = useAuthStore((state) => (state as any).setUserDetails);

  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const [upgrading, setUpgrading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingPeriod, setLoadingPeriod] = useState(false);

  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [estimateData, setEstimateData] = useState<EstimateData | null>(null);
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState<boolean>(false);

  // Invoices & PDF URL mappings
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [downloadingPeriod, setDownloadingPeriod] = useState<string | null>(
    null,
  );
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const [loadingPdfPeriods, setLoadingPdfPeriods] = useState<
    Record<string, boolean>
  >({});

  // Current active cycle
  const currentPeriod = useMemo(() => {
    if (availablePeriods.length > 0) return availablePeriods[0];
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [availablePeriods]);

  const loadBillingData = async (period: string, isInitial = false) => {
    if (isInitial) {
      setLoadingData(true);
    } else {
      setLoadingPeriod(true);
    }

    try {
      if (isInitial) {
        const [usageRes, estimateRes, invoicesRes] = await Promise.all([
          getUsageApi(),
          getEstimateApi(),
          getUserInvoicesApi(),
        ]);

        if (usageRes) setUsageData(usageRes);
        if (estimateRes?.estimate) setEstimateData(estimateRes.estimate);

        if (invoicesRes?.invoices) {
          setInvoices(invoicesRes.invoices);

          // Pre-populate PDF map from pdf.url
          const initialMap: Record<string, string> = {};
          invoicesRes.invoices.forEach((inv) => {
            if (inv.pdf?.url) {
              initialMap[inv.period] = inv.pdf.url;
            }
          });
          setPdfUrls(initialMap);
        }

        setIsInvoiceGenerated(Boolean(estimateRes?.invoiceGenerated));

        if (
          estimateRes?.availablePeriods &&
          estimateRes.availablePeriods.length > 0
        ) {
          setAvailablePeriods(estimateRes.availablePeriods);
        }

        if (estimateRes?.period && estimateRes.period !== period) {
          setSelectedPeriod(estimateRes.period);
        } else if (
          estimateRes?.availablePeriods &&
          estimateRes.availablePeriods.length > 0
        ) {
          setSelectedPeriod(estimateRes.availablePeriods[0]);
        }
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

  // Fetch or refresh PDF URL
  const ensurePdfUrl = async (periodStr: string): Promise<string | null> => {
    if (pdfUrls[periodStr]) return pdfUrls[periodStr];

    setLoadingPdfPeriods((prev) => ({ ...prev, [periodStr]: true }));
    try {
      const res = await downloadInvoicePdfApi(periodStr);
      const url =
        res?.download_url ||
        (res as any)?.url ||
        (res as any)?.pdf?.url ||
        (res as any)?.pdf_url;

      if (url) {
        setPdfUrls((prev) => ({ ...prev, [periodStr]: url }));
        return url;
      }
      return null;
    } finally {
      setLoadingPdfPeriods((prev) => ({ ...prev, [periodStr]: false }));
    }
  };

  const handleAccordionChange = (activeIds: string | string[] | null) => {
    if (!activeIds) return;
    const ids = Array.isArray(activeIds) ? activeIds : [activeIds];

    ids.forEach((id) => {
      const inv = invoices.find((i) => i.invoice_id === id);
      if (inv) {
        if (inv.pdf?.url) {
          setPdfUrls((prev) => ({ ...prev, [inv.period]: inv.pdf!.url }));
        } else if (!pdfUrls[inv.period]) {
          ensurePdfUrl(inv.period);
        }
      }
    });
  };

  // Month change: skip if current active month, call download api for older months
  const handlePeriodChange = async (val: string | null) => {
    if (!val || val === selectedPeriod) return;
    setSelectedPeriod(val);

    if (val === currentPeriod) {
      return;
    }

    setDownloadingPeriod(val);
    try {
      const res = await downloadInvoicePdfApi(val);

      if (res?.error) {
        notifications.show({
          title: "",
          message: res.error,
          color: "orange",
          icon: <IconAlertCircle size={16} />,
        });
      } else {
        const downloadUrl =
          res?.download_url ||
          (res as any)?.url ||
          (res as any)?.pdf?.url ||
          (res as any)?.pdf_url;

        if (downloadUrl) {
          window.open(downloadUrl, "_blank", "noopener,noreferrer");
          notifications.show({
            title: "",
            message: translation(
              "account_billing.notiInvoiceDownloadStarted",
              "Invoice download started.",
            ),
            color: "blue",
            icon: <IconCheck size={16} />,
          });
        } else {
          notifications.show({
            title: "",
            message: translation(
              "account_billing.errInvoiceUrlMissing",
              "Invoice PDF link is not available.",
            ),
            color: "red",
          });
        }
      }
    } catch {
      notifications.show({
        title: "",
        message: translation(
          "account_billing.failedToDownloadInvoice",
          "Failed to download invoice.",
        ),
        color: "red",
      });
    } finally {
      setDownloadingPeriod(null);
    }
  };

  const handleDownloadInvoice = async (e: MouseEvent, periodStr: string) => {
    e.stopPropagation();
    setDownloadingPeriod(periodStr);

    try {
      let downloadUrl = pdfUrls[periodStr];
      if (!downloadUrl) {
        const inv = invoices.find((i) => i.period === periodStr);
        if (inv?.pdf?.url) {
          downloadUrl = inv.pdf.url;
        }
      }

      if (!downloadUrl) {
        const res = await downloadInvoicePdfApi(periodStr);
        if (res?.error) {
          notifications.show({
            title: "",
            message: res.error,
            color: "orange",
            icon: <IconAlertCircle size={16} />,
          });
          return;
        }
        downloadUrl =
          res?.download_url ||
          (res as any)?.url ||
          (res as any)?.pdf?.url ||
          (res as any)?.pdf_url;
      }

      if (downloadUrl) {
        setPdfUrls((prev) => ({ ...prev, [periodStr]: downloadUrl }));
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
        notifications.show({
          title: "",
          message: translation(
            "account_billing.notiInvoiceDownloadStarted",
            "Invoice download started.",
          ),
          color: "blue",
          icon: <IconCheck size={16} />,
        });
      } else {
        notifications.show({
          title: "",
          message: translation(
            "account_billing.errInvoiceUrlMissing",
            "Invoice PDF link is not available.",
          ),
          color: "red",
        });
      }
    } catch {
      notifications.show({
        title: "",
        message: translation(
          "account_billing.failedToDownloadInvoice",
          "Failed to download invoice.",
        ),
        color: "red",
      });
    } finally {
      setDownloadingPeriod(null);
    }
  };

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

  return {
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
  };
}
