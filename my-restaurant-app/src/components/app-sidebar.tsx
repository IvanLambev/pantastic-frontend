import * as React from "react"
import { useLocation } from "react-router-dom"
import {
  IconDashboard,
  IconDatabase,
  IconInnerShadowTop,
  IconListDetails,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { AdminNavUser } from "@/components/admin-nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()

  const data = {
    user: {
      name: "Admin User",
      email: "admin@pantastic.com",
      avatar: "/avatars/admin.jpg",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: IconDashboard,
      },
      {
        title: "Restaurant Management",
        url: "/admin/restaurant",
        icon: IconDatabase,
      },
      {
        title: "Orders",
        url: "/admin/orders",
        icon: IconListDetails,
      },
      {
        title: "Customers",
        url: "/admin/customers",
        icon: IconUsers,
      }
    ],
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-gray-200 bg-white"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-gray-100"
            >
              <a href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Pantastic Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <AdminNavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
