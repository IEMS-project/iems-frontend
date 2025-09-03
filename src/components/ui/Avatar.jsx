import React from "react";

function getInitials(name = "") {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({ src, name = "", size = 10, className = "" }) {
	const dimension = typeof size === 'number' ? `${size * 0.25}rem` : size; // tailwind size approximation
	return (
		<div
			className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200 ${className}`}
			style={{ width: dimension, height: dimension }}
		>
			{src ? (
				<img src={src} alt={name} className="h-full w-full object-cover" />
			) : (
				<span className="text-sm font-medium">{getInitials(name)}</span>
			)}
		</div>
	);
}
