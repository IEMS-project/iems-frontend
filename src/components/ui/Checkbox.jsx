import React from "react";

export default function Checkbox({ label, className = "", ...props }) {
	return (
		<label className={`inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 ${className}`}>
			<input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700" {...props} />
			{label && <span>{label}</span>}
		</label>
	);
}
