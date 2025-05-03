import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardGridSkeleton } from "@/components/ui/page-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <CardGridSkeleton itemCount={6} />
    </DashboardLayout>
  )
}
