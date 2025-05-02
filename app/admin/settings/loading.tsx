import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <Skeleton className="h-10 w-48 mb-6" />

        <div className="space-y-6">
          <Skeleton className="h-10 w-full max-w-md" />

          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
