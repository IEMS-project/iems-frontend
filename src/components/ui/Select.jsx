import React from "react";

export default function Select({ label, error, className = "", children, ...props }) {
	// Normalize null/undefined values to empty string to keep selects controlled
	const { value, ...restProps } = props;
	const safeValue = value === null || value === undefined ? "" : value;
	return (
		<label className="block text-foreground">
			{label && <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>}
			<select
				className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''} ${className}`}
				{...restProps}
				value={safeValue}
			>
				{children}
			</select>
			{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
		</label>
	);
}
