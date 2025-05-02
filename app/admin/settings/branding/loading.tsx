import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BrandingSettingsLoading() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <Skeleton className="h-10 w-64 mb-6" />

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <div className="flex gap-2">
                    <Skeleton className="w-12 h-10" />
                    <Skeleton className="flex-1 h-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <div className="flex gap-2">
                    <Skeleton className="w-12 h-10" />
                    <Skeleton className="flex-1 h-10" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20 mb-1" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-5 w-20 mb-1" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
