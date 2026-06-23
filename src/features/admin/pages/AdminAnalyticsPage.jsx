import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  RefreshCw,
  Users,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminAnalyticsData } from "@/features/admin/api/adminAnalyticsService";
import { cn } from "@/lib/utils";

const PERIODS = {
  week: { label: "Theo tuần", buckets: 8 },
  month: { label: "Theo tháng", buckets: 6 },
  quarter: { label: "Theo quý", buckets: 4 },
};

const PROJECT_STATUS_LABELS = {
  PLANNING: "Lên kế hoạch",
  ACTIVE: "Đang dùng",
  IN_PROGRESS: "Đang dùng",
  COMPLETED: "Hoàn thành",
  ARCHIVED: "Lưu trữ",
  CANCELLED: "Đã hủy",
};

function formatMoney(value, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day + 1);
  return result;
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function buildRevenueBuckets(payments, period) {
  const now = new Date();
  const paid = payments.filter((payment) => String(payment.status).toUpperCase() === "PAID");
  const count = PERIODS[period]?.buckets || 6;

  const buckets = Array.from({ length: count }, (_, index) => {
    if (period === "week") {
      const start = startOfWeek(new Date(now));
      start.setDate(start.getDate() - (count - 1 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return {
        key: start.toISOString(),
        label: `${start.getDate()}/${start.getMonth() + 1}`,
        start,
        end,
        value: 0,
        count: 0,
      };
    }

    if (period === "quarter") {
      const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const start = addMonths(currentQuarterStart, -(count - 1 - index) * 3);
      const end = addMonths(start, 3);
      return {
        key: start.toISOString(),
        label: `Q${Math.floor(start.getMonth() / 3) + 1}/${start.getFullYear()}`,
        start,
        end,
        value: 0,
        count: 0,
      };
    }

    const start = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    const end = addMonths(start, 1);
    return {
      key: start.toISOString(),
      label: `T${start.getMonth() + 1}/${String(start.getFullYear()).slice(2)}`,
      start,
      end,
      value: 0,
      count: 0,
    };
  });

  paid.forEach((payment) => {
    const date = parseDate(payment.paidAt || payment.updatedAt || payment.createdAt);
    if (!date) return;
    const bucket = buckets.find((item) => date >= item.start && date < item.end);
    if (!bucket) return;
    bucket.value += Number(payment.amountPaid || payment.amount || 0);
    bucket.count += 1;
  });

  return buckets;
}

function normalizeStatus(status) {
  const raw = String(status || "UNKNOWN").toUpperCase();
  if (["ACTIVE", "IN_PROGRESS"].includes(raw)) return "ACTIVE";
  return raw;
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function RevenueChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      <div className="flex h-56 items-end gap-3 border-b border-border pb-3">
        {data.map((item) => (
          <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end rounded-md bg-muted/50 px-2">
              <div
                className="w-full rounded-t-md bg-blue-500 transition-all"
                style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%` }}
                title={`${item.label}: ${formatMoney(item.value)}`}
              />
            </div>
            <div className="w-full truncate text-center text-xs text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((item) => (
          <div key={`${item.key}-summary`} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{formatMoney(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectStatusList({ projects }) {
  const rows = useMemo(() => {
    const counts = projects.reduce((acc, project) => {
      const status = normalizeStatus(project.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const total = projects.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        status,
        count,
        percent: Math.round((count / total) * 100),
      }));
  }, [projects]);

  if (rows.length === 0) {
    return <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">Chưa có dự án.</div>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.status} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>{PROJECT_STATUS_LABELS[row.status] || row.status}</span>
            <span className="text-muted-foreground">{row.count} dự án</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.percent}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState({ accounts: [], totalAccounts: 0, payments: [], totalPayments: 0, projects: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getAdminAnalyticsData());
    } catch (err) {
      setError(err?.message || "Không tải được dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const paidPayments = useMemo(
    () => data.payments.filter((payment) => String(payment.status).toUpperCase() === "PAID"),
    [data.payments]
  );
  const totalRevenue = useMemo(
    () => paidPayments.reduce((sum, payment) => sum + Number(payment.amountPaid || payment.amount || 0), 0),
    [paidPayments]
  );
  const activeProjects = useMemo(
    () => data.projects.filter((project) => normalizeStatus(project.status) === "ACTIVE").length,
    [data.projects]
  );
  const activeAccounts = useMemo(
    () => data.accounts.filter((account) => account.enabled !== false).length,
    [data.accounts]
  );
  const premiumAccounts = useMemo(
    () => data.accounts.filter((account) => String(account.subscriptionType).toUpperCase() === "PREMIUM").length,
    [data.accounts]
  );
  const revenueBuckets = useMemo(() => buildRevenueBuckets(data.payments, period), [data.payments, period]);
  const recentPayments = useMemo(() => data.payments.slice(0, 6), [data.payments]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Thống kê hệ thống</h2>
          <p className="text-sm text-muted-foreground">Tổng quan user, doanh thu, giao dịch và dự án đang được sử dụng.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng user" value={formatNumber(data.totalAccounts)} subtitle={`${formatNumber(activeAccounts)} tài khoản đang hoạt động`} icon={Users} />
        <StatCard title="User online" value="0" subtitle="Chưa bật presence/heartbeat realtime" icon={Wifi} />
        <StatCard title="Doanh thu đã thanh toán" value={formatMoney(totalRevenue)} subtitle={`${formatNumber(paidPayments.length)} giao dịch PAID`} icon={CreditCard} />
        <StatCard title="Dự án đang sử dụng" value={formatNumber(activeProjects)} subtitle={`${formatNumber(data.projects.length)} dự án tổng cộng`} icon={BriefcaseBusiness} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard title="Premium users" value={formatNumber(premiumAccounts)} subtitle="Tài khoản subscription PREMIUM" icon={Activity} />
        <StatCard title="Tổng giao dịch" value={formatNumber(data.totalPayments)} subtitle="Bao gồm pending/cancelled/failed" icon={BarChart3} />
        <StatCard title="Khoảng dữ liệu" value={PERIODS[period].label} subtitle="Đổi ở biểu đồ doanh thu bên dưới" icon={CalendarDays} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Doanh thu</CardTitle>
            <div className="inline-flex rounded-md border border-border bg-background p-1">
              {Object.entries(PERIODS).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm transition-colors",
                    period === key ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-64 animate-pulse rounded-md bg-muted" /> : <RevenueChart data={revenueBuckets} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái dự án</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-48 animate-pulse rounded-md bg-muted" /> : <ProjectStatusList projects={data.projects} />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[150px_1fr_140px_110px_170px] bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
              <span>Order</span>
              <span>Plan</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Created</span>
            </div>
            {recentPayments.map((payment) => (
              <div key={payment.id || payment.orderCode} className="grid grid-cols-[150px_1fr_140px_110px_170px] items-center border-t border-border px-3 py-3 text-sm">
                <span className="truncate">{payment.orderCode || payment.orderId || "-"}</span>
                <span className="truncate">{payment.planName || payment.planId || "-"}</span>
                <span>{formatMoney(payment.amountPaid || payment.amount, payment.currency || "VND")}</span>
                <span>{payment.status || "-"}</span>
                <span>{payment.createdAt ? new Date(payment.createdAt).toLocaleString("vi-VN") : "-"}</span>
              </div>
            ))}
            {!loading && recentPayments.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">Chưa có giao dịch.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
