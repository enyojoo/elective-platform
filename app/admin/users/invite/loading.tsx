import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FormSkeleton } from "@/components/ui/page-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <FormSkeleton />
    </DashboardLayout>
  )
}
