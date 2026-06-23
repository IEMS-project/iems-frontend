import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown, Zap, Check, X, Sparkles, ArrowRight,
  Users, GitBranch, Clock, Lock,
} from "lucide-react";
import { subscriptionLimitService } from "@/features/admin/api/subscriptionLimitService";

// ── Feature rows shown in the modal ──────────────────────────────────────────
const HIGHLIGHT_FEATURES = [
  { label: "Số project tạo được", free: "2", premium: "10" },
  { label: "Thành viên / project", free: "5", premium: "20" },
  { label: "Issues / project", free: "50", premium: "500" },
  { label: "Sprints / project", free: "2", premium: "10" },
  { label: "Custom Workflow & Roles", free: false, premium: true },
  { label: "Burndown Chart", free: false, premium: true },
  { label: "Issue Type & Priority tuỳ chỉnh", free: false, premium: true },
  { label: "Activity Log", free: "7 ngày", premium: "60 ngày" },
];

function FeatureValue({ value }) {
  if (value === true)
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
        <Check size={11} />
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
        <X size={11} />
      </span>
    );
  return <span className="text-sm font-medium">{value}</span>;
}

// ── PUBLIC EVENT NAME ─────────────────────────────────────────────────────────
export const PREMIUM_GATE_EVENT = "premium:required";

/** Dispatch this anywhere to open the modal with an optional reason message. */
export function triggerPremiumGate(message = "") {
  window.dispatchEvent(new CustomEvent(PREMIUM_GATE_EVENT, { detail: { message } }));
}

// ── Modal component ───────────────────────────────────────────────────────────
export default function PremiumGateModal() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [features, setFeatures] = useState(HIGHLIGHT_FEATURES);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      setReason(e.detail?.message || "");
      setOpen(true);
    };
    window.addEventListener(PREMIUM_GATE_EVENT, handler);
    return () => window.removeEventListener(PREMIUM_GATE_EVENT, handler);
  }, []);

  useEffect(() => {
    subscriptionLimitService.getLimits()
      .then((limits) => {
        const free = Array.isArray(limits) ? limits.find((item) => item.planType === "FREE") : null;
        const premium = Array.isArray(limits) ? limits.find((item) => item.planType === "PREMIUM") : null;
        if (!free || !premium) return;
        setFeatures([
          { label: "Số project tạo được", free: String(free.maxOwnedProjects), premium: String(premium.maxOwnedProjects) },
          { label: "Thành viên / project", free: String(free.maxMembersPerProject), premium: String(premium.maxMembersPerProject) },
          { label: "Issues / project", free: String(free.maxIssuesPerProject), premium: String(premium.maxIssuesPerProject) },
          { label: "Sprints / project", free: String(free.maxSprintsPerProject), premium: String(premium.maxSprintsPerProject) },
          { label: "Custom roles / project", free: String(free.maxCustomRolesPerProject), premium: String(premium.maxCustomRolesPerProject) },
          { label: "Custom Workflow", free: !!free.customWorkflowEnabled, premium: !!premium.customWorkflowEnabled },
          { label: "Burndown Chart", free: !!free.burndownEnabled, premium: !!premium.burndownEnabled },
          { label: "Issue Type & Priority tuỳ chỉnh", free: !!free.issueTypePriorityCustomizationEnabled, premium: !!premium.issueTypePriorityCustomizationEnabled },
          { label: "Activity Log", free: `${free.activityLogDays} ngày`, premium: `${premium.activityLogDays} ngày` },
        ]);
      })
      .catch(() => {});
  }, []);

  if (!open) return null;

  const handleClose = () => setOpen(false);
  const handleGoToPremium = () => {
    setOpen(false);
    navigate("/premium");
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ margin: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur">
              <Crown size={22} className="text-white drop-shadow" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Tính năng Premium</h2>
              <p className="text-sm text-white/80 mt-0.5">
                Nâng cấp để mở khoá tính năng này
              </p>
            </div>
          </div>

          {/* Reason badge */}
          {reason && (
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur text-sm text-white/90 flex items-start gap-2">
              <Lock size={14} className="mt-0.5 shrink-0 text-white/70" />
              <span>{reason}</span>
            </div>
          )}
        </div>

        {/* Feature table */}
        <div className="px-5 pt-4 pb-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
            {/* Table header */}
            <div className="grid grid-cols-3 text-center font-semibold border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="py-2 px-3 text-left text-slate-600 dark:text-slate-300">Tính năng</div>
              <div className="py-2 px-3 border-l border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                <Zap size={12} /> Free
              </div>
              <div className="py-2 px-3 border-l border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 bg-amber-50 dark:bg-amber-900/20">
                <Crown size={12} /> Premium
              </div>
            </div>

            {features.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="px-3 py-2 text-slate-700 dark:text-slate-300 flex items-center">{row.label}</div>
                <div className="px-3 py-2 border-l border-slate-100 dark:border-slate-800 flex items-center justify-center">
                  <FeatureValue value={row.free} />
                </div>
                <div className="px-3 py-2 border-l border-amber-100 dark:border-amber-900/30 flex items-center justify-center bg-amber-50/30 dark:bg-amber-900/5">
                  <FeatureValue value={row.premium} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA note */}
        <div className="px-5 py-3 mx-5 mb-1 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <span>
            Liên hệ <strong>Admin</strong> để nâng cấp. Admin sẽ kích hoạt gói Premium cho tài khoản hoặc project của bạn.
          </span>
        </div>

        {/* Footer buttons */}
        <div className="px-5 py-4 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleGoToPremium}
            className="px-4 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <Crown size={14} />
            Xem chi tiết Premium
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
