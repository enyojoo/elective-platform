"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Stepper, Step, StepLabel, StepContent } from "@mui/material"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"

export default function SetupWizardPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [institutionData, setInstitutionData] = useState<any>(null)
  const router = useRouter()

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Check if user is authenticated and get institution data
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/admin/login")
        return
      }

      // Get institution data
      const { data, error } = await supabase
        .from("institutions")
        .select("*")
        .eq("admin_user_id", session.user.id)
        .single()

      if (error || !data) {
        router.push("/admin/login")
        return
      }

      setInstitutionData(data)
    }

    checkAuth()
  }, [router])

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      // Mark setup as complete
      await supabase.from("institutions").update({ setup_completed: true }).eq("id", institutionData.id)

      // Redirect to dashboard
      router.push("/admin/dashboard")
    } catch (error) {
      console.error("Error completing setup:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    {
      label: "Welcome",
      description: `Welcome to ElectivePRO! This wizard will guide you through setting up your institution.`,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Welcome to ElectivePRO!</h3>
          <p>
            Thank you for choosing ElectivePRO for managing your institution's elective courses. This setup wizard will
            guide you through the initial configuration of your account.
          </p>
          <p>You'll be able to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Configure your institution profile</li>
            <li>Set up academic programs</li>
            <li>Create your first courses</li>
            <li>Invite faculty and staff</li>
          </ul>
        </div>
      ),
    },
    {
      label: "Institution Profile",
      description: "Configure your institution profile information.",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Institution Profile</h3>
          <p>Your institution has been created with the following information:</p>
          {institutionData && (
            <div className="space-y-2 bg-muted p-4 rounded-md">
              <p>
                <strong>Name:</strong> {institutionData.name}
              </p>
              <p>
                <strong>Subdomain:</strong> {institutionData.subdomain}.electivepro.net
              </p>
            </div>
          )}
          <p>You can update this information later in the admin settings.</p>
        </div>
      ),
    },
    {
      label: "Academic Programs",
      description: "Set up your first academic program.",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Academic Programs</h3>
          <p>
            Academic programs are the foundation of your elective system. Each program can have its own set of courses,
            requirements, and student groups.
          </p>
          <p>
            After completing this setup, you'll be able to create your first academic program from the admin dashboard.
          </p>
        </div>
      ),
    },
    {
      label: "Complete",
      description: "Your institution is ready to use!",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-center">Setup Complete!</h3>
          <p className="text-center">
            Congratulations! Your institution is now set up and ready to use. Click the button below to go to your admin
            dashboard.
          </p>
        </div>
      ),
    },
  ]

  if (!institutionData) {
    return (
      <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-background">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-3xl w-full">
        <Card>
          <CardHeader>
            <CardTitle>Institution Setup</CardTitle>
            <CardDescription>Complete the setup for your ElectivePRO account</CardDescription>
          </CardHeader>
          <CardContent>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>{step.label}</StepLabel>
                  <StepContent>
                    <div className="py-4">{step.content}</div>
                    <div className="flex justify-between mt-4">
                      {index === steps.length - 1 ? (
                        <Button onClick={handleComplete} disabled={isLoading}>
                          {isLoading ? "Completing..." : "Go to Dashboard"}
                        </Button>
                      ) : (
                        <Button onClick={handleNext}>Continue</Button>
                      )}
                    </div>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
