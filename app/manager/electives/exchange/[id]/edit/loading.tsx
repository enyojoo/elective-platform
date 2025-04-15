import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function ExchangeEditLoading() {
  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-8 w-64" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        <div className="hidden md:flex items-center justify-between">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-4 mr-8">
                <Skeleton className="h-5 w-24" />
              </div>
              {index < 2 && <Skeleton className="h-5 w-5 mr-8" />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-1 gap-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
