import React from "react";

function getInitialsFromName(name = "") {
	const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "U";
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getSizeClasses(size) {
	switch (size) {
		case "xs":
			return "w-6 h-6 text-xs";
		case "sm":
			return "w-8 h-8 text-sm";
		case "md":
			return "w-10 h-10 text-base";
		case "lg":
			return "w-12 h-12 text-lg";
		case "xl":
			return "w-16 h-16 text-xl";
		case "2xl":
			return "w-20 h-20 text-2xl";
		default:
			return null;
	}
}

function getColorClasses(key) {
	if (!key) return "bg-gray-500 text-white";
	const colors = [
		"bg-blue-500 text-white",
		"bg-green-500 text-white",
		"bg-purple-500 text-white",
		"bg-pink-500 text-white",
		"bg-indigo-500 text-white",
		"bg-yellow-500 text-white",
		"bg-red-500 text-white",
		"bg-teal-500 text-white",
	];
	const index = String(key).charCodeAt(0) % colors.length;
	return colors[index];
}

export default function Avatar({ user, src, name = "", size = "md", className = "" }) {
	// Resolve image source flexibly:
	// - If `src` prop provided, use it.
	// - If `user` is a string and looks like a URL, use it.
	// - Otherwise scan `user` keys (top-level and one-level nested objects) and pick the first value
	//   whose key name contains common image indicators (image, avatar, photo, picture, url, src)
	const looksLikeUrl = (v) => typeof v === 'string' && v.length > 0 && /^(https?:)?\/\//i.test(v);
	const looksLikeRelativeImagePath = (v) => typeof v === 'string' && /^(\/|\.\.?\/).+/i.test(v);

	let imageSrc = src;
	if (!imageSrc && typeof user === 'string') {
		if (looksLikeUrl(user)) imageSrc = user;
	}

	const isValidImageValue = (v) => {
		if (!v) return false;
		if (typeof v === 'string') {
			const trimmed = v.trim();
			if (trimmed === '' || trimmed.toLowerCase() === 'null') return false;
			return (
				looksLikeUrl(trimmed) ||
				looksLikeRelativeImagePath(trimmed) ||
				trimmed.startsWith('data:image/') ||
				trimmed.startsWith('blob:') ||
				/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(trimmed)
			);
		}
		return false;
	};

	if (!imageSrc && user && typeof user === 'object') {
		const keys = Object.keys(user);
		// Prefer keys that include these substrings
		const preferredSubstrings = ['image', 'avatar', 'photo', 'picture', 'url', 'src'];

		// First pass: direct keys that look like image values
		for (const k of keys) {
			const val = user[k];
			if (isValidImageValue(val)) {
				imageSrc = val;
				break;
			}
		}

		// Second pass: prefer keys whose name includes preferred substrings
		if (!imageSrc) {
			for (const k of keys) {
				const lname = k.toLowerCase();
				if (preferredSubstrings.some(s => lname.includes(s))) {
					const val = user[k];
					if (isValidImageValue(val)) {
						imageSrc = val;
						break;
					}
					// if nested object, try nested keys
					if (val && typeof val === 'object') {
						for (const nk of Object.keys(val)) {
							const nval = val[nk];
							if (isValidImageValue(nval)) {
								imageSrc = nval;
								break;
							}
						}
						if (imageSrc) break;
					}
				}
			}
		}

		// Third pass: scan nested objects one level deep for any image-looking value
		if (!imageSrc) {
			for (const k of keys) {
				const val = user[k];
				if (val && typeof val === 'object') {
					for (const nk of Object.keys(val)) {
						const nval = val[nk];
						if (isValidImageValue(nval)) {
							imageSrc = nval;
							break;
						}
					}
					if (imageSrc) break;
				}
			}
		}
	}
	const displayName = name || user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "User";

	const numericSize = typeof size === 'number' ? `${size * 0.25}rem` : undefined;
	const sizeClasses = typeof size === 'string' ? getSizeClasses(size) : null;

	const colorClasses = getColorClasses(user?.firstName || displayName.charAt(0));

	const wrapperClass = `${sizeClasses ? sizeClasses : ''} ${colorClasses} rounded-full flex items-center justify-center font-semibold overflow-hidden ${className}`.trim();

	return (
		<div
			className={wrapperClass}
			style={numericSize ? { width: numericSize, height: numericSize } : undefined}
			title={displayName}
		>
			{imageSrc ? (
				<img src={imageSrc} alt={displayName} className="h-full w-full object-cover" />
			) : (
				<span className="select-none">{getInitialsFromName(displayName)}</span>
			)}
		</div>
	);
}
