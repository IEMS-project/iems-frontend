import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  FolderKanban,
  CheckSquare,
  Calendar,
  MessageSquare,
  Bot,
  FileText,
  Users,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTheme } from "@/theme/ThemeProvider";
import Toggle from "@/components/ui/Toggle";
import UserProfile from "@/components/layout/UserProfile";
import { projectService } from "@/services/projectService";
import { useUnreadCounts } from "@/context/UnreadCountsContext";
import { getStoredTokens } from "@/lib/api";

export function AppSidebar() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const { getTotal, refreshUnreadCounts } = useUnreadCounts();
  const hasUnread = getTotal() > 0;

  // Check if user has IAM ADMIN role
  const isIamAdmin = useMemo(() => {
    const tokens = getStoredTokens();
    const roles = tokens?.userInfo?.roles || [];
    return Array.isArray(roles) && roles.includes("ADMIN");
  }, []);

  // Menu items (excluding Projects as it's handled separately)
  const allItems = [
    {
      title: t("sidebar.dashboard"),
      url: "/dashboard",
      icon: Home,
    },
    {
      title: t("sidebar.tasks"),
      url: "/tasks",
      icon: CheckSquare,
    },

    {
      title: t("sidebar.messages"),
      url: "/messages",
      icon: MessageSquare,
    },
    {
      title: t("sidebar.chatbot"),
      url: "/chatbot",
      icon: Bot,
    },
    {
      title: t("sidebar.documents"),
      url: "/documents",
      icon: FileText,
    },
    // Departments removed from backend
    // {
    //   title: t('sidebar.departments'),
    //   url: "/departments",
    //   icon: Users,
    // },
    {
      title: t("sidebar.accessControl"),
      url: "/admin/access-control",
      icon: Shield,
      requiresAdmin: true, // Only show for IAM ADMIN
    },
  ];

  // Filter items based on user role
  const items = useMemo(() => {
    return allItems.filter((item) => {
      if (item.requiresAdmin) {
        return isIamAdmin;
      }
      return true;
    });
  }, [isIamAdmin, t]);

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const data = await projectService.getMyProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading projects:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  // Đảm bảo sidebar luôn có số tin nhắn chưa đọc mới nhất,
  // ngay cả khi người dùng chưa mở trang Tin nhắn.
  useEffect(() => {
    if (refreshUnreadCounts) {
      refreshUnreadCounts().catch(() => {});
    }
  }, [refreshUnreadCounts]);

  // Check if current path is a project detail page
  const isProjectDetailPage =
    location.pathname.startsWith("/projects/") &&
    location.pathname !== "/projects";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-base font-bold">
                  I
                </div>
                {!collapsed && (
                  <div className="flex flex-col">
                    <div className="text-base font-semibold leading-tight">
                      {t("sidebar.appName")}
                    </div>
                    <div className="text-xs text-sidebar-foreground/70">
                      {t("sidebar.appDescription")}
                    </div>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.mainFeatures")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard - always on top */}
              {items
                .filter((item) => item.url === "/dashboard")
                .map((item) => {
                  const isActive = location.pathname === item.url;
                  const showUnreadBadge = item.url === "/messages" && hasUnread;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                      >
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-2"
                        >
                          <item.icon />
                          <span>{item.title}</span>
                          {showUnreadBadge && (
                            <span className="ml-auto inline-flex h-2 w-2 rounded-full bg-destructive" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}

              {/* Projects - always below Dashboard with submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={t("sidebar.projects")}
                  isActive={
                    location.pathname === "/projects" || isProjectDetailPage
                  }
                >
                  <NavLink to="/projects">
                    <FolderKanban />
                    <span>{t("sidebar.projects")}</span>
                  </NavLink>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {/* All Projects Link */}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={location.pathname === "/projects"}
                    >
                      <NavLink to="/projects">
                        <span>{t("sidebar.allProjects")}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {loadingProjects ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton disabled>
                        <span>{t("sidebar.loading")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : projects.length === 0 ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton disabled>
                        <span>{t("sidebar.noProjects")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : (
                    projects.map((project) => {
                      const isActive = location.pathname.startsWith(
                        `/projects/${project.id}`,
                      );
                      return (
                        <SidebarMenuSubItem key={project.id}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <NavLink to={`/projects/${project.id}/overview`}>
                              <span className="truncate">{project.name}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })
                  )}
                </SidebarMenuSub>
              </SidebarMenuItem>

              {/* Other menu items (except Dashboard, which is already rendered) */}
              {items
                .filter((item) => item.url !== "/dashboard")
                .map((item) => {
                  const isActive = location.pathname === item.url;
                  const showUnreadBadge = item.url === "/messages" && hasUnread;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                      >
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-2"
                        >
                          <item.icon />
                          <span>{item.title}</span>
                          {showUnreadBadge && (
                            <span className="ml-auto inline-flex h-2 w-2 rounded-full bg-destructive" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Theme Toggle */}
              <SidebarMenuItem>
                {collapsed ? (
                  <SidebarMenuButton
                    tooltip={
                      theme === "dark"
                        ? t("sidebar.lightMode")
                        : t("sidebar.darkMode")
                    }
                    onClick={toggleTheme}
                  >
                    {theme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </SidebarMenuButton>
                ) : (
                  <div className="flex w-full items-center justify-between rounded-md px-2 py-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      {theme === "dark" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                      <span>{t("sidebar.darkMode")}</span>
                    </div>
                    <Toggle checked={theme === "dark"} onChange={toggleTheme} />
                  </div>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* User Profile */}
        <SidebarGroup>
          <SidebarGroupContent>
            <UserProfile />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
