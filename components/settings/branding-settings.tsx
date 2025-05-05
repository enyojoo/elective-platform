"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload } from "lucide-react"
import { uploadLogo } from "@/lib/file-utils"

export function BrandingSettings() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [institution, setInstitution] = useState(null)
  const [name, setName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#6366f1")
  const [logoUrl, setLogoUrl] = useState("")
  const [faviconUrl, setFaviconUrl] = useState("")
  const [logoFile, setLogoFile] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)

  useEffect(() => {
    async function fetchInstitution() {
      try {
        setIsLoading(true)

        // Use the API endpoint instead of direct Supabase query
        const response = await fetch("/api/admin/institution")

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch institution data")
        }

        const institutionData = await response.json()
        setInstitution(institutionData)
        setName(institutionData.name || "")
        setSubdomain(institutionData.subdomain || "")
        setPrimaryColor(institutionData.primary_color || "#6366f1")
        setLogoUrl(institutionData.logo_url || "")
        setFaviconUrl(institutionData.favicon_url || "")
      } catch (error) {
        console.error("Error fetching institution:", error)
        toast({
          title: t("settings.toast.error"),
          description: error.message || t("settings.toast.institutionFetchError"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstitution()
  }, [toast, t])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file)
      setLogoUrl(previewUrl)
    }
  }

  const handleFaviconChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFaviconFile(file)
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file)
      setFaviconUrl(previewUrl)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      let updatedLogoUrl = logoUrl
      let updatedFaviconUrl = faviconUrl

      // Upload logo if changed
      if (logoFile) {
        const logoUploadResult = await uploadLogo(logoFile, institution.id)
        if (logoUploadResult.error) {
          throw new Error(logoUploadResult.error)
        }
        updatedLogoUrl = logoUploadResult.url
      }

      // Upload favicon if changed
      if (faviconFile) {
        const faviconUploadResult = await uploadLogo(faviconFile, institution.id, true)
        if (faviconUploadResult.error) {
          throw new Error(faviconUploadResult.error)
        }
        updatedFaviconUrl = faviconUploadResult.url
      }

      // Update institution using the API
      const response = await fetch("/api/admin/institution", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          subdomain,
          primary_color: primaryColor,
          logo_url: updatedLogoUrl,
          favicon_url: updatedFaviconUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update institution")
      }

      const updatedInstitution = await response.json()
      setInstitution(updatedInstitution)

      // Reset file states
      setLogoFile(null)
      setFaviconFile(null)

      toast({
        title: t("settings.branding.saveSuccess"),
        description: t("settings.branding.saveSuccessMessage"),
      })
    } catch (error) {
      console.error("Error saving branding settings:", error)
      toast({
        title: t("settings.toast.error"),
        description: error.message || t("settings.toast.saveFailed"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (institution) {
      setName(institution.name || "")
      setSubdomain(institution.subdomain || "")
      setPrimaryColor(institution.primary_color || "#6366f1")
      setLogoUrl(institution.logo_url || "")
      setFaviconUrl(institution.favicon_url || "")
      setLogoFile(null)
      setFaviconFile(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
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
          {/* Institution Name */}
          <div className="space-y-2">
            <Label htmlFor="institutionName">{t("settings.branding.institutionName")}</Label>
            <Input
              id="institutionName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("settings.branding.institutionNamePlaceholder")}
            />
          </div>

          {/* Subdomain */}
          <div className="space-y-2">
            <Label htmlFor="subdomain">{t("settings.branding.subdomain")}</Label>
            <div className="flex items-center">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder={t("settings.branding.subdomainPlaceholder")}
                className="rounded-r-none"
              />
              <div className="bg-muted px-3 py-2 border border-l-0 border-input rounded-r-md text-muted-foreground">
                .electivepro.com
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t("settings.branding.subdomainHelp")}</p>
          </div>

          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="primaryColor">{t("settings.branding.primaryColor")}</Label>
            <div className="flex items-center gap-4">
              <Input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#6366f1"
                className="w-32"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">{t("settings.branding.logo")}</Label>
            <div className="flex items-center gap-4">
              {logoUrl && (
                <div className="w-16 h-16 border rounded flex items-center justify-center overflow-hidden">
                  <img
                    src={logoUrl || "/placeholder.svg"}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <Label
                  htmlFor="logo-upload"
                  className="flex items-center justify-center w-full h-10 px-4 py-2 text-sm border border-dashed rounded-md cursor-pointer bg-muted/50 hover:bg-muted"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t("settings.branding.uploadLogo")}
                </Label>
                <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t("settings.branding.logoHelp")}</p>
          </div>

          {/* Favicon Upload */}
          <div className="space-y-2">
            <Label htmlFor="favicon">{t("settings.branding.favicon")}</Label>
            <div className="flex items-center gap-4">
              {faviconUrl && (
                <div className="w-8 h-8 border rounded flex items-center justify-center overflow-hidden">
                  <img
                    src={faviconUrl || "/placeholder.svg"}
                    alt="Favicon"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <Label
                  htmlFor="favicon-upload"
                  className="flex items-center justify-center w-full h-10 px-4 py-2 text-sm border border-dashed rounded-md cursor-pointer bg-muted/50 hover:bg-muted"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t("settings.branding.uploadFavicon")}
                </Label>
                <input
                  id="favicon-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconChange}
                  className="hidden"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t("settings.branding.faviconHelp")}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              {t("settings.branding.reset")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
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
