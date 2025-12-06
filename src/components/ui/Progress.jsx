import React from "react";

export default function Progress({ value = 0, className = "" }) {
	const clamped = Math.max(0, Math.min(100, value));
	return (
		<div className={`w-full overflow-hidden rounded-full bg-muted ${className}`}>
			<div className="h-2 bg-blue-600 dark:bg-blue-400 transition-all" style={{ width: `${clamped}%` }} />
		</div>
	);
}
