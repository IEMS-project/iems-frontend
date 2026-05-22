import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CreditCard, Crown, Megaphone, RefreshCw, Shield, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminPaymentService } from "@/features/admin/api/adminPaymentService";
import { adminPromotionService } from "@/features/admin/api/adminPromotionService";
import { adminSubscriptionService } from "@/features/admin/api/adminSubscriptionService";
import { subscriptionLimitService } from "@/features/admin/api/subscriptionLimitService";
import { cn } from "@/lib/utils";

const AccountManagementTab = lazy(() => import("@/features/admin/components/AccountManagementTab"));
const AdminAnalyticsPage = lazy(() => import("@/features/admin/pages/AdminAnalyticsPage"));

const EMPTY_PROMOTION = {
  title: "",
  description: "",
  imageUrl: "",
  ctaLabel: "Open",
  ctaUrl: "/premium",
  placement: "SIDEBAR",
  priority: 0,
  active: true,
  startsAt: "",
  endsAt: "",
};

function formatMoney(value, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
}

function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

function fromDateInput(value) {
  return value ? new Date(value).toISOString() : null;
}

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const PLAN_ORDER = ["week", "month", "year"];
const PLAN_LABELS = {
  week: { title: "Gói tuần", name: "Week", subtitle: "7 ngày", durationDays: 7, defaultPrice: 49000, sortOrder: 10 },
  month: { title: "Gói tháng", name: "Month", subtitle: "30 ngày", durationDays: 30, defaultPrice: 149000, sortOrder: 20 },
  year: { title: "Gói năm", name: "Year", subtitle: "365 ngày", durationDays: 365, defaultPrice: 1499000, sortOrder: 30 },
};

function normalizeFixedPlans(data = []) {
  const byCode = new Map((Array.isArray(data) ? data : []).map((plan) => [plan.code, plan]));
  return PLAN_ORDER.map((code) => {
    const meta = PLAN_LABELS[code];
    const existing = byCode.get(code);
    return {
      id: existing?.id || null,
      code,
      name: existing?.name || meta.name,
      description: existing?.description || meta.title,
      price: existing?.price ?? meta.defaultPrice,
      durationDays: existing?.durationDays || meta.durationDays,
      currency: existing?.currency || "VND",
      active: existing?.active ?? true,
      recommended: existing?.recommended ?? code === "month",
      sortOrder: existing?.sortOrder ?? meta.sortOrder,
      features: existing?.features || "",
      isMissing: !existing?.id,
    };
  });
}

