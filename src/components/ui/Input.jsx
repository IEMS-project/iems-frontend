import React from "react";

export default function Input({ label, error, className = "", ...props }) {
	return (
		<label className="block w-full">
			{label && <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>}
			<input
				className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''} ${className}`}
				{...props}
			/>
			{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
		</label>
	);
}
