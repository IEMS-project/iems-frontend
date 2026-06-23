import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, CheckCircle2, Copy, CreditCard, Crown, Loader2, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { subscriptionLimitService } from "@/features/admin/api/subscriptionLimitService";
import { paymentService } from "@/features/payments/api/paymentService";
import { useAuth } from "@/context/AuthContext.jsx";
import { refreshAccessToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const DEFAULT_PLANS = [
  {
    id: "week",
    name: "Week",
    duration: "7 ngày",
    price: 49000,
    description: "Dùng thử nhanh cho cá nhân hoặc nhóm nhỏ.",
  },
  {
    id: "month",
    name: "Month",
    duration: "30 ngày",
    price: 149000,
    description: "Phù hợp cho sprint hoặc dự án ngắn hạn.",
    recommended: true,
  },
  {
    id: "year",
    name: "Year",
    duration: "365 ngày",
    price: 1499000,
    description: "Tối ưu cho team dùng IEMS lâu dài.",
  },
];

function normalizePlan(plan) {
  return {
    id: plan.code || plan.id,
    name: plan.name,
    duration: plan.duration || `${plan.durationDays} ngày`,
    price: plan.price,
    description: plan.description || plan.features || "",
    recommended: !!plan.recommended,
    currency: plan.currency || "VND",
  };
}

const COMPARISON_ROWS = [
  { label: "Project", free: "2", premium: "10" },
  { label: "Thành viên / project", free: "5", premium: "20" },
  { label: "Issues / project", free: "50", premium: "500" },
  { label: "Sprints / project", free: "2", premium: "10" },
  { label: "AI Chatbot / ngày", free: "5", premium: "50" },
  { label: "Activity Log", free: "7 ngày", premium: "60 ngày" },
  { label: "Custom Workflow", free: false, premium: true },
  { label: "Burndown Chart", free: false, premium: true },
];

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

const STATUS_META = {
  PAID: {
    label: "Đã thanh toán",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "Đang chờ thanh toán",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    icon: RefreshCw,
  },
  PROCESSING: {
    label: "Đang xác nhận",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    icon: RefreshCw,
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300",
    icon: XCircle,
  },
  FAILED: {
    label: "Lỗi thanh toán",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300",
    icon: AlertCircle,
  },
  TIMEOUT: {
    label: "Hết thời gian chờ",
    className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300",
    icon: AlertCircle,
  },
};

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function ComparisonValue({ value, premium = false }) {
  if (value === true) {
    return (
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full border",
          premium
            ? "border-[#ffd76a]/70 bg-gradient-to-br from-[#fff9df] to-[#ffd85a] text-[#8a5a12] shadow-sm shadow-[#ffd85a]/25 dark:border-[#ffe58a]/35 dark:from-[#3a2508] dark:to-[#8a5a12] dark:text-[#ffe58a]"
            : "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (value === false) {
    return <span className="text-sm font-medium text-muted-foreground">-</span>;
  }

  return (
    <span className={cn(
      "text-sm font-semibold",
      premium ? "text-[#7a4f12] dark:text-[#ffe58a]" : "text-foreground"
    )}>
      {value}
    </span>
  );
}

export default function PremiumUpgradePage() {
  const { loadUserProfile } = useAuth();
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [comparisonRows, setComparisonRows] = useState(COMPARISON_ROWS);
  const [selectedPlanId, setSelectedPlanId] = useState("month");
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [activePayment, setActivePayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [copiedDescription, setCopiedDescription] = useState(false);
  const pollStartedAtRef = useRef(null);
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || plans[0] || DEFAULT_PLANS[1],
    [plans, selectedPlanId]
  );
  const statusMeta = useMemo(() => STATUS_META[paymentStatus] || STATUS_META.PENDING, [paymentStatus]);
  const StatusIcon = statusMeta.icon;
  const qrValue = activePayment?.qrCode || activePayment?.checkoutUrl;

  useEffect(() => {
    let mounted = true;
    paymentService.getActiveSubscriptionPlans()
      .then((data) => {
        const nextPlans = Array.isArray(data) ? data.map(normalizePlan).filter((plan) => plan.id) : [];
        if (mounted && nextPlans.length > 0) {
          setPlans(nextPlans);
          setSelectedPlanId((current) => nextPlans.some((plan) => plan.id === current) ? current : nextPlans[0].id);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    subscriptionLimitService.getLimits()
      .then((limits) => {
        const free = Array.isArray(limits) ? limits.find((item) => item.planType === "FREE") : null;
        const premium = Array.isArray(limits) ? limits.find((item) => item.planType === "PREMIUM") : null;
        if (!mounted || !free || !premium) return;
        setComparisonRows([
          { label: "Project", free: String(free.maxOwnedProjects), premium: String(premium.maxOwnedProjects) },
          { label: "Thành viên / project", free: String(free.maxMembersPerProject), premium: String(premium.maxMembersPerProject) },
          { label: "Issues / project", free: String(free.maxIssuesPerProject), premium: String(premium.maxIssuesPerProject) },
          { label: "Sprints / project", free: String(free.maxSprintsPerProject), premium: String(premium.maxSprintsPerProject) },
          { label: "Custom roles / project", free: String(free.maxCustomRolesPerProject), premium: String(premium.maxCustomRolesPerProject) },
          { label: "Activity Log", free: `${free.activityLogDays} ngày`, premium: `${premium.activityLogDays} ngày` },
          { label: "Custom Workflow", free: !!free.customWorkflowEnabled, premium: !!premium.customWorkflowEnabled },
          { label: "Burndown Chart", free: !!free.burndownEnabled, premium: !!premium.burndownEnabled },
          { label: "Issue Type & Priority", free: !!free.issueTypePriorityCustomizationEnabled, premium: !!premium.issueTypePriorityCustomizationEnabled },
        ]);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handlePayOSCheckout = async () => {
    setIsCreatingPayment(true);
    setPaymentError("");
    setActivePayment(null);
    setPaymentStatus(null);
    pollStartedAtRef.current = null;

    try {
      const payment = await paymentService.createPayOSPayment({ planId: selectedPlan.id });
      if (!payment?.orderCode) {
        throw new Error("Không nhận được mã QR thanh toán từ payOS");
      }
      setActivePayment(payment);
      setPaymentStatus(payment.status || "PENDING");
    } catch (error) {
      setPaymentError(error?.message || "Không thể tạo thanh toán payOS");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    setActivePayment(null);
    setPaymentStatus(null);
    setPaymentError("");
    pollStartedAtRef.current = null;
  };

  const handleCopyDescription = useCallback(async (value) => {
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedDescription(true);
      window.setTimeout(() => setCopiedDescription(false), 2000);
    } catch (error) {
      console.warn("Failed to copy description:", error?.message);
    }
  }, []);

  const checkPaymentStatus = async ({ silent = false } = {}) => {
    if (!activePayment?.orderCode) return;

    if (!silent) {
      setIsCheckingPayment(true);
      setPaymentError("");
      if (paymentStatus === "TIMEOUT") {
        pollStartedAtRef.current = Date.now();
      }
    }

    try {
      const payment = await paymentService.getPayOSPaymentStatus(activePayment.orderCode);
      setPaymentStatus(payment?.status || "PROCESSING");
      setActivePayment((prev) => ({ ...prev, ...payment }));

      if (payment?.status === "PAID") {
        try {
          await refreshAccessToken();
          await loadUserProfile();
        } catch (refreshError) {
          console.warn("Payment succeeded but session refresh failed:", refreshError?.message);
        }
      }
    } catch (error) {
      if (!silent) {
        setPaymentError(error?.message || "Không thể kiểm tra trạng thái thanh toán");
      }
    } finally {
      if (!silent) {
        setIsCheckingPayment(false);
      }
    }
  };

  useEffect(() => {
    if (!activePayment?.orderCode) return undefined;
    if (["PAID", "CANCELLED", "FAILED", "TIMEOUT"].includes(paymentStatus)) return undefined;

    if (!pollStartedAtRef.current) {
      pollStartedAtRef.current = Date.now();
    }

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - pollStartedAtRef.current;
      if (elapsed >= POLL_TIMEOUT_MS) {
        setPaymentStatus("TIMEOUT");
        window.clearInterval(timer);
        return;
      }
      checkPaymentStatus({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [activePayment?.orderCode, paymentStatus, checkPaymentStatus]);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    className={cn(
                      "relative flex min-h-56 flex-col rounded-3xl border bg-card p-5 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd85a]",
                      isSelected
                        ? "border-[#ffe58a]/55 bg-gradient-to-br from-[#fffdf0] via-[#fff7d4] to-[#ffd85a]/45 shadow-md shadow-[#ffd85a]/20 dark:from-[#141821] dark:via-[#1f1a0d] dark:to-[#3a2508] dark:shadow-[#f6c236]/12"
                        : "border-border hover:border-[#ffd76a]/80 hover:bg-[#fff9df]/55 dark:hover:border-[#ffe58a]/30 dark:hover:bg-[#f6c236]/6"
                    )}
                  >
                    {plan.recommended && (
                      <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-[#ffd85a] to-[#e3a51b] px-2.5 py-1 text-xs font-semibold text-[#3a2403] shadow-sm shadow-[#ffd85a]/35 dark:from-[#ffe58a] dark:to-[#c9901f]">
                        Phổ biến
                      </span>
                    )}

                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff9df] via-[#ffd85a] to-[#e3a51b] text-[#8a5a12] shadow-sm ring-1 ring-[#ffd76a]/70 dark:from-[#3a2508] dark:via-[#8a5a12] dark:to-[#f6c236] dark:text-[#fff7d4] dark:ring-[#ffe58a]/30">
                      <Crown className="h-5 w-5" />
                    </span>

                    <div className="mt-5">
                      <p className={cn("text-lg font-semibold", isSelected ? "text-[#3a2403] dark:text-foreground" : "text-foreground")}>{plan.name}</p>
                      <p className={cn("mt-1 text-sm", isSelected ? "text-[#6f4708] dark:text-muted-foreground" : "text-muted-foreground")}>{plan.duration}</p>
                    </div>

                    <div className="mt-5">
                      <p className={cn("text-3xl font-bold tracking-tight", isSelected ? "text-[#3a2403] dark:text-foreground" : "text-foreground")}>
                        {formatCurrency(plan.price)}
                      </p>
                    </div>

                    <p className={cn("mt-auto pt-5 text-sm leading-6", isSelected ? "text-[#6f4708] dark:text-muted-foreground" : "text-muted-foreground")}>
                      {plan.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <Card className="overflow-hidden rounded-3xl border-[#ffd76a]/45 bg-card shadow-sm dark:border-[#ffe58a]/20">


              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[minmax(0,1fr)_120px_120px] border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <div className="px-5 py-3">Tính năng</div>
                    <div className="border-l border-border px-5 py-3 text-center">Free</div>
                    <div className="border-l border-[#ffd76a]/50 bg-gradient-to-r from-[#fff9df] to-[#ffd85a]/45 px-5 py-3 text-center font-bold text-[#7a4f12] dark:border-[#ffe58a]/20 dark:from-[#f6c236]/12 dark:to-[#8a5a12]/16 dark:text-[#ffe58a]">Premium</div>
                  </div>

                  {comparisonRows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_120px_120px] border-b border-border last:border-b-0">
                      <div className="px-5 py-3 text-sm text-foreground">{row.label}</div>
                      <div className="flex items-center justify-center border-l border-border px-5 py-3">
                        <ComparisonValue value={row.free} />
                      </div>
                      <div className="flex items-center justify-center border-l border-[#ffd76a]/35 bg-[#fff7d4]/65 px-5 py-3 dark:border-[#ffe58a]/15 dark:bg-[#f6c236]/10">
                        <ComparisonValue value={row.premium} premium />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <aside className="min-w-0">
            <Card className="sticky top-4 rounded-3xl border-[#ffd76a]/55 bg-gradient-to-br from-[#fffdf0] via-card to-[#ffd85a]/18 p-5 shadow-md shadow-[#ffd85a]/15 dark:border-[#ffe58a]/25 dark:from-[#0f1522] dark:via-[#111827] dark:to-[#2a1b06] dark:shadow-[#f6c236]/10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff9df] via-[#ffd85a] to-[#e3a51b] text-[#8a5a12] shadow-sm ring-1 ring-[#ffd76a]/70 dark:from-[#3a2508] dark:via-[#8a5a12] dark:to-[#f6c236] dark:text-[#fff7d4] dark:ring-[#ffe58a]/30">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-[#3a2403] dark:text-foreground">Thanh toán PayOS</p>
                  <p className="text-sm text-[#6f4708] dark:text-muted-foreground">Tóm tắt đơn hàng</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl border border-[#ffd76a]/45 bg-white/45 p-4 dark:border-[#ffe58a]/20 dark:bg-[#0f172a]/75">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#7a5a20] dark:text-slate-300">Gói</span>
                  <span className="font-semibold text-[#3a2403] dark:text-foreground">{selectedPlan.name}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#7a5a20] dark:text-slate-300">Thời hạn</span>
                  <span className="font-semibold text-[#3a2403] dark:text-foreground">{selectedPlan.duration}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-[#7a5a20]/25 pt-3 dark:border-[#ffe58a]/20">
                  <span className="text-sm font-semibold text-[#3a2403] dark:text-foreground">Tổng cộng</span>
                  <span className="text-xl font-bold text-[#8a5a12] dark:text-[#ffe58a]">{formatCurrency(selectedPlan.price)}</span>
                </div>
              </div>

              {isCreatingPayment && !activePayment && (
                <div className="mt-3 rounded-2xl border border-dashed border-[#ffd76a]/50 bg-white/60 p-3 shadow-sm dark:border-[#ffe58a]/20 dark:bg-[#0f172a]/70">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 w-28 rounded bg-muted" />
                    <div className="flex items-center justify-center">
                      <div className="h-[200px] w-[200px] rounded-xl bg-muted" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-5/6 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              )}

              {activePayment && (
                <div className="mt-5 rounded-2xl border border-[#ffd76a]/45 bg-white p-4 shadow-sm dark:border-[#ffe58a]/20 dark:bg-[#0f172a]">
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", statusMeta.className)}>
                      {StatusIcon && <StatusIcon className={cn("h-3.5 w-3.5", isCheckingPayment && "animate-spin")} />}
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-white p-3 shadow-inner dark:bg-white">
                    {qrValue ? (
                      <QRCodeSVG value={qrValue} size={200} level="M" includeMargin />
                    ) : (
                      <div className="text-xs text-muted-foreground">Không có QR</div>
                    )}

                    <div className="w-full space-y-1 text-[11px] text-slate-600 dark:text-black">
                      <div className="flex items-center justify-between gap-2">
                        <span className="whitespace-nowrap">Ngân hàng</span>
                        <span className="font-semibold text-slate-800 dark:text-black whitespace-nowrap">{activePayment.bankName || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="whitespace-nowrap">Số tài khoản</span>
                        <span className="font-semibold text-slate-800 dark:text-black whitespace-nowrap">{activePayment.accountNumber || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="whitespace-nowrap">Số tiền</span>
                        <span className="font-semibold text-slate-800 dark:text-black whitespace-nowrap">{formatCurrency(activePayment.amount || selectedPlan.price)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="whitespace-nowrap">Nội dung</span>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-800 dark:text-black whitespace-nowrap">{activePayment.description || `IEMS-${activePayment.orderCode}`}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyDescription(activePayment.description || `IEMS-${activePayment.orderCode}`)}
                            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-foreground transition hover:bg-muted dark:border-slate-300 dark:bg-white dark:text-black dark:hover:bg-slate-100"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedDescription ? "Đã copy" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {paymentStatus === "TIMEOUT" && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300">
                      Đã hết thời gian chờ. Bạn có thể tạo mã mới để tiếp tục thanh toán.
                    </div>
                  )}
                </div>
              )}

              <Button
                type="button"
                onClick={handlePayOSCheckout}
                disabled={isCreatingPayment}
                className="mt-5 h-11 w-full rounded-xl bg-gradient-to-r from-[#ffd85a] to-[#e3a51b] font-semibold text-[#3a2403] shadow-sm shadow-[#ffd85a]/35 hover:from-[#ffe16f] hover:to-[#f0b72a]"
              >
                {isCreatingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreatingPayment ? "Đang tạo mã QR..." : activePayment ? "Tạo mã QR mới" : "Tạo mã QR thanh toán"}
              </Button>

              {paymentError ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              ) : (
                <p className="mt-3 text-center text-xs text-muted-foreground">

                </p>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
