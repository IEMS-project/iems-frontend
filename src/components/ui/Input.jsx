import React from "react";

export default function Input({ label, error, className = "", ...props }) {
	// Normalize null/undefined values to empty string to keep inputs controlled
	const { value, ...restProps } = props;
	const safeValue = value === null || value === undefined ? "" : value;
	return (
		<label className="block">
			{label && <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>}
			<input
				className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''} ${className}`}
				{...restProps}
				value={safeValue}
			/>
			{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
		</label>
	);
}
