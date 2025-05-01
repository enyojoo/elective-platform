import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CreatePlanLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-4 w-[250px] mt-2" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-[150px]" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-4 w-[80%]" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
