import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DetailSkeleton } from "@/components/ui/page-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <DetailSkeleton />
    </DashboardLayout>
  )
}
