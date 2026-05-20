import React, { useState, useEffect, useCallback } from "react";
import {
  Crown, Search, RefreshCw, ChevronDown, ChevronUp,
  Calendar, Users, Check, X, AlertTriangle, Zap
} from "lucide-react";
import { iamService } from "@/features/admin/api/iamService";
import PremiumBadge from "@/components/ui/PremiumBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Duration presets ──────────────────────────────────────────────────────────
const DURATION_PRESETS = [
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: 30 },
  { label: "90 ngày", days: 90 },
  { label: "365 ngày", days: 365 },
];

// ── Subscription row ──────────────────────────────────────────────────────────
function AccountSubscriptionRow({ account, onUpgrade, onDowngrade }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);
  const [customDays, setCustomDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const isPremium = account.subscriptionType === "PREMIUM";
  const premiumUntil = account.premiumUntil;

  const isExpiringSoon = premiumUntil
    ? new Date(premiumUntil) - new Date() < 7 * 24 * 60 * 60 * 1000 && new Date(premiumUntil) > new Date()
    : false;

  const isExpired = premiumUntil ? new Date(premiumUntil) < new Date() : false;

  const handleUpgrade = async () => {
    const days = Number(customDays || selectedDays);
    if (!days || days < 1) return;
    setLoading(true);
    setMsg(null);
    try {
      await onUpgrade(account.id, days);
      setMsg({ type: "success", text: `✓ Đã nâng cấp Premium ${days} ngày` });
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Lỗi nâng cấp" });
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!window.confirm(`Hủy Premium của ${account.username}?`)) return;
    setLoading(true);
    setMsg(null);
    try {
      await onDowngrade(account.id);
      setMsg({ type: "success", text: "✓ Đã hạ xuống FREE" });
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Lỗi hạ cấp" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      isPremium
        ? "border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-900/10"
        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
    }`}>
      {/* Row header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          isPremium ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        }`}>
          {(account.username || "?")[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{account.username}</span>
            <PremiumBadge
              subscriptionType={account.subscriptionType}
              premiumUntil={account.premiumUntil}
              size="sm"
            />
            {isExpiringSoon && !isExpired && (
              <span className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-0.5 font-medium">
                <AlertTriangle size={10} /> Sắp hết hạn
              </span>
            )}
            {isExpired && isPremium && (
              <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Đã hết hạn</span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{account.email}</p>
        </div>

        {premiumUntil && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <Calendar size={12} />
            {new Date(premiumUntil).toLocaleDateString("vi-VN")}
          </div>
        )}

        <div className="text-slate-400 dark:text-slate-500 shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded controls */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800 mt-0 space-y-3">
          {/* Current status detail */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Gói hiện tại</span>
              <PremiumBadge subscriptionType={account.subscriptionType} premiumUntil={account.premiumUntil} showExpiry size="sm" />
            </div>
            {premiumUntil && (
              <div className="flex justify-between">
                <span className="text-slate-500">Hết hạn lúc</span>
                <span className={`font-medium ${isExpiringSoon || isExpired ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-200"}`}>
                  {new Date(premiumUntil).toLocaleString("vi-VN")}
                </span>
              </div>
            )}
          </div>

          {/* Upgrade section */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Nâng cấp Premium / Gia hạn
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map(p => (
                <button
                  key={p.days}
                  onClick={() => { setSelectedDays(p.days); setCustomDays(""); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedDays === p.days && !customDays
                      ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                      : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-amber-400"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="1"
                max="3650"
                placeholder="Số ngày tùy chỉnh..."
                value={customDays}
                onChange={e => { setCustomDays(e.target.value); setSelectedDays(null); }}
                className="flex-1 h-8 text-sm"
              />
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shrink-0"
                onClick={handleUpgrade}
                disabled={loading || !(customDays || selectedDays)}
              >
                <Crown size={13} className="mr-1" />
                {isPremium ? "Gia hạn" : "Nâng cấp"}
              </Button>
            </div>
          </div>

          {/* Downgrade (only if premium) */}
          {isPremium && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-slate-500 border-slate-300 dark:border-slate-600 hover:border-red-400 hover:text-red-600"
                onClick={handleDowngrade}
                disabled={loading}
              >
                <Zap size={12} className="mr-1" />
                Hạ xuống FREE
              </Button>
            </div>
          )}

          {/* Feedback */}
          {msg && (
            <p className={`text-xs font-medium flex items-center gap-1 ${msg.type === "success" ? "text-green-600" : "text-red-500"}`}>
              {msg.type === "success" ? <Check size={12} /> : <X size={12} />}
              {msg.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ accounts }) {
  const total = accounts.length;
  const premium = accounts.filter(a => a.subscriptionType === "PREMIUM").length;
  const expiringSoon = accounts.filter(a => {
    if (a.subscriptionType !== "PREMIUM" || !a.premiumUntil) return false;
    const diff = new Date(a.premiumUntil) - new Date();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {[
        { label: "Tổng tài khoản", value: total, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800" },
        { label: "Premium", value: premium, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", icon: <Crown size={14} /> },
        { label: "Sắp hết hạn", value: expiringSoon, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", icon: <AlertTriangle size={14} /> },
      ].map(s => (
        <div key={s.label} className={`rounded-xl p-3 ${s.bg}`}>
          <div className={`flex items-center gap-1.5 text-2xl font-bold ${s.color}`}>
            {s.icon}
            {s.value}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminSubscriptionPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "premium" | "free"
  const [error, setError] = useState(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await iamService.getAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const handleUpgrade = async (accountId, days) => {
    await iamService.upgradeAccountToPremium(accountId, days);
    await loadAccounts(); // refresh to get updated premiumUntil
  };

  const handleDowngrade = async (accountId) => {
    await iamService.downgradeAccountToFree(accountId);
    await loadAccounts();
  };

  const filtered = accounts.filter(a => {
    const matchSearch =
      a.username?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "premium" && a.subscriptionType === "PREMIUM") ||
      (filter === "free" && a.subscriptionType !== "PREMIUM");
    return matchSearch && matchFilter;
  });

  // Sort: expiring soon first, then premium, then free
  const sorted = [...filtered].sort((a, b) => {
    const aExpiring = a.subscriptionType === "PREMIUM" && a.premiumUntil && new Date(a.premiumUntil) - new Date() < 7 * 24 * 60 * 60 * 1000;
    const bExpiring = b.subscriptionType === "PREMIUM" && b.premiumUntil && new Date(b.premiumUntil) - new Date() < 7 * 24 * 60 * 60 * 1000;
    if (aExpiring && !bExpiring) return -1;
    if (!aExpiring && bExpiring) return 1;
    if (a.subscriptionType === "PREMIUM" && b.subscriptionType !== "PREMIUM") return -1;
    if (a.subscriptionType !== "PREMIUM" && b.subscriptionType === "PREMIUM") return 1;
    return (a.username || "").localeCompare(b.username || "");
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-background z-10">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Quản lý Premium</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nâng cấp và quản lý gói tài khoản</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={loadAccounts} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats */}
        {!loading && !error && <StatsBar accounts={accounts} />}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm theo username hoặc email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex gap-1 shrink-0">
            {[
              { key: "all", label: "Tất cả" },
              { key: "premium", label: "Premium", icon: <Crown size={11} /> },
              { key: "free", label: "Free", icon: <Zap size={11} /> },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f.key
                    ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Account list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-500">{error}</p>
            <Button size="sm" variant="outline" onClick={loadAccounts}>Thử lại</Button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500">Không tìm thấy tài khoản nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(account => (
              <AccountSubscriptionRow
                key={account.id}
                account={account}
                onUpgrade={handleUpgrade}
                onDowngrade={handleDowngrade}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
