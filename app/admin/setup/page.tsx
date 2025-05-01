"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useInstitution } from "@/lib/institution-context"
import { useRouter } from "next/navigation"

// Step 1: Institution Details
function InstitutionDetailsStep({ onNext, initialData }) {
  const [name, setName] = useState(initialData?.name || "")
  const [logo, setLogo] = useState<File | null>(null)
  const [favicon, setFavicon] = useState<File | null>(null)
  const [primaryColor, setPrimaryColor] = useState(initialData?.primaryColor || "use ElectivePRO green color")

  const handleNext = () => {
    onNext({
      name,
      logo,
      favicon,
      primaryColor,
    })
  }

  return (
    <div className="space-y-4">
      {/* Form fields for institution details */}
      <Button onClick={handleNext}>Next: Program Structure</Button>
    </div>
  )
}

// Step 2: Program Structure
function ProgramStructureStep({ onNext, initialData }) {
  const [degrees, setDegrees] = useState(initialData?.degrees || [])
  const [programs, setPrograms] = useState(initialData?.programs || [])

  const handleNext = () => {
    onNext({
      degrees,
      programs,
    })
  }

  return (
    <div className="space-y-4">
      {/* Form fields for program structure */}
      <Button onClick={handleNext}>Next: User Roles</Button>
    </div>
  )
}

// Step 3: User Roles
function UserRolesStep({ onComplete, initialData }) {
  const [roles, setRoles] = useState(initialData?.roles || [])

  const handleComplete = () => {
    onComplete({
      roles,
    })
  }

  return (
    <div className="space-y-4">
      {/* Form fields for user roles */}
      <Button onClick={handleComplete}>Complete Setup</Button>
    </div>
  )
}

export default function SetupWizardPage() {
  const [activeStep, setActiveStep] = useState("institution")
  const [setupData, setSetupData] = useState({})
  const supabase = useSupabaseClient()
  const { institution } = useInstitution()
  const router = useRouter()

  const handleStepComplete = (step: string, data: any) => {
    setSetupData((prev) => ({ ...prev, [step]: data }))

    if (step === "institution") {
      setActiveStep("programs")
    } else if (step === "programs") {
      setActiveStep("roles")
    } else if (step === "roles") {
      completeSetup()
    }
  }

  const completeSetup = async () => {
    try {
      // Save all setup data to database
      // Upload logo and favicon if provided
      // Create degrees and programs
      // Configure user roles

      // Redirect to dashboard
      router.push("/admin/dashboard")
    } catch (error) {
      console.error("Setup failed:", error)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeStep} onValueChange={setActiveStep}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="institution" disabled={activeStep !== "institution"}>
                Institution Details
              </TabsTrigger>
              <TabsTrigger value="programs" disabled={activeStep !== "programs"}>
                Program Structure
              </TabsTrigger>
              <TabsTrigger value="roles" disabled={activeStep !== "roles"}>
                User Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="institution">
              <InstitutionDetailsStep
                onNext={(data) => handleStepComplete("institution", data)}
                initialData={setupData["institution"]}
              />
            </TabsContent>

            <TabsContent value="programs">
              <ProgramStructureStep
                onNext={(data) => handleStepComplete("programs", data)}
                initialData={setupData["programs"]}
              />
            </TabsContent>

            <TabsContent value="roles">
              <UserRolesStep
                onComplete={(data) => handleStepComplete("roles", data)}
                initialData={setupData["roles"]}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
