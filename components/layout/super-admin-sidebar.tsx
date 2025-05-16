"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { LayoutDashboard, BookOpen, Building2, X } from "lucide-react"
import { useSuperAdminAuth } from "@/lib/super-admin-auth-context"
import { DEFAULT_LOGO_URL } from "@/lib/institution-context"

interface SuperAdminSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function SuperAdminSidebar({ open, setOpen }: SuperAdminSidebarProps) {
  const pathname = usePathname()
  const { logout } = useSuperAdminAuth()

  // Skip rendering sidebar on login page
  if (pathname === "/super-admin/login") {
    return null
  }

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar - fixed on desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r md:sticky md:top-0 md:h-screen flex flex-col",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "transition-transform duration-200 ease-in-out",
        )}
      >
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/super-admin/dashboard" className="flex items-center gap-2">
            {/* Updated to use the default logo URL */}
            <Image
              src={DEFAULT_LOGO_URL || "/placeholder.svg"}
              alt="ElectivePRO Logo"
              width={110}
              height={30}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex flex-col gap-1 p-2 overflow-y-auto flex-grow">
          <NavItem
            href="/super-admin/dashboard"
            icon={<LayoutDashboard className="h-4 w-4" />}
            active={pathname === "/super-admin/dashboard"}
          >
            Dashboard
          </NavItem>
          <NavItem
            href="/super-admin/institutions"
            icon={<Building2 className="h-4 w-4" />}
            active={pathname.startsWith("/super-admin/institutions")}
          >
            Institutions
          </NavItem>
          <NavItem
            href="/super-admin/plans"
            icon={<BookOpen className="h-4 w-4" />}
            active={pathname.startsWith("/super-admin/plans")}
          >
            Plans
          </NavItem>
        </div>

        {/* Logout link at bottom */}
        <div className="mt-auto p-4 border-t">
          <Link
            href="/super-admin/login"
            onClick={(e) => {
              e.preventDefault()
              logout()
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </Link>
        </div>
      </div>
    </>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  active: boolean
  children: React.ReactNode
}

function NavItem({ href, icon, active, children }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
        active ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
