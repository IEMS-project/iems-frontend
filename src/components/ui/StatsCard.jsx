import React from "react";
import Badge from "./Badge";

export default function StatsCard({ title, value, change, changeVariant = 'gray', icon, className = '' }) {
	return (
		<div className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}>
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
				{icon}
			</div>
			<div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
			{change !== undefined && (
				<div className="mt-2">
					<Badge variant={changeVariant}>{change}</Badge>
				</div>
			)}
		</div>
	);
}
