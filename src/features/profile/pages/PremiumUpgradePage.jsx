import { useMemo, useState } from "react";
import { Check, CreditCard, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PLANS = [
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
  const [selectedPlanId, setSelectedPlanId] = useState("month");
  const selectedPlan = useMemo(
    () => PLANS.find((plan) => plan.id === selectedPlanId) || PLANS[1],
    [selectedPlanId]
  );

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 rounded-3xl border border-[#ffd76a]/60 bg-gradient-to-br from-[#fffdf0] via-[#fff7d4] to-[#ffe16f]/55 p-5 shadow-sm shadow-[#ffd85a]/20 dark:border-[#ffe58a]/25 dark:from-[#0f1522] dark:via-[#111827] dark:to-[#3a2508] dark:shadow-[#f6c236]/10">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ffd76a]/80 bg-white/60 px-3 py-1 text-xs font-semibold text-[#9a640d] shadow-sm dark:border-[#ffe58a]/40 dark:bg-[#f6c236]/12 dark:text-[#ffe58a]">
            <Sparkles className="h-3.5 w-3.5" />
            Premium
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#3a2403] dark:text-foreground md:text-3xl">
            Chọn gói thanh toán
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
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

                  {COMPARISON_ROWS.map((row) => (
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

              <Button type="button" className="mt-5 h-11 w-full rounded-xl bg-gradient-to-r from-[#ffd85a] to-[#e3a51b] font-semibold text-[#3a2403] shadow-sm shadow-[#ffd85a]/35 hover:from-[#ffe16f] hover:to-[#f0b72a]">
                Thanh toán qua PayOS
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Chờ nối API tạo payment link PayOS.
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