function PlansTab() {
  const [plans, setPlans] = useState(() => normalizeFixedPlans([]));
  const [prices, setPrices] = useState(() => Object.fromEntries(normalizeFixedPlans([]).map((plan) => [plan.code, plan.price || 0])));
  const [savingCode, setSavingCode] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminSubscriptionService.getPlans();
      const fixedPlans = normalizeFixedPlans(data);
      setPlans(fixedPlans);
      setPrices(Object.fromEntries(fixedPlans.map((plan) => [plan.code, plan.price || 0])));
    } catch (err) {
      const fallbackPlans = normalizeFixedPlans([]);
      setPlans(fallbackPlans);
      setPrices(Object.fromEntries(fallbackPlans.map((plan) => [plan.code, plan.price || 0])));
      setError(err?.message || "Không tải được giá từ backend. Bạn vẫn có thể nhập giá rồi bấm lưu để tạo lại 3 gói.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updatePlanField = (code, field, value) => {
    setPlans((prev) => prev.map((plan) => {
      if (field === "recommended") {
        return { ...plan, recommended: plan.code === code ? value : false };
      }
      return plan.code === code ? { ...plan, [field]: value } : plan;
    }));
  };

  const applySavedPlans = (savedPlans) => {
    setPlans((prev) => prev.map((plan) => {
      const saved = savedPlans.find((item) => item?.code === plan.code);
      if (!saved) return plan;
      return { ...plan, ...saved, isMissing: false };
    }));
    setPrices((prev) => ({
      ...prev,
      ...Object.fromEntries(savedPlans.filter(Boolean).map((plan) => [plan.code, plan.price || 0])),
    }));
  };

  const savePlanPayload = async (plan) => {
    const payload = {
      ...plan,
      id: undefined,
      isMissing: undefined,
      price: Number(prices[plan.code] || 0),
      currency: plan.currency || "VND",
    };
    return plan.id
      ? adminSubscriptionService.updatePlan(plan.id, payload)
      : adminSubscriptionService.createPlan(payload);
  };

  const savePrice = async (plan) => {
    setSavingCode(plan.code);
    setMessage("");
    setError("");
    try {
      const saved = await savePlanPayload(plan);
      const otherRecommendedUpdates = plan.recommended
        ? plans.filter((item) => item.code !== plan.code && item.recommended).map((item) => savePlanPayload({ ...item, recommended: false }))
        : [];
      const savedOthers = await Promise.all(otherRecommendedUpdates);
      applySavedPlans([saved, ...savedOthers]);
      setMessage(`Đã lưu ${PLAN_LABELS[plan.code]?.title || plan.name}. Premium sẽ hiển thị theo giá mới.`);
    } catch (err) {
      setError(err?.message || "Không lưu được gói. Kiểm tra lại database/backend.");
    } finally {
      setSavingCode(null);
    }
  };

  const saveAllPrices = async () => {
    setSavingCode("all");
    setMessage("");
    setError("");
    try {
      const savedPlans = await Promise.all(plans.map(savePlanPayload));
      applySavedPlans(savedPlans);
      setMessage("Đã lưu giá, mô tả và gói recommended. Trang Premium sẽ render theo các giá này.");
    } catch (err) {
      setError(err?.message || "Không lưu được gói. Kiểm tra lại database/backend.");
    } finally {
      setSavingCode(null);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Giá gói subscription</h3>
            <p className="text-sm text-muted-foreground">Chỉ chỉnh giá cho 3 gói cố định: tuần, tháng, năm.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading || savingCode === "all"}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button onClick={saveAllPrices} disabled={loading || savingCode === "all"}>
              {savingCode === "all" ? "Đang lưu..." : "Lưu tất cả giá"}
            </Button>
          </div>
        </div>
        {message && (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground md:col-span-3">Loading prices...</div>
        ) : plans.map((plan) => (
          <div key={plan.code} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4">
              <div className="text-lg font-semibold">{PLAN_LABELS[plan.code]?.title || plan.name}</div>
              <div className="text-sm text-muted-foreground">{PLAN_LABELS[plan.code]?.subtitle || `${plan.durationDays} ngày`}</div>
              {plan.isMissing && (
                <div className="mt-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                  Chưa có trong backend, bấm lưu để tạo
                </div>
              )}
            </div>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Giá hiện tại</span>
              <Input
                type="number"
                min="0"
                step="1000"
                value={prices[plan.code] ?? 0}
                onChange={(e) => setPrices((prev) => ({ ...prev, [plan.code]: Number(e.target.value) }))}
              />
            </label>
            <label className="mt-3 block space-y-1 text-sm">
              <span className="text-muted-foreground">Mô tả hiển thị bên Premium</span>
              <textarea
                value={plan.description || ""}
                onChange={(e) => updatePlanField(plan.code, "description", e.target.value)}
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Nhập mô tả cho gói này..."
              />
            </label>
            <label className="mt-3 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <input
                type="radio"
                name="recommended-plan"
                checked={!!plan.recommended}
                onChange={() => updatePlanField(plan.code, "recommended", true)}
              />
              <span>Đặt làm gói recommended</span>
            </label>
            <div className="mt-3 text-sm font-medium">{formatMoney(prices[plan.code], plan.currency || "VND")}</div>
            <div className="mt-4">
              <Button className="w-full" onClick={() => savePrice(plan)} disabled={savingCode === plan.code}>
                {savingCode === plan.code ? "Đang lưu..." : plan.isMissing ? "Tạo và lưu giá" : "Lưu giá"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsTab() {
  const [page, setPage] = useState(null);
  const [status, setStatus] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPage(await adminPaymentService.getPayments({ status, page: pageIndex, size: pageSize, sort: "createdAt,desc" }));
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, status]);

  useEffect(() => { load(); }, [load]);
  const payments = page?.content || [];
  const totalPages = page?.totalPages || 0;
  const totalElements = page?.totalElements || 0;
  const canPrev = pageIndex > 0;
  const canNext = totalPages > 0 && pageIndex < totalPages - 1;

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPageIndex(0); }}
        >
          <option value="">All status</option>
          <option value="PENDING">PENDING</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="PAID">PAID</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="FAILED">FAILED</option>
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {totalElements} giao dịch
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[150px_1fr_130px_110px_160px_150px] bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
          <span>Order</span><span>Plan</span><span>Amount</span><span>Status</span><span>Created</span><span />
        </div>
        {payments.map((payment) => (
          <div key={payment.id} className="grid grid-cols-[150px_1fr_130px_110px_160px_150px] items-center border-t border-border px-3 py-3 text-sm">
            <span>{payment.orderCode}</span>
            <span>{payment.planName || payment.planId || "-"}</span>
            <span>{formatMoney(payment.amount, payment.currency || "VND")}</span>
            <span>{payment.status}</span>
            <span>{payment.createdAt ? new Date(payment.createdAt).toLocaleString("vi-VN") : "-"}</span>
            <span className="flex justify-end gap-1">
              <Button size="sm" variant="outline" onClick={() => adminPaymentService.syncPayment(payment.orderCode).then(load)}>Sync</Button>
              <Button size="sm" variant="ghost" onClick={() => adminPaymentService.cancelPayment(payment.orderCode).then(load)}>Cancel</Button>
            </span>
          </div>
        ))}
        {payments.length === 0 && <div className="p-4 text-sm text-muted-foreground">No payments found.</div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
        <div className="text-sm text-muted-foreground">
          Trang {totalPages === 0 ? 0 : pageIndex + 1} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPageIndex(0)} disabled={!canPrev || loading}>First</Button>
          <Button size="sm" variant="outline" onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))} disabled={!canPrev || loading}>Prev</Button>
          <Button size="sm" variant="outline" onClick={() => setPageIndex((prev) => prev + 1)} disabled={!canNext || loading}>Next</Button>
          <Button size="sm" variant="outline" onClick={() => setPageIndex(Math.max(totalPages - 1, 0))} disabled={!canNext || loading}>Last</Button>
        </div>
      </div>
    </div>
  );
}

