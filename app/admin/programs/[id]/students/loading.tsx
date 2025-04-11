import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProgramStudentsLoading() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <div className="flex items-center gap-2 mt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-10 w-[130px]" />
                  <Skeleton className="h-10 w-[180px]" />
                  <Skeleton className="h-10 w-[180px]" />
                </div>
              </div>

              <div className="rounded-md border">
                <div className="p-4">
                  <div className="flex items-center gap-4 py-3">
                    <Skeleton className="h-5 w-1/6" />
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-5 w-1/6" />
                    <Skeleton className="h-5 w-1/12" />
                    <Skeleton className="h-5 w-1/12" />
                    <Skeleton className="h-5 w-1/12 ml-auto" />
                  </div>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 py-4 border-t">
                      <Skeleton className="h-5 w-1/6" />
                      <Skeleton className="h-5 w-1/4" />
                      <Skeleton className="h-5 w-1/6" />
                      <Skeleton className="h-5 w-1/12" />
                      <Skeleton className="h-5 w-1/12" />
                      <Skeleton className="h-5 w-1/12 ml-auto" />
                    </div>
                  ))}
                </div>
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
