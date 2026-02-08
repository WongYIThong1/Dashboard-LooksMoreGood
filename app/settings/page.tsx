"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SettingsContent } from "@/components/settings-content"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SettingsContent />
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
