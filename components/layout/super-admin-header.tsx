"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Menu, User } from "lucide-react"
import { useSuperAdminAuth } from "@/lib/super-admin-auth-context"
import Image from "next/image"

interface SuperAdminHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function SuperAdminHeader({ sidebarOpen, setSidebarOpen }: SuperAdminHeaderProps) {
  const pathname = usePathname()
  const { logout } = useSuperAdminAuth()

  // Skip rendering header on login page
  if (pathname === "/super-admin/login") {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link href="/super-admin/dashboard" className="flex items-center gap-2 md:hidden">
            <Image
              src="/images/elective-pro-logo.svg"
              alt="ElectivePRO"
              width={90}
              height={24}
              className="h-6 w-auto"
            />
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
              Admin
            </span>
          </Link>
          <div className="hidden md:block text-lg font-semibold">
            {pathname.includes("/dashboard") && "Dashboard"}
            {pathname.includes("/institutions") && "Institutions"}
            {pathname.includes("/users") && "Users"}
            {pathname.includes("/plans") && "Plans"}
            {pathname.includes("/domains") && "Domains"}
            {pathname.includes("/settings") && "Settings"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/super-admin/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
