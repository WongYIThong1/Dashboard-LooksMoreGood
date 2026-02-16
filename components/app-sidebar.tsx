"use client"

import * as React from "react"
import {
  IconChecklist,
  IconKey,
  IconHistory,
  IconFolder,
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
      icon: DashboardIcon,
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

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m2.25 12l8.955-8.955a1.124 1.124 0 0 1 1.59 0L21.75 12" />
      <path d="M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="!size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M2 14h2m16 0h2m-7-1v2m-6-2v2" />
                </svg>
                <span className="text-base font-semibold">SQLBots</span>
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
