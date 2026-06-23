import React from "react";
import Avatar from "@/components/ui/Avatar";

export default function IssueAvatar({ name, user, src, size = "sm", className = "" }) {
  // Map size prop: "sm" maps to "xs" (w-6 h-6), other sizes map to "sm" (w-8 h-8)
  const avatarSize = size === "sm" ? "xs" : "sm";
  return (
    <Avatar
      user={user}
      src={src}
      name={name}
      size={avatarSize}
      className={className}
    />
  );
}
