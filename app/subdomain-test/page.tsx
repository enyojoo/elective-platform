import { headers } from "next/headers"
import { getSubdomain } from "@/lib/subdomain-utils"

export default function SubdomainTestPage() {
  const headersList = headers()
  const host = headersList.get("host") || ""
  const subdomain = getSubdomain(host)
  const institutionId = headersList.get("x-institution-id")
  const institutionName = headersList.get("x-institution-name")

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Subdomain Test Page</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Request Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium">Host:</div>
          <div>{host}</div>

          <div className="font-medium">Detected Subdomain:</div>
          <div>{subdomain || "None"}</div>

          <div className="font-medium">Institution ID:</div>
          <div>{institutionId || "None"}</div>

          <div className="font-medium">Institution Name:</div>
          <div>{institutionName || "None"}</div>
        </div>
      </div>
    </div>
  )
}
