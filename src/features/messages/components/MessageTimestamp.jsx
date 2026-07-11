import React from "react";
import { formatChatDate, formatChatTime, parseChatDate } from "@/features/messages/utils/chatTime";

// Format timestamp to show "HH:MM Hôm nay", "HH:MM Hôm qua", etc.
const formatMessageTimestamp = (date) => {
    const messageDate = parseChatDate(date);
    if (!messageDate) return "";
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeString = formatChatTime(date, {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Check if today
    if (messageDate.toDateString() === today.toDateString()) {
        return `${timeString} Hôm nay`;
    }

    // Check if yesterday
    if (messageDate.toDateString() === yesterday.toDateString()) {
        return `${timeString} Hôm qua`;
    }

    // Check if within this week
    const daysAgo = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
        const dayName = formatChatDate(date, { weekday: 'long' });
        return `${timeString} ${dayName}`;
    }

    // Older messages - show date
    const dateString = formatChatDate(date, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    return `${timeString} ${dateString}`;
};

export default function MessageTimestamp({ date }) {
    return (
        <div className="flex justify-center my-3">
            <div className="bg-muted/80 text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                {formatMessageTimestamp(date)}
            </div>
        </div>
    );
}
