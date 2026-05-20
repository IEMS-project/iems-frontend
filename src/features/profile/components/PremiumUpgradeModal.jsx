import React, { useState } from "react";
import {
  FaTimes,
  FaCheck,
  FaCrown,
  FaRocket,
  FaBolt,
  FaShieldAlt,
  FaHeadset,
  FaInfinity,
  FaChartBar,
  FaUsers,
  FaLock,
  FaStar,
} from "react-icons/fa";
import { cn, textColors, borderColors, buttonColors } from "@/theme/colors";

/* ─────────────────────────── Feature rows ─────────────────────────── */
const FEATURES = [
  { label: "Số lượng dự án", free: "Tối đa 5 dự án", premium: "Không giới hạn", freeOk: false, premiumOk: true },
  { label: "Dung lượng lưu trữ", free: "2 GB", premium: "100 GB", freeOk: false, premiumOk: true },
  { label: "Thành viên mỗi dự án", free: "Tối đa 5 người", premium: "Không giới hạn", freeOk: false, premiumOk: true },
  { label: "Tích hợp GitHub", free: true, premium: true, freeOk: true, premiumOk: true },
  { label: "Quản lý issue & sprint", free: true, premium: true, freeOk: true, premiumOk: true },
  { label: "Bảng Kanban", free: true, premium: true, freeOk: true, premiumOk: true },
  { label: "Báo cáo & phân tích nâng cao", free: false, premium: true, freeOk: false, premiumOk: true },
  { label: "AI hỗ trợ & gợi ý thông minh", free: false, premium: true, freeOk: false, premiumOk: true },
  { label: "Xuất báo cáo PDF / Excel", free: false, premium: true, freeOk: false, premiumOk: true },
  { label: "Quản lý tài liệu không giới hạn", free: false, premium: true, freeOk: false, premiumOk: true },
  { label: "Thông báo real-time ưu tiên", free: false, premium: true, freeOk: false, premiumOk: true },
  { label: "Hỗ trợ kỹ thuật ưu tiên 24/7", free: false, premium: true, freeOk: false, premiumOk: true },
  { label: "Tuỳ chỉnh giao diện & thương hiệu", free: false, premium: true, freeOk: false, premiumOk: true },
  { label: "Lịch sử hoạt động không giới hạn", free: "30 ngày", premium: "Vĩnh viễn", freeOk: false, premiumOk: true },
  { label: "Bảo mật SSO / 2FA", free: false, premium: true, freeOk: false, premiumOk: true },
];

/* ─────────────────────────── Helpers ─────────────────────────────── */
function FeatureCell({ value, isOk }) {
  if (typeof value === "boolean") {
    return isOk ? (
      <FaCheck className="mx-auto text-emerald-500 text-base" />
    ) : (
      <FaTimes className="mx-auto text-gray-300 dark:text-gray-600 text-base" />
    );
  }
  return (
    <span
      className={cn(
        "text-sm font-medium",
        isOk ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
      )}
    >
      {value}
    </span>
  );
}

