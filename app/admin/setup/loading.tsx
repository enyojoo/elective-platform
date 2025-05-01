import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
