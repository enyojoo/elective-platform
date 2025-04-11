import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-10 w-[250px]" />
              <Skeleton className="h-6 w-[150px] mt-2" />
            </div>
          </div>
          <Skeleton className="h-10 w-[150px]" />
        </div>

        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    </DashboardLayout>
  )
}
