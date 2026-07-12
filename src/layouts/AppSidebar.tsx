import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bot,
  Crown,
  FileText,
  FolderKanban,
  Home,
  MessageSquare,
  Shield,
  Sparkles,
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
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import UserProfile from "@/layouts/UserProfile";
import { projectService } from "@/features/projects/api/projectService";
import ProjectAvatar from "@/features/projects/components/ProjectAvatar";
import { hydrateProjectsWithAvatars } from "@/features/projects/utils/projectAvatars";
import { useUnreadCounts } from "@/context/UnreadCountsContext";
import { getStoredTokens } from "@/lib/api";
import { cn } from "@/lib/utils";

function SidebarNavLink({ item, isActive, hasUnread }) {
  if (!item) return null;

  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={isActive}
        className={cn(
          "h-9 rounded-lg border border-transparent px-2.5 text-sidebar-foreground/82 transition-colors hover:border-primary/15 hover:bg-primary/10 hover:text-primary",
          "data-[active=true]:border-primary/25 data-[active=true]:bg-primary/12 data-[active=true]:font-semibold data-[active=true]:text-primary"
        )}
      >
        <NavLink to={item.url} className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{item.title}</span>
          {hasUnread && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function isActiveProject(project) {
  const status = String(project?.status || "").toUpperCase();
  if (status === "IN_PROGRESS") return true;
  if (["COMPLETED", "CANCELLED", "ON_HOLD"].includes(status)) return false;
  if (!project?.startDate || !project?.endDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(project.startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(project.endDate);
  end.setHours(23, 59, 59, 999);

  return start <= today && today <= end;
}

export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const { getTotal, refreshUnreadCounts } = useUnreadCounts();
  const hasUnread = getTotal() > 0;

  const isIamAdmin = useMemo(() => {
    const tokens = getStoredTokens();
    const roles = tokens?.userInfo?.roles || [];
    return Array.isArray(roles) && roles.includes("ADMIN");
  }, []);

  const navItems = useMemo(
    () => [
      { title: t("sidebar.dashboard"), url: "/dashboard", icon: Home },
      { title: t("sidebar.messages"), url: "/messages", icon: MessageSquare },
      { title: t("sidebar.chatbot"), url: "/chatbot", icon: Bot },
      { title: t("sidebar.documents"), url: "/documents", icon: FileText },
      { title: "Admin", url: "/admin", icon: Shield, requiresAdmin: true },
    ],
    [t]
  );

  const items = useMemo(
    () => navItems.filter((item) => !item.requiresAdmin || isIamAdmin),
    [isIamAdmin, navItems]
  );

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const data = await projectService.getMyProjects();
        const hydratedProjects = await hydrateProjectsWithAvatars(data);
        setProjects(hydratedProjects.filter(isActiveProject));
      } catch (error) {
        console.error("Error loading projects:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();

    const handleProjectsChanged = (event) => {
      const deletedProjectId = event?.detail?.deletedProjectId;
      if (deletedProjectId) {
        setProjects((prev) => prev.filter((project) => String(project.id) !== String(deletedProjectId)));
      }
      loadProjects();
    };

    window.addEventListener("projects:changed", handleProjectsChanged);
    return () => window.removeEventListener("projects:changed", handleProjectsChanged);
  }, []);

  useEffect(() => {
    if (refreshUnreadCounts) {
      refreshUnreadCounts().catch(() => {});
    }
  }, [refreshUnreadCounts]);

  const isProjectDetailPage =
    location.pathname.startsWith("/projects/") &&
    location.pathname !== "/projects";

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border/70 bg-sidebar/72 backdrop-blur-xl dark:bg-sidebar/68">
      <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-12 rounded-xl border border-transparent text-sidebar-foreground hover:border-primary/15 hover:bg-primary/10 hover:text-primary"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-sidebar-border">
                  <img
                    src="/iems_logo.png"
                    alt="IEMS"
                    className="h-full w-full object-cover"
                  />
                </div>
                {!collapsed && (
                  <div className="flex min-w-0 flex-col">
                    <div className="truncate text-sm font-semibold leading-tight">
                      {t("sidebar.appName")}
                    </div>
                    <div className="truncate text-xs text-sidebar-foreground/62">
                      Quản lý dự án thông minh
                    </div>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/58">
            {t("sidebar.mainFeatures")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarNavLink
                item={items.find((item) => item.url === "/dashboard")}
                isActive={location.pathname === "/dashboard"}
                hasUnread={false}
              />

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={t("sidebar.projects")}
                  isActive={location.pathname === "/projects" || isProjectDetailPage}
                  className="h-9 rounded-lg border border-transparent px-2.5 text-sidebar-foreground/82 transition-colors hover:border-primary/15 hover:bg-primary/10 hover:text-primary data-[active=true]:border-primary/25 data-[active=true]:bg-primary/12 data-[active=true]:font-semibold data-[active=true]:text-primary"
                >
                  <NavLink to="/projects">
                    <FolderKanban className="h-4 w-4" />
                    <span>{t("sidebar.projects")}</span>
                  </NavLink>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-4 border-sidebar-border/70 py-1">
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={location.pathname === "/projects"}
                      className="text-sidebar-foreground/76 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/12 data-[active=true]:font-medium data-[active=true]:text-primary"
                    >
                      <NavLink to="/projects">
                        <span>{t("sidebar.allProjects")}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {loadingProjects ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton disabled className="text-sidebar-foreground/58 opacity-100">
                        <span>{t("sidebar.loading")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : projects.length === 0 ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton disabled className="text-sidebar-foreground/58 opacity-100">
                        <span>{t("sidebar.noProjects")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : (
                    projects.map((project) => {
                      const isActive = location.pathname.startsWith(`/projects/${project.id}`);
                      return (
                        <SidebarMenuSubItem key={project.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive}
                            className="text-sidebar-foreground/76 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/12 data-[active=true]:font-medium data-[active=true]:text-primary"
                          >
                            <NavLink to={`/projects/${project.id}/overview`}>
                              <ProjectAvatar project={project} size="xs" className="h-5 w-5" />
                              <span className="truncate">{project.name}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })
                  )}
                </SidebarMenuSub>
              </SidebarMenuItem>

              {items
                .filter((item) => item.url !== "/dashboard")
                .map((item) => (
                  <SidebarNavLink
                    key={item.url}
                    item={item}
                    isActive={location.pathname === item.url}
                    hasUnread={item.url === "/messages" && hasUnread}
                  />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 px-3 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {collapsed ? (
                  <SidebarMenuButton
                    tooltip="Gói Premium"
                    asChild
                    className="text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-300 dark:hover:bg-amber-400/10 dark:hover:text-amber-200"
                  >
                    <NavLink to="/premium">
                      <Crown className="h-4 w-4" />
                    </NavLink>
                  </SidebarMenuButton>
                ) : (
                  <NavLink
                    to="/premium"
                    className="group/premium flex w-full items-center gap-3 rounded-xl border border-[#ffd76a]/90 bg-gradient-to-br from-[#fff9df] via-[#ffd85a] to-[#e3a51b] px-2.5 py-2.5 text-sm text-[#3a2403] shadow-sm shadow-[#ffd85a]/35 transition-all hover:border-[#ffe58a] hover:from-[#fffdf0] hover:via-[#ffe16f] hover:to-[#f0b72a] hover:shadow-md hover:shadow-[#ffd85a]/45"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-[#9a640d] shadow-sm ring-1 ring-[#ffe58a]/80">
                      <Crown className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-xs font-semibold">Gói Premium</span>
                      <span className="truncate text-[11px] text-[#5d3a0a]">Xem và nâng cấp gói</span>
                    </span>
                    <Sparkles className="ml-auto h-3.5 w-3.5 text-[#9a640d] drop-shadow-sm" />
                  </NavLink>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-1 bg-sidebar-border" />

        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <UserProfile />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
