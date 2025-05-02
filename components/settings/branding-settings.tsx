"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"

export function BrandingSettings() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [primaryColor, setPrimaryColor] = useState("#027659")
  const [institutionName, setInstitutionName] = useState("")
  const [subdomain, setSubdomain] = useState("yourinstitution")

  const handleSaveChanges = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: t("settings.toast.changesSaved"),
        description: t("settings.toast.changesSavedDesc"),
      })
    } catch (error) {
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.errorDesc"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetDefaults = () => {
    setPrimaryColor("#027659")
    setInstitutionName("")
    setSubdomain("yourinstitution")

    toast({
      title: t("settings.toast.resetDefaults"),
      description: t("settings.toast.resetDefaultsDesc"),
    })
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
                />
                <div className="bg-muted px-3 py-2 border border-l-0 border-input rounded-r-md text-muted-foreground">
                  .electivepro.com
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
                <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Logo</span>
                </div>
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10"
                    type="button"
                    onClick={() => document.getElementById("logo-upload")?.click()}
                  >
                    Upload
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      // Handle file upload logic here
                      if (e.target.files && e.target.files[0]) {
                        // You would typically upload this file to your server or storage
                        const fileName = e.target.files[0].name
                        toast({
                          title: t("settings.toast.logoUploaded"),
                          description: t("settings.toast.logoUploadedDesc").replace("{0}", fileName),
                        })
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="space-y-2">
              <Label>{t("settings.branding.favicon")}</Label>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Icon</span>
                </div>
                <label htmlFor="favicon-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10"
                    type="button"
                    onClick={() => document.getElementById("favicon-upload")?.click()}
                  >
                    Upload
                  </Button>
                  <input
                    id="favicon-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      // Handle file upload logic here
                      if (e.target.files && e.target.files[0]) {
                        // You would typically upload this file to your server or storage
                        const fileName = e.target.files[0].name
                        toast({
                          title: t("settings.toast.faviconUploaded"),
                          description: t("settings.toast.faviconUploadedDesc").replace("{0}", fileName),
                        })
                      }
                    }}
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
            <Button onClick={handleSaveChanges} disabled={isLoading}>
              {isLoading ? t("settings.branding.saving") : t("settings.branding.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
