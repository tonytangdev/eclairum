"use client"

import { Home, BookOpen } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { AppTitle } from "@/components/ui/app-title"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()

  const routes = [
    {
      title: "Home",
      icon: Home,
      href: "/",
      isActive: pathname === "/",
    },
    {
      title: "My flash cards",
      icon: BookOpen,
      href: "/my-flash-cards",
      isActive: pathname === "/my-flash-cards",
    },
  ]

  return (
    <>
      {/* Mobile trigger that will be visible outside the sidebar */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <SidebarTrigger className="bg-background shadow-sm border rounded-md" />
      </div>

      <Sidebar>
        <SidebarHeader className="flex items-center justify-center p-4">
          <Link href="/" className="flex items-center gap-2">
            <AppTitle />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {routes.map((route) => (
              <SidebarMenuItem key={route.href}>
                <SidebarMenuButton asChild isActive={route.isActive}>
                  <Link href={route.href}>
                    <route.icon className="h-4 w-4" />
                    <span>{route.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </>
  )
}

