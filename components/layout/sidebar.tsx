"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { BookOpen, Home, Users, GraduationCap, BookMarked, X, Globe, Book, Group, CheckSquare } from "lucide-react"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname()

  // Determine user role based on URL path
  const isAdmin = pathname.includes("/admin")
  const isManager = pathname.includes("/manager")
  const isStudent = pathname.includes("/student")

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-center border-b px-4">
          <Link
            href={isAdmin ? "/admin/dashboard" : isManager ? "/manager/dashboard" : "/student/dashboard"}
            className="flex items-center gap-2"
          >
            <Image src="/images/gsom-logo-en.png" alt="GSOM Logo" width={180} height={48} className="h-10 w-auto" />
          </Link>
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex flex-col gap-1 p-2">
          {/* Admin Navigation */}
          {isAdmin && (
            <>
              <NavItem
                href="/admin/dashboard"
                icon={<Home className="h-4 w-4" />}
                active={pathname === "/admin/dashboard"}
              >
                Dashboard
              </NavItem>
              <NavItem
                href="/admin/electives"
                icon={<CheckSquare className="h-4 w-4" />}
                active={pathname.startsWith("/admin/electives")}
              >
                Electives
              </NavItem>
              <NavItem
                href="/admin/courses"
                icon={<BookMarked className="h-4 w-4" />}
                active={pathname.startsWith("/admin/courses")}
              >
                Courses
              </NavItem>
              <NavItem
                href="/admin/programs"
                icon={<GraduationCap className="h-4 w-4" />}
                active={pathname.startsWith("/admin/programs")}
              >
                Programs
              </NavItem>
              <NavItem
                href="/admin/groups"
                icon={<Group className="h-4 w-4" />}
                active={pathname.startsWith("/admin/groups")}
              >
                Groups
              </NavItem>
              <NavItem
                href="/admin/degrees"
                icon={<Book className="h-4 w-4" />}
                active={pathname.startsWith("/admin/degrees")}
              >
                Degrees
              </NavItem>
              <NavItem
                href="/admin/users"
                icon={<Users className="h-4 w-4" />}
                active={pathname.startsWith("/admin/users")}
              >
                Users
              </NavItem>
            </>
          )}

          {/* Manager Navigation */}
          {isManager && (
            <>
              <NavItem
                href="/manager/dashboard"
                icon={<Home className="h-4 w-4" />}
                active={pathname === "/manager/dashboard"}
              >
                Dashboard
              </NavItem>
              <NavItem
                href="/manager/electives"
                icon={<BookOpen className="h-4 w-4" />}
                active={pathname.startsWith("/manager/electives")}
              >
                Electives
              </NavItem>
            </>
          )}

          {/* Student Navigation */}
          {isStudent && (
            <>
              <NavItem
                href="/student/dashboard"
                icon={<Home className="h-4 w-4" />}
                active={pathname === "/student/dashboard"}
              >
                Dashboard
              </NavItem>
              <NavItem
                href="/student/courses"
                icon={<BookOpen className="h-4 w-4" />}
                active={pathname.startsWith("/student/courses")}
              >
                Course Selection
              </NavItem>
              <NavItem
                href="/student/exchange"
                icon={<Globe className="h-4 w-4" />}
                active={pathname.startsWith("/student/exchange")}
              >
                Exchange Selection
              </NavItem>
            </>
          )}
        </div>

        {/* Logout link at bottom */}
        <div className="mt-auto p-4 border-t">
          <Link
            href="/auth/login"
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
