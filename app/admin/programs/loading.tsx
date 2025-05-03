import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TableSkeleton } from "@/components/ui/page-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <TableSkeleton itemCount={6} />
    </DashboardLayout>
  )
}
