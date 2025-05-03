"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useSuperAdminAuth } from "@/lib/super-admin-auth-context"
import Image from "next/image"
import { useInstitution } from "@/lib/institution-context"
import { useToast } from "@/hooks/use-toast"

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useSuperAdminAuth()
  const { isSubdomainAccess, isLoading: institutionLoading } = useInstitution()
  const { toast } = useToast()

  // Redirect to subdomain if accessed via subdomain
  useEffect(() => {
    if (!institutionLoading && isSubdomainAccess) {
      // If accessed via subdomain, redirect to student login
      window.location.href = "/student/login"
    }
  }, [institutionLoading, isSubdomainAccess])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Use the Supabase login function
      const { success, error } = await login(email, password)

      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome to the super admin dashboard",
        })
        router.push("/super-admin/dashboard")
      } else {
        setError(error || "Invalid credentials. Please try again.")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (institutionLoading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-md space-y-6 w-full">
        <div className="flex justify-center mb-8">
          <Image
            src="/images/elective-pro-logo.svg"
            alt="ElectivePRO"
            width={140}
            height={45}
            className="h-10 w-auto"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Super Admin Login</CardTitle>
            <CardDescription>Access the ElectivePRO management console</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
