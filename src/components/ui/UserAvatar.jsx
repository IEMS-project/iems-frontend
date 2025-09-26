import React from "react";

export default function UserAvatar({ user, size = "md", className = "" }) {
    const getInitials = (user) => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user?.firstName) {
            return user.firstName.charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return "U";
    };

    const getSizeClasses = (size) => {
        switch (size) {
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
                return "w-10 h-10 text-base";
        }
    };

    const getColorClasses = (user) => {
        if (user?.firstName) {
            const colors = [
                "bg-blue-500 text-white",
                "bg-green-500 text-white", 
                "bg-purple-500 text-white",
                "bg-pink-500 text-white",
                "bg-indigo-500 text-white",
                "bg-yellow-500 text-white",
                "bg-red-500 text-white",
                "bg-teal-500 text-white"
            ];
            const index = user.firstName.charCodeAt(0) % colors.length;
            return colors[index];
        }
        return "bg-gray-500 text-white";
    };

    return (
        <div className={`${getSizeClasses(size)} ${getColorClasses(user)} rounded-full flex items-center justify-center font-semibold ${className}`}>
            {getInitials(user)}
        </div>
    );
}

