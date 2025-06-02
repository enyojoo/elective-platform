"use client"

import Link from "next/link"
import { LogOut, Settings } from "lucide-react"

import { Icons } from "@/components/icons"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { MainNavItem } from "@/types"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { signOut } from "@/app/actions/auth"
import { useLanguage } from "@/lib/language-context" // Assuming t function comes from here

interface SuperAdminSidebarProps {
  items?: MainNavItem[]
}

export function SuperAdminSidebar({ items }: SuperAdminSidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <div className="flex flex-col space-y-4 py-4">
      <Link href="/" className="px-3">
        <div className="flex items-center space-x-2">
          <Icons.logo className="h-6 w-6" />
          <span className="font-bold">{siteConfig.name}</span>
        </div>
      </Link>
      <Separator />
      <ScrollArea className="flex-1 space-y-2">
        {items?.length ? (
          <div className="space-y-1">
            {items.map((item) =>
              item.href ? (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "",
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.title}
                </Link>
              ) : (
                <Accordion type="single" collapsible key={item.title}>
                  <AccordionItem value={item.title}>
                    <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                      {item.items?.map((subitem) => (
                        <Link
                          key={subitem.title}
                          href={subitem.href}
                          className={cn(
                            "flex items-center gap-2 px-5 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
                            pathname === subitem.href ? "bg-accent text-accent-foreground" : "",
                          )}
                        >
                          {subitem.title}
                        </Link>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ),
            )}
          </div>
        ) : null}
        <div className="space-y-1">
          <Separator />
          <Link
            href="/super-admin/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-4 w-4" />
            {t("settings")}
          </Link>
          <form action={signOut} className="w-full">
            <input type="hidden" name="userRoleContext" value="super_admin" />
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </button>
          </form>
        </div>
      </ScrollArea>
    </div>
  )
}
