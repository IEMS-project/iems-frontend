import React, { useEffect, useState } from "react";

const variants = {
	info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800",
	success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-800",
	warning: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-800",
	error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-800",
};

export default function Alert({ 
	variant = "info", 
	message, 
	duration = 4000, 
	onClose,
	className = "" 
}) {
	const [show, setShow] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShow(false);
			if (onClose) onClose();
		}, duration);
		return () => clearTimeout(timer);
	}, [duration, onClose]);

	if (!show) return null;

	return (
		<div className={`fixed top-6 right-6 w-80 p-4 rounded-lg shadow-lg border-l-4 ${variants[variant]} ${className} z-50`}>
			<div className="flex items-center gap-3">
				<span className="flex-1 text-sm font-medium">{message}</span>
				<button
					onClick={() => {
						setShow(false);
						if (onClose) onClose();
					}}
					className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
				>
					✕
				</button>
			</div>
		</div>
	);
}
