import React from "react";

export function Table({ children, className = "" }) {
	return (
		<div className={`w-full overflow-x-auto ${className}`}>
			<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
				{children}
			</table>
		</div>
	);
}

export function THead({ children }) {
	return (
		<thead className="bg-gray-50 dark:bg-gray-900/40">
			{children}
		</thead>
	);
}

export function TBody({ children }) {
	return <tbody className="divide-y divide-gray-200 dark:divide-gray-800">{children}</tbody>;
}

export function TR({ children }) {
	return <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">{children}</tr>;
}

export function TH({ children, className = "" }) {
	return <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${className}`}>{children}</th>;
}

export function TD({ children, className = "" }) {
	return <td className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-200 ${className}`}>{children}</td>;
}