function PromotionsTab() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_PROMOTION);
  const [editingId, setEditingId] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => setItems(await adminPromotionService.getPromotions()), []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const payload = { ...form, startsAt: fromDateInput(form.startsAt), endsAt: fromDateInput(form.endsAt) };
    if (editingId) await adminPromotionService.updatePromotion(editingId, payload);
    else await adminPromotionService.createPromotion(payload);
    setForm(EMPTY_PROMOTION);
    setEditingId(null);
    await load();
  };

  const handlePickImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError("");
    setImageUploading(true);
    try {
      const uploaded = await adminPromotionService.uploadPromotionImage(file);
      const item = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      const url = item?.url || "";
      if (!url) {
        throw new Error("Upload failed");
      }
      set("imageUrl", url);
    } catch (err) {
      setImageError(err?.message || "Upload failed");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
        <Input placeholder="title" value={form.title} onChange={(e) => set("title", e.target.value)} />
        <Input placeholder="placement" value={form.placement} onChange={(e) => set("placement", e.target.value.toUpperCase())} />
        <Input placeholder="cta label" value={form.ctaLabel || ""} onChange={(e) => set("ctaLabel", e.target.value)} />
        <Input placeholder="cta url" value={form.ctaUrl || ""} onChange={(e) => set("ctaUrl", e.target.value)} />
        <Input className="md:col-span-2" placeholder="description" value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
        <Input className="md:col-span-2" placeholder="image url" value={form.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} />
        <Input type="file" accept="image/*" disabled={imageUploading} onChange={handlePickImage} />
        <Input type="datetime-local" value={form.startsAt || ""} onChange={(e) => set("startsAt", e.target.value)} />
        <Input type="datetime-local" value={form.endsAt || ""} onChange={(e) => set("endsAt", e.target.value)} />
        <Input type="number" value={form.priority} onChange={(e) => set("priority", Number(e.target.value))} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.active} onChange={(e) => set("active", e.target.checked)} /> Active</label>
        <div className="flex gap-2 md:col-span-2">
          <Button onClick={submit}>{editingId ? "Save promotion" : "Create promotion"}</Button>
          {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY_PROMOTION); }}>Cancel</Button>}
        </div>
        {(form.imageUrl || imageUploading || imageError) && (
          <div className="md:col-span-4 flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="Promotion preview" className="h-14 w-24 rounded-md object-cover" />
            ) : (
              <div className="h-14 w-24 rounded-md border border-dashed border-border/70 bg-background/60" />
            )}
            <div className="min-w-0">
              {imageUploading ? "Uploading image..." : imageError || "Promotion image preview"}
            </div>
            {form.imageUrl && (
              <Button size="sm" variant="ghost" onClick={() => set("imageUrl", "")}>Clear</Button>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title || "Promotion"} className="h-12 w-20 rounded-md object-cover" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{item.placement} | priority {item.priority}</div>
                </div>
              </div>
              <button className={cn("rounded-full px-2 py-1 text-xs", item.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")} onClick={() => adminPromotionService.setPromotionActive(item.id, !item.active).then(load)}>
                {item.active ? "Active" : "Off"}
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                setEditingId(item.id);
                setForm({ ...item, startsAt: toDateInput(item.startsAt), endsAt: toDateInput(item.endsAt) });
              }}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => adminPromotionService.deletePromotion(item.id).then(load)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const LIMIT_FIELDS = [
  ["maxOwnedProjects", "Projects"],
  ["maxMembersPerProject", "Members/project"],
  ["maxIssuesPerProject", "Issues/project"],
  ["maxSprintsPerProject", "Sprints/project"],
  ["maxCustomRolesPerProject", "Custom roles/project"],
  ["activityLogDays", "Activity log days"],
];

const FEATURE_FIELDS = [
  ["customWorkflowEnabled", "Custom workflow"],
  ["burndownEnabled", "Burndown chart"],
  ["issueTypePriorityCustomizationEnabled", "Issue type & priority"],
];

function LimitsTab() {
  const [limits, setLimits] = useState([]);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => setLimits(await subscriptionLimitService.getLimits()), []);
  useEffect(() => { load(); }, [load]);

  const updateLocal = (planType, key, value) => {
    setLimits((prev) => prev.map((item) => item.planType === planType ? { ...item, [key]: value } : item));
  };

  const save = async (item) => {
    setSaving(item.planType);
    try {
      await subscriptionLimitService.updateLimits(item.planType, item);
      await load();
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      {limits.map((item) => (
        <div key={item.planType} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{item.planType}</h3>
              <p className="text-xs text-muted-foreground">Editable plan limits used by project enforcement and pricing pages.</p>
            </div>
            <Button onClick={() => save(item)} disabled={saving === item.planType}>
              {saving === item.planType ? "Saving..." : "Save"}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {LIMIT_FIELDS.map(([key, label]) => (
              <label key={key} className="space-y-1 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <Input type="number" min="0" value={item[key] ?? 0} onChange={(e) => updateLocal(item.planType, key, Number(e.target.value))} />
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-2">
            {FEATURE_FIELDS.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>{label}</span>
                <input type="checkbox" checked={!!item[key]} onChange={(e) => updateLocal(item.planType, key, e.target.checked)} />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminSubscriptionPage() {
  const [tab, setTab] = useState("plans");
  const tabs = useMemo(() => [
    { key: "accounts", label: "Accounts", icon: Shield },
    { key: "plans", label: "Plans", icon: Crown },
    { key: "limits", label: "Limits", icon: SlidersHorizontal },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "promotions", label: "Promote Area", icon: Megaphone },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
  ], []);
  const active = tabs.find((item) => item.key === tab) || tabs[1];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <SectionHeader icon={active.icon} title="Admin Subscription Center" />
      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} onClick={() => setTab(item.key)} className={cn("inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium", tab === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "accounts" && (
          <div className="p-4">
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading accounts...</div>}>
              <AccountManagementTab />
            </Suspense>
          </div>
        )}
        {tab === "plans" && <PlansTab />}
        {tab === "limits" && <LimitsTab />}
        {tab === "payments" && <PaymentsTab />}
        {tab === "promotions" && <PromotionsTab />}
        {tab === "analytics" && (
          <div className="p-4">
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading analytics...</div>}>
              <AdminAnalyticsPage />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
