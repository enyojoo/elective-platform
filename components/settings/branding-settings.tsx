"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload } from "lucide-react"
import Image from "next/image"

export function BrandingSettings() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [institution, setInstitution] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#000000")
  const [logoUrl, setLogoUrl] = useState("")
  const [faviconUrl, setFaviconUrl] = useState("")

  useEffect(() => {
    async function fetchInstitution() {
      try {
        setIsLoading(true)

        const response = await fetch("/api/admin/institution")

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch institution")
        }

        const data = await response.json()
        setInstitution(data.institution)

        // Set form values
        setName(data.institution.name || "")
        setPrimaryColor(data.institution.primary_color || "#000000")
        setLogoUrl(data.institution.logo_url || "")
        setFaviconUrl(data.institution.favicon_url || "")
      } catch (error) {
        console.error("Error fetching institution:", error)
        toast({
          title: t("settings.toast.error"),
          description: t("settings.toast.institutionFetchError"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstitution()
  }, [toast, t])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)

      const response = await fetch("/api/admin/institution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          primary_color: primaryColor,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update institution")
      }

      toast({
        title: t("settings.toast.success"),
        description: t("settings.toast.brandingUpdated"),
      })
    } catch (error) {
      console.error("Error updating institution:", error)
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.brandingUpdateError"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]

    try {
      setIsUploading(true)

      // Create form data
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "logo")

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload logo")
      }

      const data = await response.json()
      setLogoUrl(data.url)

      // Update institution with new logo URL
      await fetch("/api/admin/institution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logo_url: data.url,
        }),
      })

      toast({
        title: t("settings.toast.success"),
        description: t("settings.toast.logoUploaded"),
      })
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.logoUploadError"),
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]

    try {
      setIsUploading(true)

      // Create form data
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "favicon")

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload favicon")
      }

      const data = await response.json()
      setFaviconUrl(data.url)

      // Update institution with new favicon URL
      await fetch("/api/admin/institution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          favicon_url: data.url,
        }),
      })

      toast({
        title: t("settings.toast.success"),
        description: t("settings.toast.faviconUploaded"),
      })
    } catch (error) {
      console.error("Error uploading favicon:", error)
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.faviconUploadError"),
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">{t("settings.branding.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("settings.branding.description")}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="institution-name">{t("settings.branding.institutionName")}</Label>
          <Input
            id="institution-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("settings.branding.institutionNamePlaceholder")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="primary-color">{t("settings.branding.primaryColor")}</Label>
          <div className="flex items-center gap-4">
            <Input
              id="primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-16 h-10 p-1"
            />
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>{t("settings.branding.logo")}</Label>
          <div className="flex items-center gap-4">
            <div className="border rounded-md p-4 w-32 h-32 flex items-center justify-center bg-gray-50">
              {logoUrl ? (
                <Image
                  src={logoUrl || "/placeholder.svg"}
                  alt="Institution logo"
                  width={100}
                  height={100}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-muted-foreground text-sm text-center">{t("settings.branding.noLogo")}</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Button type="button" variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  {t("settings.branding.uploadLogo")}
                </Button>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </Label>
              <p className="text-xs text-muted-foreground">{t("settings.branding.logoRequirements")}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>{t("settings.branding.favicon")}</Label>
          <div className="flex items-center gap-4">
            <div className="border rounded-md p-4 w-16 h-16 flex items-center justify-center bg-gray-50">
              {faviconUrl ? (
                <Image
                  src={faviconUrl || "/placeholder.svg"}
                  alt="Institution favicon"
                  width={32}
                  height={32}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-muted-foreground text-sm text-center">{t("settings.branding.noFavicon")}</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="favicon-upload" className="cursor-pointer">
                <Button type="button" variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  {t("settings.branding.uploadFavicon")}
                </Button>
                <Input
                  id="favicon-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </Label>
              <p className="text-xs text-muted-foreground">{t("settings.branding.faviconRequirements")}</p>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isSaving || isUploading}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            t("settings.branding.saveChanges")
          )}
        </Button>
      </form>
    </div>
  )
}
