import React from "react";

const variants = {
	info: "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:ring-blue-800",
	success: "bg-green-50 text-green-800 ring-green-200 dark:bg-green-900/30 dark:text-green-100 dark:ring-green-800",
	warning: "bg-yellow-50 text-yellow-800 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-100 dark:ring-yellow-800",
	error: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-900/30 dark:text-red-100 dark:ring-red-800",
};

export default function Alert({ variant = "info", title, children, className = "" }) {
	return (
		<div className={`w-full rounded-md p-3 text-sm ring-1 ring-inset ${variants[variant]} ${className}`}>
			{title && <div className="mb-1 font-semibold">{title}</div>}
			{children}
		</div>
	);
}
