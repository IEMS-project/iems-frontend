import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useBreadcrumb } from "../../context/BreadcrumbContext";
import { cn } from "@/lib/utils";

// Route mapping
const routeMap = {
  "/dashboard": "Bảng điều khiển",
  "/projects": "Dự án",
  "/tasks": "Nhiệm vụ",
  "/calendar": "Lịch",
  "/messages": "Tin nhắn",
  "/chatbot": "Trợ lý AI",
  "/documents": "Tài liệu",
  "/departments": "Phòng ban",
  "/profile": "Hồ sơ",
  "/notifications": "Thông báo",
  "/admin": "Quản trị",
  "/admin/access-control": "Phân quyền",
  "/projects/overview": "Tổng quan",
  "/projects/tasks": "Nhiệm vụ",
  "/projects/timeline": "Tiến độ",
  "/projects/members": "Thành viên",
};

const segmentMap = {
  "overview": "Tổng quan",
  "tasks": "Nhiệm vụ",
  "timeline": "Tiến độ",
  "members": "Thành viên",
  "settings": "Cài đặt",
  "documents": "Tài liệu",
  "messages": "Tin nhắn",
  "departments": "Phòng ban",
  "profile": "Hồ sơ",
  "notifications": "Thông báo",
  "calendar": "Lịch",
  "access-control": "Phân quyền",
  "access": "Phân quyền",
};

export default function Breadcrumb() {
  const location = useLocation();
  const params = useParams();
  const { customBreadcrumbs } = useBreadcrumb();
  
  // If custom breadcrumbs are provided, use them
  if (customBreadcrumbs && Array.isArray(customBreadcrumbs) && customBreadcrumbs.length > 0) {
    return (
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          {customBreadcrumbs.map((crumb, index) => {
            const isLast = index === customBreadcrumbs.length - 1;
            // Last item should be bold (current location)
            const isCurrentLocation = isLast && !crumb.onClick && !crumb.to;
            return (
              <li key={index} className="flex items-center gap-1.5">
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(
                    "text-foreground",
                    isCurrentLocation && "font-semibold"
                  )}>{crumb.label}</span>
                )}
                {!isLast && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
  
  // Split pathname into segments
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  // Build breadcrumb items
  const breadcrumbs = [];
  
  // If at root, just show home
  if (pathSegments.length === 0) {
    breadcrumbs.push({ label: "Trang chủ", to: null });
  } else {
    // Always add home as first item
    breadcrumbs.push({ label: "Trang chủ", to: "/" });
    
    // Build path progressively
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Check if it's a dynamic route (like :projectId)
      if (segment.match(/^[a-f0-9-]{36}$/i) || segment.match(/^\d+$/)) {
        // It's likely an ID, try to get a meaningful name from params or use generic
        const paramKey = Object.keys(params).find(key => params[key] === segment);
        if (paramKey === "projectId") {
          breadcrumbs.push({ label: "Chi tiết dự án", to: null });
        } else if (paramKey === "departmentId") {
          breadcrumbs.push({ label: "Chi tiết phòng ban", to: null });
        } else {
          breadcrumbs.push({ label: "Chi tiết", to: null });
        }
      } else {
        // Regular route segment - check routeMap first
        const label = routeMap[currentPath] || segmentMap[segment.toLowerCase()] || segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({ 
          label, 
          to: isLast ? null : currentPath 
        });
      }
    });
  }
  
  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
              {!isLast && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

