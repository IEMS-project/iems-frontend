import React from "react";

export function NavLink({ to, label }) {
	return (
		<a href={to} className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white">
			{label}
			<span className="float-right text-xs text-gray-400">›</span>
		</a>
	);
}
