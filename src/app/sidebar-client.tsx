'use client'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuAction,
  useSidebar
} from "@/components/ui/sidebar"
import { BookOpen, Boxes, ChartNoAxesCombined, ChevronDown, ChevronRight, ChevronUp, Dot, Folder关闭d, Hammer, History, Info, Plus, Server, 设置, 设置2, User, User2 } from "lucide-react"
import Link from "next/link"
import { 编辑ProjectDialog } from "./projects/edit-project-dialog"
import { SidebarLogoutButton } from "./sidebar-logout-button"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { App, Project } from "@prisma/client"
import { UserSession } from "@/shared/model/sim-session.model"
import { usePathname } from "next/navigation"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import QuickStackLogo from "@/components/custom/quickstack-logo"
import { UserGroupUtils } from "@/shared/utils/role.utils"
import { QuickStackReleaseInfo } from "@/server/adapter/qs-versioninfo.adapter"

export function SidebarCient({
  projects,
  session,
  newVersionInfo
}: {
  projects: (Project & { apps: App[] })[];
  session: UserSession;
  newVersionInfo?: QuickStackReleaseInfo;
}) {

  const path = usePathname();

  const [currentlySelectedProjectId, setCurrentlySelectedProjectId] = useState<string | null>(null);
  const [currentlySelectedAppId, setCurrentlySelectedAppId] = useState<string | null>(null);

  const settingsMenu = [
    {
      title: "Profile",
      url: "/settings/profile",
      icon: User,
    },
    {
      title: "Users & Groups",
      url: "/settings/users",
      icon: User2,
      adminOnly: true,
    },
    {
      title: "S3 Targets",
      url: "/settings/s3-targets",
      icon: 设置,
      adminOnly: true,
    },
    {
      title: <span class名称="flex items-center gap-2">QuickStack 设置 {newVersionInfo && <div class名称="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />}</span>,
      url: "/settings/server",
      adminOnly: true,
    },
  ]

  useEffect(() => {
    if (path.startsWith('/project/app/')) {
      const appId = path.split('/')[3];
      const project = projects.find(p => p.apps.some(a => a.id === appId));
      setCurrentlySelectedProjectId(project?.id || null);
      setCurrentlySelectedAppId(appId);

    } else if (path.startsWith("/project")) {
      const projectId = path.split('/')[2];
      setCurrentlySelectedProjectId(projectId);
      setCurrentlySelectedAppId(null);

    } else {
      setCurrentlySelectedProjectId(null);
      setCurrentlySelectedAppId(null);

    }
  }, [path]);

  const {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg"
                  class名称="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div class名称="flex aspect-square size-8 items-center justify-center rounded-lg bg-qs-500 text-sidebar-primary-foreground">
                    <QuickStackLogo class名称="size-5" color="light-all" />
                  </div>
                  <div class名称="grid flex-1 text-left text-sm leading-tight my-4">
                    <span class名称="truncate font-semibold">QuickStack</span>
                    <span class名称="truncate text-xs">Admin Panel</span>
                  </div>
                  <ChevronDown class名称="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent class名称="w-[--radix-popper-anchor-width]">
                <Link href="https://quickstack.dev" target="_blank">
                  <DropdownMenuItem>
                    <Info />
                    <span>QuickStack Website</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="https://quickstack.dev/docs" target="_blank">
                  <DropdownMenuItem>
                    <BookOpen />
                    <span>QuickStack Docs</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{
                  children: 'All Projects',
                  hidden: open,
                }}
                  isActive={path === '/'}>
                  <Link href="/">
                    <Folder关闭d />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
                {UserGroupUtils.isAdmin(session) && <编辑ProjectDialog>
                  <SidebarMenuAction>
                    <Plus />
                  </SidebarMenuAction>
                </编辑ProjectDialog>}
                <SidebarMenu>
                  {projects.map((item) => (
                    <DropdownMenu key={item.id}>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={{
                          children: `Project: ${item.name}`,
                          hidden: open,
                        }}
                          isActive={currentlySelectedProjectId === item.id}
                        >
                          <Link href={`/project/${item.id}`}>
                            <Dot />  <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.apps.length ? (<>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuAction class名称="">
                              <ChevronRight />
                              <span class名称="sr-only">Toggle</span>
                            </SidebarMenuAction>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            side={isMobile ? "bottom" : "right"}
                            align={isMobile ? "end" : "start"}
                            class名称="min-w-56 rounded-lg"
                          >
                            {item.apps.map((app) => (
                              <DropdownMenuItem asChild key={app.name}
                                class名称={currentlySelectedAppId === app.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}>
                                <a href={`/project/app/${app.id}`}>{app.name}</a>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </>) : null}
                      </SidebarMenuItem>
                    </DropdownMenu>
                  ))}
                </SidebarMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{
                  children: 'Builds',
                  hidden: open,
                }}
                  isActive={path.startsWith('/builds')}>
                  <Link href="/builds">
                    <Hammer />
                    <span>Builds</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{
                  children: '监控ing',
                  hidden: open,
                }}
                  isActive={path.startsWith('/monitoring')}>
                  <Link href="/monitoring">
                    <ChartNoAxesCombined />
                    <span>监控ing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {UserGroupUtils.sessionHasAccessTo返回ups(session) && <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{
                  children: '返回ups',
                  hidden: open,
                }}
                  isActive={path.startsWith('/backups')}>
                  <Link href="/backups">
                    <History />
                    <span>返回ups</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>}


        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{
                  children: '设置',
                  hidden: open,
                }}>
                  <Link href="/settings/profile">
                    <设置2 />
                    <span>设置</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {(UserGroupUtils.isAdmin(session) ? settingsMenu :
                    settingsMenu.filter(x => !x.adminOnly)).map((item) => (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <Link href={item.url}>
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  class名称="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar class名称="h-8 w-8 rounded-lg">
                    <AvatarFallback class名称="rounded-lg">{session.email.substring(0, 1)?.toUpperCase() || 'Q'}</AvatarFallback>
                  </Avatar>
                  {session.email}
                  <ChevronUp class名称="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                class名称="w-[--radix-popper-anchor-width]"
              >
                <Link href="/settings/profile">
                  <DropdownMenuItem>
                    <User />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <SidebarLogoutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
