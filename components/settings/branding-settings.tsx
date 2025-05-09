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
import { useCachedInstitutionSettings } from "@/hooks/use-cached-institution-settings"
import { useDataCache } from "@/lib/data-cache-context"
import { Copy, Check } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function BrandingSettings() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { institution, updateInstitution } = useInstitution()
  const { invalidateCache } = useDataCache()
  const [isSaving, setIsSaving] = useState(false)
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  const [isFaviconUploading, setIsFaviconUploading] = useState(false)
  const [primaryColor, setPrimaryColor] = useState(institution?.primary_color || "#027659")
  const [institutionName, setInstitutionName] = useState(institution?.name || "")
  const [institutionDomain, setInstitutionDomain] = useState(institution?.domain || "")
  const [subdomain, setSubdomain] = useState(institution?.subdomain || "")
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [institutionId, setInstitutionId] = useState<string | null>(institution?.id || null)
  const [hasFaviconColumn, setHasFaviconColumn] = useState(false)
  const [copiedStudent, setCopiedStudent] = useState(false)
  const [copiedManager, setCopiedManager] = useState(false)

  // Use our cached institution settings
  const { settings, isLoading } = useCachedInstitutionSettings(institutionId || undefined)

  // Check if favicon_url column exists
  useEffect(() => {
    async function checkFaviconColumn() {
      try {
        // Try to update a test record with favicon_url to see if the column exists
        const testId = "00000000-0000-0000-0000-000000000000" // A dummy UUID that won't exist
        const { error } = await supabase.from("institutions").update({ favicon_url: null }).eq("id", testId)

        // If there's no error about the column not existing, then it exists
        setHasFaviconColumn(
          !error || !error.message.includes('column "favicon_url" of relation "institutions" does not exist'),
        )
        console.log("Favicon column exists:", hasFaviconColumn)
      } catch (error) {
        console.error("Error checking favicon column:", error)
        setHasFaviconColumn(false)
      }
    }

    checkFaviconColumn()
  }, [])

  // Get institution ID from user profile if not available in context
  useEffect(() => {
    async function getInstitutionIdFromProfile() {
      if (institutionId) return

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("institution_id")
          .eq("id", user.id)
          .single()

        if (profileError || !profileData?.institution_id) {
          console.error("Error getting institution ID from profile:", profileError)
          return
        }

        console.log("Found institution ID from profile:", profileData.institution_id)
        setInstitutionId(profileData.institution_id)
      } catch (error) {
        console.error("Error in getInstitutionIdFromProfile:", error)
      }
    }

    getInstitutionIdFromProfile()
  }, [institutionId])

  // Update state when settings are loaded
  useEffect(() => {
    if (settings) {
      // Get favicon URL from localStorage if not in database
      let faviconUrlValue = settings.favicon_url
      if (!faviconUrlValue && hasFaviconColumn) {
        const storedFaviconUrl = localStorage.getItem(`favicon_url_${institutionId}`)
        faviconUrlValue = storedFaviconUrl || null
      }

      setFaviconUrl(faviconUrlValue)
      setLogoUrl(settings.logo_url)
      setPrimaryColor(settings.primary_color || "#027659")
      setInstitutionName(settings.name || "")
      setInstitutionDomain(settings.domain || "")
      setSubdomain(settings.subdomain || "")
    }
  }, [settings, hasFaviconColumn, institutionId])

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
    if (!institutionId) {
      toast({
        title: t("settings.toast.error"),
        description: "Institution ID not found. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    setIsFaviconUploading(true)
    try {
      console.log("Uploading favicon for institution ID:", institutionId)
      const newFaviconUrl = await uploadFavicon(file, institutionId)
      setFaviconUrl(newFaviconUrl)

      // Update institution with new favicon URL if column exists
      if (hasFaviconColumn) {
        const { error } = await supabase
          .from("institutions")
          .update({ favicon_url: newFaviconUrl })
          .eq("id", institutionId)

        if (error) {
          console.error("Error updating institution with favicon_url:", error)
          // Store in localStorage as fallback
          localStorage.setItem(`favicon_url_${institutionId}`, newFaviconUrl)
        } else {
          console.log("Updated institution with favicon_url in database")
          // Invalidate the cache
          invalidateCache("institutionSettings", institutionId)
        }
      } else {
        // Store in localStorage if column doesn't exist
        localStorage.setItem(`favicon_url_${institutionId}`, newFaviconUrl)
      }

      // Update the context if available
      if (institution && updateInstitution && hasFaviconColumn) {
        await updateInstitution({
          favicon_url: newFaviconUrl,
        })
      }

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
    if (!institutionId) {
      toast({
        title: t("settings.toast.error"),
        description: "Institution ID not found. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    setIsLogoUploading(true)
    try {
      console.log("Uploading logo for institution ID:", institutionId)
      const newLogoUrl = await uploadLogo(file, institutionId)
      setLogoUrl(newLogoUrl)

      // Update institution with new logo URL
      const { error } = await supabase.from("institutions").update({ logo_url: newLogoUrl }).eq("id", institutionId)

      if (error) {
        console.error("Error updating institution with logo_url:", error)
        throw error
      }

      // Invalidate the cache
      invalidateCache("institutionSettings", institutionId)

      // Update the context if available
      if (institution && updateInstitution) {
        await updateInstitution({
          logo_url: newLogoUrl,
        })
      }

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

  const handleSaveChanges = async () => {
    if (!institutionId) {
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
          domain: institutionDomain,
          primary_color: primaryColor,
        })
        .eq("id", institutionId)

      if (error) {
        throw error
      }

      // Invalidate the cache
      invalidateCache("institutionSettings", institutionId)

      // Update the context if available
      if (institution && updateInstitution) {
        await updateInstitution({
          name: institutionName,
          domain: institutionDomain,
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
    if (settings) {
      setPrimaryColor(settings.primary_color || "#027659")
      setInstitutionName(settings.name || "")
      setInstitutionDomain(settings.domain || "")
      setSubdomain(settings.subdomain || "")
    }

    toast({
      title: t("settings.toast.resetDefaults"),
      description: t("settings.toast.resetDefaultsDesc"),
    })
  }

  const copyToClipboard = async (text: string, type: "student" | "manager") => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "student") {
        setCopiedStudent(true)
        setTimeout(() => setCopiedStudent(false), 2000)
      } else {
        setCopiedManager(true)
        setTimeout(() => setCopiedManager(false), 2000)
      }
      toast({
        title: t("settings.toast.linkCopied"),
        description: t("settings.toast.linkCopiedDesc"),
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.copyError"),
        variant: "destructive",
      })
    }
  }

  const getStudentLoginUrl = () => {
    const isProduction = process.env.NODE_ENV === "production"
    if (isProduction) {
      return `https://${subdomain}.electivepro.net/student/login`
    } else {
      return `http://localhost:3000/student/login?subdomain=${subdomain}`
    }
  }

  const getManagerLoginUrl = () => {
    const isProduction = process.env.NODE_ENV === "production"
    if (isProduction) {
      return `https://${subdomain}.electivepro.net/manager/login`
    } else {
      return `http://localhost:3000/manager/login?subdomain=${subdomain}`
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.branding.title")}</CardTitle>
          <CardDescription>{t("settings.branding.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Institution Name, Domain, and Subdomain in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institutionName">{t("settings.branding.institutionName")}</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  id="institutionName"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder={t("settings.branding.institutionNamePlaceholder")}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="institutionDomain">{t("settings.branding.domain")}</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  id="institutionDomain"
                  value={institutionDomain}
                  onChange={(e) => setInstitutionDomain(e.target.value)}
                  placeholder="example.edu"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">{t("settings.branding.subdomain")}</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
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
              )}
            </div>
          </div>

          {/* Login Links - Now on the same line */}
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium">{t("settings.branding.loginLinks")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Login */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t("settings.branding.studentLogin")}:</div>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <div className="flex items-center">
                    <div className="bg-muted px-3 py-2 text-sm rounded-l-md border border-r-0 border-input flex-1 truncate">
                      {getStudentLoginUrl()}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 rounded-l-none"
                      onClick={() => copyToClipboard(getStudentLoginUrl(), "student")}
                    >
                      {copiedStudent ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>

              {/* Manager Login */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t("settings.branding.managerLogin")}:</div>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <div className="flex items-center">
                    <div className="bg-muted px-3 py-2 text-sm rounded-l-md border border-r-0 border-input flex-1 truncate">
                      {getManagerLoginUrl()}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 rounded-l-none"
                      onClick={() => copyToClipboard(getManagerLoginUrl(), "manager")}
                    >
                      {copiedManager ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logo, Favicon, and Color in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>{t("settings.branding.logo")}</Label>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <div className="h-10 w-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Logo</span>
                    )}
                  </div>
                )}
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10"
                    type="button"
                    disabled={isLogoUploading || isLoading}
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
                    disabled={isLogoUploading || isLoading}
                  />
                </label>
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="space-y-2">
              <Label>{t("settings.branding.favicon")}</Label>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Skeleton className="h-10 w-10" />
                ) : (
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
                )}
                <label htmlFor="favicon-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10"
                    type="button"
                    disabled={isFaviconUploading || isLoading}
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
                    disabled={isFaviconUploading || isLoading}
                  />
                </label>
              </div>
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primaryColor">{t("settings.branding.primaryColor")}</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
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
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleResetDefaults} disabled={isLoading}>
              {t("settings.branding.reset")}
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>
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
