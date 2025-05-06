"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface AccountSettingsProps {
  adminProfile: any
  onProfileUpdated?: (updatedProfile: any) => void
}

export function AccountSettings({ adminProfile, onProfileUpdated }: AccountSettingsProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Set form values when profile is loaded
  useEffect(() => {
    if (adminProfile) {
      setName(adminProfile.full_name || "")
      setEmail(adminProfile.email || "")
    }
  }, [adminProfile])

  const handleUpdateInfo = async () => {
    if (!adminProfile?.id) return

    setIsUpdating(true)
    try {
      // Update profile in database
      const { data, error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          // Note: We don't update email in profiles table directly
        })
        .eq("id", adminProfile.id)
        .select()

      if (profileError) {
        throw profileError
      }

      // Update email in auth if it changed
      if (email !== adminProfile?.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email,
        })

        if (authError) {
          throw authError
        }
      }

      // Call the callback with updated profile
      if (onProfileUpdated && data && data[0]) {
        const updatedProfile = {
          ...adminProfile,
          ...data[0],
          email: email, // Include the updated email
        }
        onProfileUpdated(updatedProfile)
      }

      toast({
        title: t("settings.account.updateSuccess"),
        description: t("settings.account.updateSuccessMessage"),
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: t("settings.toast.error"),
        description: error.message || t("settings.toast.errorDesc"),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: t("settings.account.passwordMismatch"),
        description: t("settings.account.passwordMismatchMessage"),
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: t("settings.account.passwordChanged"),
        description: t("settings.account.passwordChangedMessage"),
      })
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast({
        title: t("settings.toast.error"),
        description: error.message || t("settings.toast.errorDesc"),
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Admin Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.account.adminInfo")}</CardTitle>
          <CardDescription>{t("settings.account.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("settings.account.name")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("settings.account.email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpdateInfo} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("settings.account.updating")}
                </>
              ) : (
                t("settings.account.updateInfo")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.account.password")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("settings.account.newPassword")}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("settings.account.confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("settings.account.changing")}
                </>
              ) : (
                t("settings.account.changePassword")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
