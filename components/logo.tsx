import { DEFAULT_LOGO_URL } from "@/lib/constants"
import { useInstitution } from "@/lib/institution-context"

interface LogoProps {
  className?: string
  height?: number
  width?: number
}

export function Logo({ className, height = 40, width = 160 }: LogoProps) {
  const { institution } = useInstitution()
  const logoUrl = institution?.logo_url || DEFAULT_LOGO_URL

  return (
    <div className={className} style={{ height, width }}>
      <img
        src={logoUrl || "/placeholder.svg"}
        alt="ElectivePRO Logo"
        className="h-full w-auto object-contain"
        style={{ maxHeight: height, maxWidth: width }}
      />
    </div>
  )
}
