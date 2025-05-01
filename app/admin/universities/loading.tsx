import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function UniversitiesLoading() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-[130px]" />
                  <Skeleton className="h-10 w-[180px]" />
                </div>
              </div>

              <div className="rounded-md border">
                <div className="h-10 border-b px-4 flex items-center">
                  <Skeleton className="h-4 w-full" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 border-b px-4 flex items-center">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <Skeleton className="h-10 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
