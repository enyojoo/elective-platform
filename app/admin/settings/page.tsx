"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BrandingSettings } from "@/components/settings/branding-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent } from "@/components/ui/card"
import { useInstitution } from "@/lib/institution-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("branding")
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const [adminProfile, setAdminProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAdminProfile() {
      try {
        setIsLoading(true)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          toast({
            title: t("settings.toast.error"),
            description: t("settings.toast.notAuthenticated"),
            variant: "destructive",
          })
          return
        }

        // Get admin profile
        const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching admin profile:", error)
          toast({
            title: t("settings.toast.error"),
            description: t("settings.toast.profileFetchError"),
            variant: "destructive",
          })
          return
        }

        setAdminProfile(profile)
      } catch (error) {
        console.error("Unexpected error:", error)
        toast({
          title: t("settings.toast.error"),
          description: t("settings.toast.unexpectedError"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminProfile()
  }, [toast, t])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
        </div>
      </DashboardLayout>
    )
  }

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
                <AccountSettings adminProfile={adminProfile} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
