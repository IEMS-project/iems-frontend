import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock, CreditCard, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext.jsx";
import { paymentService } from "@/features/payments/api/paymentService";
import { refreshAccessToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_CONTENT = {
  PAID: {
    icon: CheckCircle2,
    title: "Thanh toán thành công",
    message: "Gói Premium của bạn đã được kích hoạt hoặc gia hạn.",
    tone: "text-emerald-600",
  },
  PENDING: {
    icon: Clock,
    title: "Đang chờ xác nhận",
    message: "Thanh toán đang được xử lý. Bạn có thể kiểm tra lại sau vài giây.",
    tone: "text-amber-600",
  },
  PROCESSING: {
    icon: Clock,
    title: "Thanh toán đang xử lý",
    message: "payOS đang xử lý giao dịch. Vui lòng kiểm tra lại sau.",
    tone: "text-amber-600",
  },
  CANCELLED: {
    icon: XCircle,
    title: "Bạn đã hủy thanh toán",
    message: "Giao dịch chưa hoàn tất. Bạn có thể quay lại chọn gói và thanh toán lại.",
    tone: "text-slate-600 dark:text-slate-300",
  },
  FAILED: {
    icon: AlertCircle,
    title: "Thanh toán thất bại",
    message: "Giao dịch chưa được xác nhận thành công. Vui lòng thử lại hoặc chọn gói khác.",
    tone: "text-red-600",
  },
};

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 45;

function getInitialStatus(searchParams, preferredStatus) {
  if (preferredStatus === "CANCELLED") return "CANCELLED";
  if (searchParams.get("cancel") === "true") return "CANCELLED";

  const queryStatus = String(searchParams.get("status") || "").toUpperCase();
  if (["PAID", "PENDING", "PROCESSING", "CANCELLED", "FAILED"].includes(queryStatus)) {
    return queryStatus === "PAID" ? "PROCESSING" : queryStatus;
  }

  return preferredStatus || "PROCESSING";
}

export default function PaymentResultPage({ preferredStatus }) {
  const navigate = useNavigate();
  const { loadUserProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderCode");
  const [status, setStatus] = useState(() => getInitialStatus(searchParams, preferredStatus));
  const [payment, setPayment] = useState(null);
  const [refreshedSession, setRefreshedSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pollAttemptsRef = useRef(0);

  const content = useMemo(() => STATUS_CONTENT[status] || STATUS_CONTENT.PROCESSING, [status]);
  const Icon = content.icon;

  const loadStatus = useCallback(async () => {
    if (!orderCode) {
      setError("Không tìm thấy mã đơn hàng");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await paymentService.getPayOSPaymentStatus(orderCode);
      setPayment(data);
      setStatus(data?.status || "PROCESSING");

      if (data?.status === "PAID" && !refreshedSession) {
        try {
          await refreshAccessToken();
          await loadUserProfile();
          setRefreshedSession(true);
        } catch (refreshError) {
          console.warn("Payment succeeded but session refresh failed:", refreshError?.message);
        }
      }
    } catch (err) {
      setError(err?.message || "Không thể kiểm tra trạng thái thanh toán");
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile, orderCode, refreshedSession]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!orderCode) return undefined;
    if (!["PENDING", "PROCESSING"].includes(status)) return undefined;

    const timerId = setInterval(() => {
      if (loading) return;
      pollAttemptsRef.current += 1;
      if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        clearInterval(timerId);
        return;
      }
      loadStatus();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timerId);
  }, [loadStatus, loading, orderCode, status]);

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto px-4 py-8">
      <Card className="w-full max-w-xl rounded-2xl border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className={cn("mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted", content.tone)}>
            <Icon className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">{content.title}</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{content.message}</p>

          {orderCode && (
            <div className="mt-5 w-full rounded-xl border border-border bg-muted/35 p-4 text-left text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Mã thanh toán</span>
                <span className="font-semibold text-foreground">{orderCode}</span>
              </div>
              {payment?.amount && (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-semibold text-foreground">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(payment.amount)}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-5 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
            {(status === "PENDING" || status === "PROCESSING" || error) && (
              <Button type="button" onClick={loadStatus} disabled={loading} className="gap-2">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Kiểm tra lại
              </Button>
            )}

            {(status === "CANCELLED" || status === "FAILED") && (
              <Button type="button" onClick={() => navigate("/premium")} className="gap-2">
                <CreditCard className="h-4 w-4" />
                Thanh toán lại
              </Button>
            )}

            <Button type="button" variant="outline" onClick={() => navigate(status === "PAID" ? "/profile" : "/premium")}>
              {status === "PAID" ? "Về hồ sơ" : "Quay về gói Premium"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
