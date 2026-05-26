import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { cn } from "@/lib/utils";

export default function Breadcrumb() {
  const location = useLocation();
  const params = useParams();
  const { customBreadcrumbs } = useBreadcrumb();
  const { t } = useTranslation();

  // Route mapping using translation keys
  const getRouteLabel = (path) => {
    const routeKeyMap = {
      "/dashboard": "breadcrumb.dashboard",
      "/projects": "breadcrumb.projects",
      "/messages": "breadcrumb.messages",
      "/chatbot": "breadcrumb.chatbot",
      "/documents": "breadcrumb.documents",
      "/profile": "breadcrumb.profile",
      "/notifications": "breadcrumb.notifications",
      "/admin": "breadcrumb.admin",
      "/admin/access-control": "breadcrumb.accessControl",
      "/projects/overview": "breadcrumb.overview",
      "/projects/tasks": "breadcrumb.tasks",
      "/projects/timeline": "breadcrumb.timeline",
      "/projects/members": "breadcrumb.members",
    };
    return routeKeyMap[path];
  };

  const getSegmentLabel = (segment) => {
    const segmentKeyMap = {
      "overview": "breadcrumb.overview",
      "tasks": "breadcrumb.tasks",
      "timeline": "breadcrumb.timeline",
      "members": "breadcrumb.members",
      "settings": "breadcrumb.settings",
      "documents": "breadcrumb.documents",
      "messages": "breadcrumb.messages",
      "profile": "breadcrumb.profile",
      "notifications": "breadcrumb.notifications",
      "access-control": "breadcrumb.accessControl",
      "access": "breadcrumb.accessControl",
    };
    return segmentKeyMap[segment.toLowerCase()];
  };

  // If custom breadcrumbs are provided, use them
  if (customBreadcrumbs && Array.isArray(customBreadcrumbs) && customBreadcrumbs.length > 0) {
    return (
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <ol className="flex min-w-0 items-center gap-1.5 rounded-full border border-border/60 bg-background/55 px-2.5 py-1.5 shadow-sm shadow-slate-900/[0.02] backdrop-blur">
          {customBreadcrumbs.map((crumb, index) => {
            const isLast = index === customBreadcrumbs.length - 1;
            // Last item should be bold (current location)
            const isCurrentLocation = isLast && !crumb.onClick && !crumb.to;
            return (
              <li key={index} className="flex items-center gap-1.5">
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="max-w-40 truncate text-muted-foreground transition-colors hover:text-primary"
                  >
                    {crumb.label}
                  </button>
                ) : crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="max-w-40 truncate text-muted-foreground transition-colors hover:text-primary"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(
                    "max-w-56 truncate text-foreground",
                    isCurrentLocation && "font-semibold"
                  )}>{crumb.label}</span>
                )}
                {!isLast && (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />
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
    breadcrumbs.push({ label: t('breadcrumb.home'), to: null });
  } else {
    // Always add home as first item
    breadcrumbs.push({ label: t('breadcrumb.home'), to: "/" });

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
          breadcrumbs.push({ label: t('breadcrumb.projectDetail'), to: null });
        } else {
          breadcrumbs.push({ label: t('breadcrumb.detail'), to: null });
        }
      } else {
        // Regular route segment - check route label first
        const routeKey = getRouteLabel(currentPath);
        const segmentKey = getSegmentLabel(segment);
        const label = routeKey ? t(routeKey) : segmentKey ? t(segmentKey) : segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({
          label,
          to: isLast ? null : currentPath
        });
      }
    });
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-1.5 rounded-full border border-border/60 bg-background/55 px-2.5 py-1.5 shadow-sm shadow-slate-900/[0.02] backdrop-blur">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="max-w-40 truncate text-muted-foreground transition-colors hover:text-primary"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="max-w-56 truncate font-semibold text-foreground">{crumb.label}</span>
              )}
              {!isLast && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

