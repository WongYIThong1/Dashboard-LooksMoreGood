"use client"

import * as React from "react"
import {
  IconDashboard,
  IconChecklist,
  IconKey,
  IconHistory,
  IconFolder,
  IconInnerShadowTop,
  IconBook,
  IconUsers,
  IconMessageCircle,
  IconShieldOff,
  IconCloud,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
  ],
  navWorkplace: [
    {
      title: "Tasks",
      url: "/tasks",
      icon: IconChecklist,
    },
    {
      title: "Dehasher",
      url: "/dehasher",
      icon: IconKey,
      disabled: true,
    },
    {
      title: "Antipublic",
      url: "/antipublic",
      icon: IconShieldOff,
      disabled: true,
    },
  ],
  navManagement: [
    {
      title: "History",
      url: "/history",
      icon: IconHistory,
    },
    {
      title: "Files",
      url: "/files",
      icon: IconFolder,
    },
    {
      title: "Cloud",
      url: "/cloud",
      icon: IconCloud,
      disabled: true,
    },
  ],
  navSupport: [
    {
      title: "Documentation",
      url: "/docs",
      icon: IconBook,
    },
    {
      title: "Community",
      url: "/community",
      icon: IconUsers,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: IconMessageCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} label="Overview" />
        <NavMain items={data.navWorkplace} label="Workplace" />
        <NavMain items={data.navManagement} label="Management" />
        <NavMain items={data.navSupport} label="Support" className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
