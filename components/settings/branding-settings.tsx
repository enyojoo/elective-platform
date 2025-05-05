"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { uploadLogo, uploadFavicon } from "@/lib/file-utils"
import { useInstitution } from "@/lib/institution-context"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function BrandingSettings() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { institution, updateInstitution } = useInstitution()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  const [isFaviconUploading, setIsFaviconUploading] = useState(false)
  const [primaryColor, setPrimaryColor] = useState(institution?.primary_color || "#027659")
  const [institutionName, setInstitutionName] = useState(institution?.name || "")
  const [subdomain, setSubdomain] = useState(institution?.subdomain || "")
  const [institutionData, setInstitutionData] = useState(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)

  // Debug institution context
  useEffect(() => {
    console.log("Institution context in BrandingSettings:", institution)
  }, [institution])

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/png", "image/x-icon", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: t("settings.toast.invalidFileType"),
        description: t("settings.toast.invalidFileTypeDesc"),
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: t("settings.toast.fileTooLarge"),
        description: t("settings.toast.fileTooLargeDesc"),
        variant: "destructive",
      })
      return
    }

    // Check if institution ID is available
    if (!institution?.id) {
      // Try to get institution ID from the URL if not in context
      const pathSegments = window.location.pathname.split("/")
      const adminIndex = pathSegments.indexOf("admin")

      // If we're in admin section, try to get institution ID from profile
      if (adminIndex !== -1) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("institution_id")
              .eq("id", user.id)
              .single()

            if (profileData?.institution_id) {
              console.log("Found institution ID from profile:", profileData.institution_id)
              setIsFaviconUploading(true)
              await uploadFaviconWithId(file, profileData.institution_id)
              return
            }
          }
        } catch (error) {
          console.error("Error getting institution ID from profile:", error)
        }
      }

      console.error("Institution ID not found in context")
      toast({
        title: t("settings.toast.error"),
        description: "Institution ID not found. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    setIsFaviconUploading(true)
    await uploadFaviconWithId(file, institution.id)
  }

  const uploadFaviconWithId = async (file: File, institutionId: string) => {
    try {
      console.log("Uploading favicon for institution ID:", institutionId)
      // Upload the favicon to storage
      const newFaviconUrl = await uploadFavicon(file, institutionId)

      // Check if favicon_url column exists in institutions table
      try {
        // Try to update the institution with the new favicon URL
        const { error: updateError } = await supabase
          .from("institutions")
          .update({ favicon_url: newFaviconUrl })
          .eq("id", institutionId)

        if (updateError) {
          if (updateError.message.includes('column "favicon_url" of relation "institutions" does not exist')) {
            console.log("favicon_url column doesn't exist, storing in localStorage")
            // Store in localStorage as fallback
            localStorage.setItem(`favicon_url_${institutionId}`, newFaviconUrl)
          } else {
            throw updateError
          }
        } else {
          console.log("Updated institution with favicon_url in database")
        }
      } catch (error) {
        console.error("Error updating institution with favicon_url:", error)
        // Store in localStorage as fallback
        localStorage.setItem(`favicon_url_${institutionId}`, newFaviconUrl)
      }

      setFaviconUrl(newFaviconUrl)

      // Update local state to show the new favicon
      setInstitutionData({
        ...institutionData,
        favicon_url: newFaviconUrl,
      })

      toast({
        title: t("settings.toast.faviconUploaded"),
        description: t("settings.toast.faviconUploadedDesc").replace("{0}", file.name),
      })
    } catch (error) {
      console.error("Favicon upload error:", error)
      toast({
        title: t("settings.toast.uploadError"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsFaviconUploading(false)
    }
  }

  useEffect(() => {
    async function fetchInstitutionData() {
      // If no institution in context, try to get from auth
      if (!institution?.id) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("institution_id")
              .eq("id", user.id)
              .single()

            if (profileData?.institution_id) {
              console.log("Found institution ID from profile:", profileData.institution_id)
              const { data: instData, error: instError } = await supabase
                .from("institutions")
                .select("*")
                .eq("id", profileData.institution_id)
                .single()

              if (instError) {
                console.error("Error fetching institution data:", instError)
                setIsLoading(false)
                return
              }

              console.log("Institution data fetched from profile:", instData)

              // Check for favicon in localStorage
              const storedFaviconUrl = localStorage.getItem(`favicon_url_${profileData.institution_id}`)

              const enhancedData = {
                ...instData,
                favicon_url: storedFaviconUrl || null,
              }

              setInstitutionData(enhancedData)
              setPrimaryColor(instData.primary_color || "#027659")
              setInstitutionName(instData.name || "")
              setSubdomain(instData.subdomain || "")
              setFaviconUrl(storedFaviconUrl)
              setIsLoading(false)
              return
            }
          }
        } catch (error) {
          console.error("Error getting institution from profile:", error)
        }

        console.log("No institution ID available in context or profile")
        setIsLoading(false)
        return
      }

      console.log("Fetching institution data for ID:", institution.id)

      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("institutions").select("*").eq("id", institution.id).single()

        if (error) {
          console.error("Error fetching institution data:", error)
          toast({
            title: t("settings.toast.error"),
            description: t("settings.toast.institutionFetchError"),
            variant: "destructive",
          })
          return
        }

        console.log("Institution data fetched:", data)

        // Check if favicon URL exists in localStorage or in the database
        let faviconUrlValue = data.favicon_url

        if (!faviconUrlValue) {
          const storedFaviconUrl = localStorage.getItem(`favicon_url_${institution.id}`)
          faviconUrlValue = storedFaviconUrl || null
        }

        setFaviconUrl(faviconUrlValue)

        // Add favicon_url to the data object
        const enhancedData = {
          ...data,
          favicon_url: faviconUrlValue,
        }

        setInstitutionData(enhancedData)
        setPrimaryColor(data.primary_color || "#027659")
        setInstitutionName(data.name || "")
        setSubdomain(data.subdomain || "")
      } catch (error) {
        console.error("Unexpected error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstitutionData()
  }, [institution?.id, toast, t])

  const handleSaveChanges = async () => {
    if (!institution?.id && !institutionData?.id) {
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.noInstitution"),
        variant: "destructive",
      })
      return
    }

    const institutionId = institution?.id || institutionData?.id

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("institutions")
        .update({
          name: institutionName,
          primary_color: primaryColor,
        })
        .eq("id", institutionId)

      if (error) {
        throw error
      }

      // Update the context if available
      if (institution && updateInstitution) {
        await updateInstitution({
          name: institutionName,
          primary_color: primaryColor,
        })
      }

      toast({
        title: t("settings.toast.changesSaved"),
        description: t("settings.toast.changesSavedDesc"),
      })
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.errorDesc"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetDefaults = () => {
    setPrimaryColor(institutionData?.primary_color || "#027659")
    setInstitutionName(institutionData?.name || "")
    setSubdomain(institutionData?.subdomain || "")

    toast({
      title: t("settings.toast.resetDefaults"),
      description: t("settings.toast.resetDefaultsDesc"),
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: t("settings.toast.invalidFileType"),
        description: t("settings.toast.invalidFileTypeDesc"),
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("settings.toast.fileTooLarge"),
        description: t("settings.toast.fileTooLargeDesc"),
        variant: "destructive",
      })
      return
    }

    // Check if institution ID is available
    if (!institution?.id && !institutionData?.id) {
      // Try to get institution ID from the URL if not in context
      const pathSegments = window.location.pathname.split("/")
      const adminIndex = pathSegments.indexOf("admin")

      // If we're in admin section, try to get institution ID from profile
      if (adminIndex !== -1) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("institution_id")
              .eq("id", user.id)
              .single()

            if (profileData?.institution_id) {
              console.log("Found institution ID from profile:", profileData.institution_id)
              setIsLogoUploading(true)
              await uploadLogoWithId(file, profileData.institution_id)
              return
            }
          }
        } catch (error) {
          console.error("Error getting institution ID from profile:", error)
        }
      }

      console.error("Institution ID not found in context or data")
      toast({
        title: t("settings.toast.error"),
        description: "Institution ID not found. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    const institutionId = institution?.id || institutionData?.id
    setIsLogoUploading(true)
    await uploadLogoWithId(file, institutionId)
  }

  const uploadLogoWithId = async (file: File, institutionId: string) => {
    try {
      console.log("Uploading logo for institution ID:", institutionId)
      const logoUrl = await uploadLogo(file, institutionId)

      // Update institution with new logo URL
      const { error } = await supabase.from("institutions").update({ logo_url: logoUrl }).eq("id", institutionId)

      if (error) {
        throw error
      }

      // Update the context if available
      if (institution && updateInstitution) {
        await updateInstitution({
          logo_url: logoUrl,
        })
      }

      // Update local state to show the new logo
      setInstitutionData({
        ...institutionData,
        logo_url: logoUrl,
      })

      toast({
        title: t("settings.toast.logoUploaded"),
        description: t("settings.toast.logoUploadedDesc").replace("{0}", file.name),
      })
    } catch (error) {
      console.error("Logo upload error:", error)
      toast({
        title: t("settings.toast.uploadError"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLogoUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.branding.title")}</CardTitle>
          <CardDescription>{t("settings.branding.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Institution Name and Subdomain */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institutionName">{t("settings.branding.institutionName")}</Label>
              <Input
                id="institutionName"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder={t("settings.branding.institutionNamePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">{t("settings.branding.subdomain")}</Label>
              <div className="flex items-center">
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="rounded-r-none"
                  disabled={true} // Subdomain cannot be changed after creation
                />
                <div className="bg-muted px-3 py-2 border border-l-0 border-input rounded-r-md text-muted-foreground">
                  .electivepro.net
                </div>
              </div>
            </div>
          </div>

          {/* Logo, Favicon, and Color in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>{t("settings.branding.logo")}</Label>
              <div className="flex items-center gap-2">
                <div className="h-10 w-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                  {institutionData?.logo_url ? (
                    <img
                      src={institutionData.logo_url || "/placeholder.svg"}
                      alt="Logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Logo</span>
                  )}
                </div>
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10"
                    type="button"
                    disabled={isLogoUploading}
                    onClick={() => document.getElementById("logo-upload")?.click()}
                  >
                    {isLogoUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("settings.branding.uploading")}
                      </>
                    ) : (
                      t("settings.branding.upload")
                    )}
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isLogoUploading}
                  />
                </label>
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="space-y-2">
              <Label>{t("settings.branding.favicon")}</Label>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-muted rounded flex items-center justify-center overflow-hidden">
                  {faviconUrl ? (
                    <img
                      src={faviconUrl || "/placeholder.svg"}
                      alt="Favicon"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Icon</span>
                  )}
                </div>
                <label htmlFor="favicon-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10"
                    type="button"
                    disabled={isFaviconUploading}
                    onClick={() => document.getElementById("favicon-upload")?.click()}
                  >
                    {isFaviconUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("settings.branding.uploading")}
                      </>
                    ) : (
                      t("settings.branding.upload")
                    )}
                  </Button>
                  <input
                    id="favicon-upload"
                    type="file"
                    accept="image/png,image/x-icon,image/svg+xml"
                    className="hidden"
                    onChange={handleFaviconUpload}
                    disabled={isFaviconUploading}
                  />
                </label>
              </div>
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primaryColor">{t("settings.branding.primaryColor")}</Label>
              <div className="flex items-center gap-2">
                <div
                  className="h-10 w-10 rounded border cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => document.getElementById("colorPickerInput")?.click()}
                />
                <div className="relative flex-1">
                  <Input
                    id="primaryColor"
                    type="text"
                    value={primaryColor}
                    onChange={(e) => {
                      // Validate if it's a valid hex color
                      const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)
                      if (isValidHex || e.target.value.startsWith("#")) {
                        setPrimaryColor(e.target.value)
                      }
                    }}
                  />
                  <input
                    id="colorPickerInput"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="absolute opacity-0"
                    style={{ height: 0, width: 0 }}
                    aria-label="Select color"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleResetDefaults}>
              {t("settings.branding.reset")}
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("settings.branding.saving")}
                </>
              ) : (
                t("settings.branding.save")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
