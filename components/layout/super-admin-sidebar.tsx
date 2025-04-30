"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Settings, BookOpen, Globe, Building2 } from "lucide-react"
import { useSuperAdminAuth } from "@/lib/super-admin-auth-context"
import Image from "next/image"

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
}

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const { logout } = useSuperAdminAuth()

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
      <div className="flex h-16 items-center justify-center border-b px-4">
        <Link href="/super-admin/dashboard" className="flex items-center gap-2">
          <Image
            src="/images/elective-pro-logo.svg"
            alt="ElectivePRO Logo"
            width={90}
            height={24}
            className="h-6 w-auto"
          />
          <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">Admin</span>
        </Link>
      </div>
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
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted mt-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  )
}
