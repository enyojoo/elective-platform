import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardSkeleton } from "@/components/ui/page-skeleton"
import { UserRole } from "@/lib/types"

export default function Loading() {
  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <DashboardSkeleton />
    </DashboardLayout>
  )
}
