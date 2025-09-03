import React from "react";

export function Card({ className = "", children }) {
	return (
		<div className={`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}>
			{children}
		</div>
	);
}

export function CardHeader({ className = "", children }) {
	return (
		<div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-800 ${className}`}>
			{children}
		</div>
	);
}

export function CardTitle({ className = "", children }) {
	return <h3 className={`text-base font-semibold ${className}`}>{children}</h3>;
}

export function CardContent({ className = "", children }) {
	return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ className = "", children }) {
	return (
		<div className={`px-4 py-3 border-t border-gray-200 dark:border-gray-800 ${className}`}>
			{children}
		</div>
	);
}
