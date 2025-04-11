"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Home, Users, BookOpen, CheckSquare, GraduationCap, Building } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { UserRole } from "@/lib/types"

interface SidebarProps {
  open: boolean
  onClose: () => void
  userRole: UserRole
}

interface SidebarItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: UserRole[]
}

const sidebarItems: Record<UserRole, SidebarItem[]> = {
  [UserRole.STUDENT]: [
    { href: "/student/dashboard", label: "Dashboard", icon: <Home className="h-4 w-4" />, roles: [UserRole.STUDENT] },
    {
      href: "/student/courses",
      label: "Elective Courses",
      icon: <BookOpen className="h-4 w-4" />,
      roles: [UserRole.STUDENT],
    },
    {
      href: "/student/exchange",
      label: "Exchange Programs",
      icon: <GraduationCap className="h-4 w-4" />,
      roles: [UserRole.STUDENT],
    },
  ],
  [UserRole.PROGRAM_MANAGER]: [
    {
      href: "/manager/dashboard",
      label: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      roles: [UserRole.PROGRAM_MANAGER],
    },
    {
      href: "/manager/electives",
      label: "Electives",
      icon: <CheckSquare className="h-4 w-4" />,
      roles: [UserRole.PROGRAM_MANAGER],
    },
  ],
  [UserRole.ADMIN]: [
    { href: "/admin/dashboard", label: "Dashboard", icon: <Home className="h-4 w-4" />, roles: [UserRole.ADMIN] },
    { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" />, roles: [UserRole.ADMIN] },
    {
      href: "/admin/programs",
      label: "Programs",
      icon: <GraduationCap className="h-4 w-4" />,
      roles: [UserRole.ADMIN],
    },
    { href: "/admin/courses", label: "Courses", icon: <BookOpen className="h-4 w-4" />, roles: [UserRole.ADMIN] },
    { href: "/admin/degrees", label: "Degrees", icon: <Building className="h-4 w-4" />, roles: [UserRole.ADMIN] },
    { href: "/admin/groups", label: "Groups", icon: <CheckSquare className="h-4 w-4" />, roles: [UserRole.ADMIN] },
  ],
}

export function Sidebar({ open, onClose, userRole }: SidebarProps) {
  const pathname = usePathname()
  const { language } = useLanguage()

  const items = sidebarItems[userRole] || []

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          {/*  Your trigger icon here */}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-64 border-r p-0">
        <SheetHeader className="pl-6 pr-8 pt-6 pb-4">
          <SheetTitle>GSOM Timetable</SheetTitle>
        </SheetHeader>
        <div className="py-1 text-sm">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div
                className={cn(
                  "flex items-center gap-x-2 p-2 hover:bg-secondary hover:text-foreground rounded-md",
                  pathname === item.href ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
