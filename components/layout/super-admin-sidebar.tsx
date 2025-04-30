"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building2, LayoutDashboard, Users, Settings, BookOpen, Globe, Server } from "lucide-react"

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
}

export default function SuperAdminSidebar() {
  const pathname = usePathname()

  // Skip rendering sidebar on login page
  if (pathname === "/super-admin/login") {
    return null
  }

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/super-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Tenants",
      href: "/super-admin/tenants",
      icon: Server,
    },
    {
      title: "Institutions",
      href: "/super-admin/institutions",
      icon: Building2,
    },
    {
      title: "Users",
      href: "/super-admin/users",
      icon: Users,
    },
    {
      title: "Plans",
      href: "/super-admin/plans",
      icon: BookOpen,
    },
    {
      title: "Domains",
      href: "/super-admin/domains",
      icon: Globe,
    },
    {
      title: "Settings",
      href: "/super-admin/settings",
      icon: Settings,
    },
  ]

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="flex flex-col gap-2 p-4">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
              pathname === item.href || pathname.startsWith(`${item.href}/`)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </Link>
        ))}
      </div>
    </aside>
  )
}
