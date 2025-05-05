"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface AccountSettingsProps {
  adminProfile: any
}

export function AccountSettings({ adminProfile }: AccountSettingsProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [name, setName] = useState(adminProfile?.full_name || "")
  const [email, setEmail] = useState(adminProfile?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email) {
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.requiredFields"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdating(true)

      const response = await fetch("/api/admin/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      toast({
        title: t("settings.toast.success"),
        description: t("settings.toast.profileUpdated"),
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.profileUpdateError"),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.requiredFields"),
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.passwordsDoNotMatch"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsChangingPassword(true)

      const response = await fetch("/api/admin/password/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update password")
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: t("settings.toast.success"),
        description: t("settings.toast.passwordUpdated"),
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: t("settings.toast.error"),
        description: t("settings.toast.passwordUpdateError"),
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">{t("settings.account.profileInfo")}</h3>
        <p className="text-sm text-muted-foreground">{t("settings.account.profileDescription")}</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">{t("settings.account.name")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("settings.account.namePlaceholder")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">{t("settings.account.email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("settings.account.emailPlaceholder")}
          />
        </div>

        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.updating")}
            </>
          ) : (
            t("settings.account.updateProfile")
          )}
        </Button>
      </form>

      <div className="pt-4 border-t">
        <h3 className="text-lg font-medium">{t("settings.account.changePassword")}</h3>
        <p className="text-sm text-muted-foreground">{t("settings.account.passwordDescription")}</p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="current-password">{t("settings.account.currentPassword")}</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="new-password">{t("settings.account.newPassword")}</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirm-password">{t("settings.account.confirmPassword")}</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" disabled={isChangingPassword}>
          {isChangingPassword ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.updating")}
            </>
          ) : (
            t("settings.account.updatePassword")
          )}
        </Button>
      </form>
    </div>
  )
}
