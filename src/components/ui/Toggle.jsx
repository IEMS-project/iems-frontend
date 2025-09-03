import React from "react";

export default function Toggle({ checked, onChange, className = "" }) {
	return (
		<button
			role="switch"
			aria-checked={checked}
			onClick={() => onChange && onChange(!checked)}
			className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'} ${className}`}
		>
			<span
				className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-1'}`}
			/>
		</button>
	);
}
