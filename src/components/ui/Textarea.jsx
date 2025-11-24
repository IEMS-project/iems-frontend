import React from "react";

export default function Textarea({ label, error, className = "", ...props }) {
	return (
		<label className="block w-full text-foreground">
			{label && <span className="mb-1 block text-sm font-medium">{label}</span>}
			<textarea
				className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''} ${className}`}
				rows={4}
				{...props}
			/>
			{error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
		</label>
	);
}
