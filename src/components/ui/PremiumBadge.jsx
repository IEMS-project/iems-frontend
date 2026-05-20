import React from "react";
import { Crown, Zap } from "lucide-react";

/**
 * PremiumBadge – shows PREMIUM or FREE tier visually.
 *
 * Props:
 *  subscriptionType  – "PREMIUM" | "FREE" | undefined
 *  premiumUntil      – ISO string or null
 *  size              – "sm" | "md" | "lg" (default "md")
 *  showExpiry        – show expiry date text (default false)
 */
export default function PremiumBadge({ subscriptionType, premiumUntil, size = "md", showExpiry = false }) {
  const isPremium = subscriptionType === "PREMIUM";

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-1 gap-1",
    lg: "text-sm px-3 py-1.5 gap-1.5",
  };

  const iconSize = { sm: 10, md: 12, lg: 14 }[size] || 12;

  if (isPremium) {
    const expiryText = premiumUntil
      ? new Date(premiumUntil).toLocaleDateString("vi-VN")
      : null;

    const isExpiringSoon = premiumUntil
      ? new Date(premiumUntil) - new Date() < 7 * 24 * 60 * 60 * 1000
      : false;

    return (
      <span className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]}
        bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm`}>
        <Crown size={iconSize} className="shrink-0" />
        PREMIUM
        {showExpiry && expiryText && (
          <span className={`ml-1 opacity-80 ${isExpiringSoon ? "text-red-100 font-bold" : ""}`}>
            · {isExpiringSoon ? "⚠ " : ""}hết {expiryText}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]}
      bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700`}>
      <Zap size={iconSize} className="shrink-0" />
      FREE
    </span>
  );
}
