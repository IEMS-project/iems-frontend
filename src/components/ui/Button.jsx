import React from "react";

const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants = {
	primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
	secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
	ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800",
	danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
	success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500"
};

const sizes = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-12 px-6 text-base"
};

export default function Button({
	type = "button",
	variant = "primary",
	size = "md",
	className = "",
	children,
	...props
}) {
	return (
		<button type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
			{children}
		</button>
	);
}
