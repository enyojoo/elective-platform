"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useInstitution } from "@/lib/institution-context"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function BrandingSettingsPage() {
  const { institution, refreshInstitution } = useInstitution()
  const supabase = useSupabaseClient()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#027659")
  const [secondaryColor, setSecondaryColor] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [faviconPreview, setFaviconPreview] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (institution) {
      setName(institution.name || "")
      setPrimaryColor(institution.primary_color || "#027659")
      setSecondaryColor(institution.secondary_color || "")
      setLogoPreview(institution.logo_url || "")
      setFaviconPreview(institution.favicon_url || "")
    }
  }, [institution])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFaviconFile(file)
      setFaviconPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let logoUrl = institution?.logo_url
      let faviconUrl = institution?.favicon_url

      // Upload logo if changed
      if (logoFile) {
        const logoPath = `institutions/${institution?.id}/logo-${Date.now()}`
        const { data: logoData, error: logoError } = await supabase.storage.from("branding").upload(logoPath, logoFile)

        if (logoError) throw logoError

        const { data: logoUrlData } = supabase.storage.from("branding").getPublicUrl(logoPath)

        logoUrl = logoUrlData.publicUrl
      }

      // Upload favicon if changed
      if (faviconFile) {
        const faviconPath = `institutions/${institution?.id}/favicon-${Date.now()}`
        const { data: faviconData, error: faviconError } = await supabase.storage
          .from("branding")
          .upload(faviconPath, faviconFile)

        if (faviconError) throw faviconError

        const { data: faviconUrlData } = supabase.storage.from("branding").getPublicUrl(faviconPath)

        faviconUrl = faviconUrlData.publicUrl
      }

      // Update institution branding
      const { error } = await supabase
        .from("institutions")
        .update({
          name,
          logo_url: logoUrl,
          favicon_url: faviconUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", institution?.id)

      if (error) throw error

      // Refresh institution data
      await refreshInstitution()

      toast({
        title: "Branding updated",
        description: "Your branding settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error updating branding:", error)
      toast({
        title: "Error updating branding",
        description: "There was a problem saving your branding settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Branding Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Customize Your Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Institution Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor || "#ffffff"}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo</Label>
                  <div className="flex flex-col gap-2">
                    {logoPreview && (
                      <div className="border rounded p-2 flex justify-center">
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="Logo Preview"
                          className="max-h-20 object-contain"
                        />
                      </div>
                    )}
                    <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon</Label>
                  <div className="flex flex-col gap-2">
                    {faviconPreview && (
                      <div className="border rounded p-2 flex justify-center">
                        <img
                          src={faviconPreview || "/placeholder.svg"}
                          alt="Favicon Preview"
                          className="max-h-20 object-contain"
                        />
                      </div>
                    )}
                    <Input id="favicon" type="file" accept="image/*" onChange={handleFaviconChange} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
