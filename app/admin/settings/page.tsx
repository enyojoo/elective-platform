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

  // Add debugging for the institution context in the settings page
  console.log("Settings page - Institution context:", institution)

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

        console.log("Settings page - Current user:", user.id)

        // Fetch profile using API endpoint to bypass RLS
        const response = await fetch(`/api/admin/profile?userId=${user.id}`)

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Error fetching admin profile:", errorData)
          toast({
            title: t("settings.toast.error"),
            description: t("settings.toast.profileFetchError"),
            variant: "destructive",
          })
          return
        }

        const profile = await response.json()
        console.log("Settings page - Admin profile:", profile)
        setAdminProfile(profile)

        // If institution is not available in context, fetch it directly
        if (!institution && profile.institution_id) {
          console.log("Settings page - Fetching institution data for ID:", profile.institution_id)
          const { data: institutionData, error: institutionError } = await supabase
            .from("institutions")
            .select("*")
            .eq("id", profile.institution_id)
            .single()

          if (institutionError) {
            console.error("Error fetching institution data:", institutionError)
          } else {
            console.log("Settings page - Institution data:", institutionData)
          }
        }
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
  }, [toast, t, institution])

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
