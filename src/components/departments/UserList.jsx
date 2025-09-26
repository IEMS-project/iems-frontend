import React from "react";
import UserAvatar from "../ui/UserAvatar";

export default function UserList({ users, maxDisplay = 3, size = "sm" }) {
    if (!users || users.length === 0) {
        return null;
    }

    const displayUsers = users.slice(0, maxDisplay);
    const remainingCount = users.length - maxDisplay;

    return (
        <div className="flex items-center gap-1">
            {displayUsers.map((user, index) => (
                <UserAvatar 
                    key={user.id || index} 
                    user={user} 
                    size={size} 
                    className="border-2 border-white dark:border-gray-800 -ml-1 first:ml-0"
                    title={user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : `User ID: ${user.userId}`}
                />
            ))}
            {remainingCount > 0 && (
                <div 
                    className={`${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center font-semibold text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800 -ml-1`}
                    title={`${remainingCount} thành viên khác`}
                >
                    +{remainingCount}
                </div>
            )}
        </div>
    );
}