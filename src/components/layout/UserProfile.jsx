import React from "react";
import { Link } from "react-router-dom";
import { User2, ChevronUp, CreditCard, Bell, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext.jsx";

export default function UserProfile() {
	const { t } = useTranslation();
	const { logout, userProfile } = useAuth();

	// Format user data from API response
	const user = userProfile ? {
		firstName: userProfile.firstName || '',
		lastName: userProfile.lastName || '',
		name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'User',
		email: userProfile.email || '',
		role: userProfile.role || '',
		avatar: userProfile.image || null,
	} : {
		firstName: '',
		lastName: '',
		name: "User",
		email: "",
		role: "",
		avatar: null,
	};

	const handleLogout = () => {
		logout();
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
							<Avatar user={user} size="sm" />
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">{user.name}</span>
								<span className="truncate text-xs text-sidebar-foreground/70">{user.email}</span>
							</div>
							<ChevronUp className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side="bottom"
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar user={user} size="sm" />
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">{user.name}</span>
									<span className="truncate text-xs text-muted-foreground">{user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link to="/profile" className="cursor-pointer">
								<User2 className="mr-2 h-4 w-4" />
								<span>{t('userProfile.account')}</span>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to="/settings" className="cursor-pointer">
								<CreditCard className="mr-2 h-4 w-4" />
								<span>{t('userProfile.settings')}</span>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to="/notifications" className="cursor-pointer">
								<Bell className="mr-2 h-4 w-4" />
								<span>{t('userProfile.notifications')}</span>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
							<LogOut className="mr-2 h-4 w-4" />
							<span>{t('userProfile.logout')}</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
