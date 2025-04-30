"use client"

import { usePathname } from "next/navigation"

export default function SuperAdminHeader() {
  const pathname = usePathname()

  // Skip rendering header on login page
  if (pathname === "/super-admin/login") {
    return null
  }

  // Empty header - no text or user icon
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">{/* Empty header - no content */}</div>
    </header>
  )
}
