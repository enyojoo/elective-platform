"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BrandingSettings } from "@/components/settings/branding-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("branding")
  const { t } = useLanguage()

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.settings.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("admin.settings.subtitle")}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:w-auto">
                <TabsTrigger value="branding">{t("admin.settings.tabs.branding")}</TabsTrigger>
                <TabsTrigger value="account">{t("admin.settings.tabs.account")}</TabsTrigger>
              </TabsList>

              <TabsContent value="branding" className="space-y-6">
                <BrandingSettings />
              </TabsContent>

              <TabsContent value="account" className="space-y-6">
                <AccountSettings />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
