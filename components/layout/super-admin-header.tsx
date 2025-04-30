"use client"

import { useState } from "react"
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

export default function SuperAdminHeader() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { logout } = useSuperAdminAuth()

  // Skip rendering header on login page
  if (pathname === "/super-admin/login") {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link href="/super-admin/dashboard" className="flex items-center gap-2">
            <Image src="/images/elective-pro-logo.svg" alt="ElectivePRO" width={32} height={32} />
            <span className="text-xl font-bold">ElectivePRO</span>
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
              Admin
            </span>
          </Link>
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

      {isMobileMenuOpen && (
        <div className="md:hidden border-t p-4">
          <nav className="flex flex-col space-y-2">
            <Link
              href="/super-admin/dashboard"
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/super-admin/tenants"
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tenants
            </Link>
            <Link
              href="/super-admin/institutions"
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Institutions
            </Link>
            <Link
              href="/super-admin/users"
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Users
            </Link>
            <Link
              href="/super-admin/settings"
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Settings
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
