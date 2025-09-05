import React, { useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import { FaUser, FaCog, FaSignOutAlt, FaChevronDown } from "react-icons/fa";

export default function UserProfile({ collapsed = false }) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	
	// Mock user data - trong thực tế sẽ lấy từ context hoặc API
	const user = {
		name: "Nguyễn Văn A",
		email: "nguyenvana@example.com",
		role: "Quản lý dự án",
		avatar: null, // URL ảnh đại diện nếu có
	};

	const handleLogout = () => {
		// Xử lý đăng xuất
		console.log("Đăng xuất");
		setIsDropdownOpen(false);
	};

	if (collapsed) {
		return (
			<div className="relative">
				<button
					onClick={() => setIsDropdownOpen(!isDropdownOpen)}
					className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
				>
					<Avatar src={user.avatar} name={user.name} size={8} />
				</button>
				
				{isDropdownOpen && (
					<>
						<div 
							className="fixed inset-0 z-10" 
							onClick={() => setIsDropdownOpen(false)}
						/>
						<div className="absolute bottom-0 left-full mb-2 ml-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-20">
							<div className="p-4 border-b border-gray-200 dark:border-gray-700">
								<div className="flex items-center gap-3">
									<Avatar src={user.avatar} name={user.name} size={12} />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
											{user.name}
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
											{user.email}
										</p>
									</div>
								</div>
							</div>
							<div className="p-2">
								<Link
									to="/profile"
									onClick={() => setIsDropdownOpen(false)}
									className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
								>
									<FaUser className="h-4 w-4" />
									Xem hồ sơ
								</Link>
								<button
									onClick={handleLogout}
									className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
								>
									<FaSignOutAlt className="h-4 w-4" />
									Đăng xuất
								</button>
							</div>
						</div>
					</>
				)}
			</div>
		);
	}

	return (
		<div className="relative">
			<button
				onClick={() => setIsDropdownOpen(!isDropdownOpen)}
				className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
			>
				<Avatar src={user.avatar} name={user.name} size={10} />
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
						{user.name}
					</p>
					<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
						{user.role}
					</p>
				</div>
				<FaChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
			</button>
			
			{isDropdownOpen && (
				<>
					<div 
						className="fixed inset-0 z-10" 
						onClick={() => setIsDropdownOpen(false)}
					/>
					<div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-20">
						<div className="p-4 border-b border-gray-200 dark:border-gray-700">
							<div className="flex items-center gap-3">
								<Avatar src={user.avatar} name={user.name} size={12} />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
										{user.name}
									</p>
									<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
										{user.email}
									</p>
								</div>
							</div>
						</div>
						<div className="p-2">
							<Link
								to="/profile"
								onClick={() => setIsDropdownOpen(false)}
								className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
							>
								<FaUser className="h-4 w-4" />
								Xem hồ sơ
							</Link>
							<Link
								to="/settings"
								onClick={() => setIsDropdownOpen(false)}
								className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
							>
								<FaCog className="h-4 w-4" />
								Cài đặt
							</Link>
							<button
								onClick={handleLogout}
								className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
							>
								<FaSignOutAlt className="h-4 w-4" />
								Đăng xuất
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
