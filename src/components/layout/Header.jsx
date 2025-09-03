import React from "react";
import Avatar from "../ui/Avatar";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function Header({ onToggleSidebar, onOpenChat }) {
	return (
		<header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
			<div className="flex items-center gap-2">
				<Button variant="secondary" size="sm" className="px-2 md:hidden" onClick={onToggleSidebar}>☰</Button>
				<div className="hidden font-semibold md:block">IEMS</div>
			</div>
			<div className="hidden w-96 md:block">
				<Input placeholder="Tìm kiếm..." />
			</div>
			<div className="flex items-center gap-3">
				<Button variant="secondary" size="sm" onClick={onOpenChat}>💬</Button>
				<Avatar name="Admin User" />
			</div>
		</header>
	);
}
