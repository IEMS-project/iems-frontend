import React from "react";
import Avatar from "@/components/ui/Avatar";
import { textColors, bgColors, borderColors } from "@/theme/colors";

export default function UserList({ users, maxDisplay = 3, size = "sm" }) {
    if (!users || users.length === 0) {
        return null;
    }

    const displayUsers = users.slice(0, maxDisplay);
    const remainingCount = users.length - maxDisplay;

    return (
        <div className="flex items-center gap-1">
            {displayUsers.map((user, index) => (
                <Avatar
                    key={user.id || index}
                    user={user}
                    size={size}
                    className={`border-2 ${borderColors.light} -ml-1 first:ml-0`}
                    title={user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : `User ID: ${user.userId}`}
                />
            ))}
            {remainingCount > 0 && (
                <div
                    className={`${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} ${bgColors.secondary} rounded-full flex items-center justify-center font-semibold ${textColors.secondary} border-2 ${borderColors.light} -ml-1`}
                    title={`${remainingCount} thành viên khác`}
                >
                    +{remainingCount}
                </div>
            )}
        </div>
    );
}