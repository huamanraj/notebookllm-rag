"use client"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="h-14 border-b border-border flex items-center px-4 bg-background">
          <SidebarTrigger />
        </div>
        <div className="flex-1 overflow-auto bg-background">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
