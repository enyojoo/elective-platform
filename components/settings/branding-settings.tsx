"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { uploadLogo } from "@/lib/file-utils"
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

  // Add console logs to debug the institution context and improve error handling
  console.log("Institution context:", institution)

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
      console.error("Institution ID not found in context")
      toast({
        title: t("settings.toast.error"),
        description: "Institution ID not found. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    setIsFaviconUploading(true)
    try {
      console.log("Uploading favicon for institution ID:", institution.id)
      // Upload the favicon to storage
      const faviconUrl = await uploadLogo(file, `favicon_${institution.id}`)

      // Store the favicon URL in localStorage as a temporary solution
      // since there's no favicon_url column in the database
      localStorage.setItem(`favicon_url_${institution.id}`, faviconUrl)

      toast({
        title: t("settings.toast.faviconUploaded"),
        description: t("settings.toast.faviconUploadedDesc").replace("{0}", file.name),
      })

      // Force a re-render to show the uploaded favicon
      setInstitutionData({
        ...institutionData,
        favicon_url: faviconUrl,
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
      if (!institution?.id) {
        console.log("No institution ID available in context")
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

        // Check if favicon URL exists in localStorage
        const faviconUrl = localStorage.getItem(`favicon_url_${institution.id}`)

        // Add favicon_url to the data object if it exists in localStorage
        const enhancedData = {
          ...data,
          favicon_url: faviconUrl || null,
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
    if (!institution?.id) {
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.noInstitution"),
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("institutions")
        .update({
          name: institutionName,
          primary_color: primaryColor,
        })
        .eq("id", institution.id)

      if (error) {
        throw error
      }

      // Update the context
      await updateInstitution({
        name: institutionName,
        primary_color: primaryColor,
      })

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
    if (!institution?.id) {
      console.error("Institution ID not found in context")
      toast({
        title: t("settings.toast.error"),
        description: "Institution ID not found. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    setIsLogoUploading(true)
    try {
      console.log("Uploading logo for institution ID:", institution.id)
      const logoUrl = await uploadLogo(file, institution.id)

      // Update institution with new logo URL
      const { error } = await supabase.from("institutions").update({ logo_url: logoUrl }).eq("id", institution.id)

      if (error) {
        throw error
      }

      // Update the context
      await updateInstitution({
        logo_url: logoUrl,
      })

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
                  {institutionData?.favicon_url ? (
                    <img
                      src={institutionData.favicon_url || "/placeholder.svg"}
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
