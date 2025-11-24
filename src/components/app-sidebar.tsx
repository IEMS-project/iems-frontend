import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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

// Menu items (excluding Projects as it's handled separately)
const items = [
  {
    title: "Bảng điều khiển",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Nhiệm vụ",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Lịch",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Tin nhắn",
    url: "/messages",
    icon: MessageSquare,
  },
  {
    title: "Trợ lý ảo",
    url: "/chatbot",
    icon: Bot,
  },
  {
    title: "Tài liệu",
    url: "/documents",
    icon: FileText,
  },
  {
    title: "Phòng ban",
    url: "/departments",
    icon: Users,
  },
  {
    title: "Phân quyền",
    url: "/admin/access-control",
    icon: Shield,
  },
];

export function AppSidebar() {
  const { theme, toggleTheme } = useTheme();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const { getTotal } = useUnreadCounts();
  const totalUnread = getTotal();
  const formattedUnread = totalUnread > 99 ? "99+" : totalUnread;

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

  // Check if current path is a project detail page
  const isProjectDetailPage = location.pathname.startsWith("/projects/") && location.pathname !== "/projects";

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
                      IEMS
                    </div>
                    <div className="text-xs text-sidebar-foreground/70">
                      Intelligent EMS
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
          <SidebarGroupLabel>Chức năng chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Projects - Always open with submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Dự án"
                  isActive={location.pathname === "/projects" || isProjectDetailPage}
                >
                  <NavLink to="/projects">
                    <FolderKanban />
                    <span>Dự án</span>
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
                        <span>Tất cả dự án</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {loadingProjects ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton disabled>
                        <span>Đang tải...</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : projects.length === 0 ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton disabled>
                        <span>Không có dự án</span>
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
                          >
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

              {/* Other menu items */}
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                const showUnreadBadge = item.url === "/messages" && totalUnread > 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <NavLink to={item.url} className="flex items-center gap-2">
                        <item.icon />
                        <span>{item.title}</span>
                        {showUnreadBadge && (
                          <span className="ml-auto text-xs font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-destructive text-destructive-foreground">
                            {formattedUnread}
                          </span>
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
                    tooltip={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
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
                      <span>Chế độ tối</span>
                    </div>
                    <Toggle
                      checked={theme === "dark"}
                      onChange={toggleTheme}
                    />
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

