import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function InvalidInstitutionPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-md space-y-6 w-full text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/elective-pro-logo.svg"
            alt="ElectivePRO Logo"
            width={160}
            height={45}
            className="h-10 w-auto"
          />
        </div>

        <h1 className="text-2xl font-bold">Invalid Institution</h1>
        <p className="text-muted-foreground">
          The institution you are trying to access does not exist or is not active.
        </p>

        <div className="mt-8">
          <Button asChild>
            <Link href="https://app.electivepro.net">Return to Main Site</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
