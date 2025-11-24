import React from "react";
import { cn } from "@/lib/utils";

const accentMap = {
	blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
	indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
	purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300",
	green: "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-300",
	orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300",
	red: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300",
	gray: "bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-200",
};

const helperToneMap = {
	muted: "text-xs text-muted-foreground",
	positive: "text-xs text-green-600 dark:text-green-400",
	negative: "text-xs text-red-600 dark:text-red-400",
	accent: "text-xs text-blue-600 dark:text-blue-300",
};

export default function StatsCard({
	title,
	value,
	helper,
	icon,
	accent = "blue",
	change,
	changeVariant = "muted",
	trend,
	trendUp,
	className = "",
}) {
	const accentClasses = accentMap[accent] || accentMap.blue;

	let helperText = helper || null;
	let helperTone = helper ? "muted" : "muted";

	if (!helperText && change) {
		helperText = change;
		helperTone = changeVariant;
	}

	if (!helperText && trend) {
		helperText = trend;
		helperTone = trendUp ? "positive" : "negative";
	}

	const helperClass =
		helperToneMap[helperTone] ||
		(helperTone === "accent"
			? helperToneMap.accent
			: helperTone === "positive"
			? helperToneMap.positive
			: helperTone === "negative"
			? helperToneMap.negative
			: helperToneMap.muted);

	return (
		<div
			className={cn(
				"rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition sm:p-5 dark:border-gray-800 dark:bg-gray-900",
				className
			)}
		>
			<div className="flex items-center gap-4">
				{icon ? (
					<div className={cn("rounded-lg p-3", accentClasses)}>
						{React.isValidElement(icon) ? React.cloneElement(icon, { className: cn("h-5 w-5", icon.props?.className) }) : icon}
					</div>
				) : null}
				<div>
					<p className="text-sm text-muted-foreground">{title}</p>
					<p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">{value}</p>
					{helperText ? <p className={cn("mt-1", helperClass)}>{helperText}</p> : null}
				</div>
			</div>
		</div>
	);
}
