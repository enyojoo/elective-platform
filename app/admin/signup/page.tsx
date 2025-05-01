"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

export default function InstitutionSignupPage() {
  const [institutionName, setInstitutionName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Call the create_institution function
      const { data, error } = await supabase.rpc("create_institution", {
        institution_name: institutionName,
        institution_subdomain: subdomain,
        admin_email: adminEmail,
        admin_password: adminPassword,
      })

      if (error) throw error

      // Redirect to the institution setup wizard
      router.push(`https://${subdomain}.electivepro.net/setup`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create institution")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-md space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Register Your Institution</CardTitle>
            <CardDescription>Create your ElectivePRO account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input
                  id="institutionName"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center">
                  <Input
                    id="subdomain"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                    required
                    className="rounded-r-none"
                  />
                  <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md">.electivepro.net</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Account"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