/* ─────────────────────────── Main modal ──────────────────────────── */
export default function PremiumUpgradeModal({ isOpen, onClose }) {
  const [billing, setBilling] = useState("yearly"); // "monthly" | "yearly"

  if (!isOpen) return null;

  const monthlyPrice = 9.99;
  const yearlyPrice = 7.99;
  const currentPrice = billing === "yearly" ? yearlyPrice : monthlyPrice;
  const yearlySaving = Math.round(((monthlyPrice - yearlyPrice) / monthlyPrice) * 100);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal panel */}
      <div
        className={cn(
          "relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col",
          "bg-white dark:bg-gray-900 border",
          borderColors.medium
        )}
        style={{ animation: "premiumModalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        {/* ── Close button ── */}
        <button
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-colors",
            "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
          aria-label="Đóng"
        >
          <FaTimes className="h-4 w-4" />
        </button>

        {/* ── Header ── */}
        <div className="px-8 pt-8 pb-6 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <FaCrown className="text-white h-4 w-4" />
            </div>
            <h2 className={cn("text-2xl font-bold", textColors.primary)}>
              Nâng cấp lên Premium
            </h2>
          </div>
          <p className={cn("text-sm mt-1 ml-12", textColors.secondary)}>
            Mở khoá toàn bộ tính năng và nâng trải nghiệm làm việc của bạn lên tầm cao mới.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center gap-4 mt-5">
            <span className={cn("text-sm font-medium", billing === "monthly" ? textColors.primary : textColors.secondary)}>
              Hàng tháng
            </span>
            <button
              onClick={() => setBilling(b => b === "monthly" ? "yearly" : "monthly")}
              className={cn(
                "relative h-6 w-12 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400",
                billing === "yearly" ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                  billing === "yearly" ? "translate-x-6" : "translate-x-0"
                )}
              />
            </button>
            <span className={cn("text-sm font-medium", billing === "yearly" ? textColors.primary : textColors.secondary)}>
              Hàng năm
            </span>
            {billing === "yearly" && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                Tiết kiệm {yearlySaving}%
              </span>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-8 pb-8">
          {/* Plan cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Free plan card */}
            <div className={cn("rounded-xl border p-5", borderColors.medium, "bg-gray-50 dark:bg-gray-800/50")}>
              <div className="flex items-center gap-2 mb-3">
                <FaRocket className="text-gray-400 h-4 w-4" />
                <span className={cn("font-semibold text-base", textColors.secondary)}>Gói Thường</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className={cn("text-3xl font-bold", textColors.primary)}>Miễn phí</span>
              </div>
              <p className={cn("text-xs", textColors.secondary)}>Dành cho cá nhân & nhóm nhỏ</p>
            </div>

            {/* Premium plan card */}
            <div
              className="rounded-xl border-2 border-amber-400 dark:border-amber-500 p-5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(249,115,22,0.08) 100%)",
              }}
            >
              {/* Popular badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wide">
                PHỔ BIẾN
              </div>
              <div className="flex items-center gap-2 mb-3">
                <FaCrown className="text-amber-500 h-4 w-4" />
                <span className="font-semibold text-base text-amber-600 dark:text-amber-400">Premium</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  ${currentPrice.toFixed(2)}
                </span>
                <span className={cn("text-sm mb-1", textColors.secondary)}>/tháng</span>
              </div>
              {billing === "yearly" && (
                <p className="text-xs text-gray-400 line-through mb-0.5">${monthlyPrice.toFixed(2)}/tháng</p>
              )}
              <p className={cn("text-xs", textColors.secondary)}>
                {billing === "yearly"
                  ? `Thanh toán $${(yearlyPrice * 12).toFixed(2)}/năm`
                  : "Thanh toán hàng tháng"}
              </p>
            </div>
          </div>

          {/* Comparison table */}
          <div className={cn("rounded-xl border overflow-hidden", borderColors.medium)}>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_140px_140px] bg-gray-50 dark:bg-gray-800/60">
              <div className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", textColors.secondary)}>
                Tính năng
              </div>
              <div className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center", textColors.secondary)}>
                Thường
              </div>
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center text-amber-600 dark:text-amber-400">
                Premium ✦
              </div>
            </div>

            {/* Feature rows */}
            {FEATURES.map((feat, idx) => (
              <div
                key={feat.label}
                className={cn(
                  "grid grid-cols-[1fr_140px_140px] items-center border-t",
                  borderColors.light,
                  idx % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/20"
                )}
              >
                <div className={cn("px-4 py-3 text-sm", textColors.primary)}>{feat.label}</div>
                <div className="px-4 py-3 text-center">
                  <FeatureCell value={feat.free} isOk={feat.freeOk} />
                </div>
                <div className="px-4 py-3 text-center">
                  <FeatureCell value={feat.premium} isOk={feat.premiumOk} />
                </div>
              </div>
            ))}
          </div>

          {/* Perks strip */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: FaShieldAlt, label: "Bảo mật dữ liệu", color: "text-blue-500" },
              { icon: FaHeadset, label: "Hỗ trợ ưu tiên", color: "text-purple-500" },
              { icon: FaBolt, label: "Hiệu suất cao", color: "text-amber-500" },
              { icon: FaStar, label: "Cập nhật sớm", color: "text-emerald-500" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border text-center",
                  borderColors.light,
                  "bg-gray-50/60 dark:bg-gray-800/30"
                )}
              >
                <Icon className={cn("h-5 w-5", color)} />
                <span className={cn("text-xs font-medium", textColors.secondary)}>{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-white text-base shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-700"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
              }}
            >
              <FaCrown className="h-4 w-4" />
              Nâng cấp ngay — ${currentPrice.toFixed(2)}/tháng
            </button>
            <button
              onClick={onClose}
              className={cn(
                "w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-medium border transition-colors",
                borderColors.medium,
                textColors.secondary,
                "hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              Có thể sau
            </button>
          </div>

          <p className={cn("text-center text-xs mt-3", textColors.secondary)}>
            Miễn phí dùng thử 14 ngày · Không cần thẻ tín dụng · Huỷ bất cứ lúc nào
          </p>
        </div>
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes premiumModalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
      `}</style>
    </div>
  );
}
