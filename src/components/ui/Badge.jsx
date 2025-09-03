import React from "react";

const variants = {
	gray: "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700",
	blue: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-800",
	green: "bg-green-100 text-green-700 ring-green-200 dark:bg-green-900/40 dark:text-green-200 dark:ring-green-800",
	yellow: "bg-yellow-100 text-yellow-800 ring-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-100 dark:ring-yellow-800",
	red: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-900/40 dark:text-red-200 dark:ring-red-800"
};

export default function Badge({ variant = "gray", className = "", children }) {
	return (
		<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${variants[variant]} ${className}`}>
			{children}
		</span>
	);
}
