"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, ExternalLink, Info } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"

export default function InstitutionRequiredPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-md space-y-6 w-full">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/elective-pro-logo.svg"
            alt="ElectivePRO Logo"
            width={160}
            height={45}
            className="h-10 w-auto"
          />
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Building className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Institution Access Required</CardTitle>
            <CardDescription>
              Student and manager access is only available through your institution's subdomain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Access Information</h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                    <p>
                      To access student or manager features, please use your institution's specific subdomain URL. For
                      example: <span className="font-mono font-bold">yourschool.electivepro.net</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">How to access your institution:</h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Contact your institution administrator for your specific subdomain</li>
                <li>Visit your institution's subdomain directly (e.g., yourschool.electivepro.net)</li>
                <li>Log in with your student or manager credentials</li>
              </ol>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button asChild className="w-full">
              <Link href="https://app.electivepro.net">
                Go to Main Platform <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Are you an administrator?{" "}
              <Link href="/admin/login" className="text-primary hover:underline">
                Log in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
