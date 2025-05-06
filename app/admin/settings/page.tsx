"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BrandingSettings } from "@/components/settings/branding-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent } from "@/components/ui/card"
import { useInstitution } from "@/lib/institution-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import { useDataCache } from "@/lib/data-cache-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("branding")
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isMounted = useRef(true)
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()

  // Component lifecycle management
  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  // Get current user ID
  useEffect(() => {
    async function getCurrentUserId() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user && isMounted.current) {
          setUserId(user.id)
        }
      } catch (error: any) {
        console.error("Error getting current user:", error)
        if (isMounted.current) {
          setError(error.message || "Failed to get current user")
        }
      }
    }

    getCurrentUserId()
  }, [])

  // Fetch admin profile with caching
  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (!userId) return

      try {
        setIsLoading(true)
        setError(null)

        // Try to get data from cache first
        const cachedProfile = getCachedData<any>("adminProfile", userId)

        if (cachedProfile) {
          console.log("Using cached admin profile data")
          setAdminProfile(cachedProfile)
          setIsLoading(false)
          return
        }

        // Fetch admin profile
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .eq("role", "admin")
          .single()

        if (error) throw error

        if (data && isMounted.current) {
          setAdminProfile(data)

          // Save to cache
          setCachedData("adminProfile", userId, data)
        }
      } catch (error: any) {
        console.error("Error fetching admin profile:", error)
        if (isMounted.current) {
          setError(error.message || "Failed to fetch admin profile")
          toast({
            title: "Error",
            description: error.message || "Failed to fetch admin profile",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    fetchAdminProfile()
  }, [userId, getCachedData, setCachedData, toast])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.settings.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("admin.settings.subtitle")}</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <AccountSettings
                    adminProfile={adminProfile}
                    onProfileUpdated={(updatedProfile) => {
                      setAdminProfile(updatedProfile)
                      if (userId) {
                        setCachedData("adminProfile", userId, updatedProfile)
                      }
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
