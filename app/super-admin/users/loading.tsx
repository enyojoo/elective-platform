import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SuperAdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="mt-2 h-4 w-[300px]" />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Button disabled>
          <Skeleton className="h-4 w-[100px]" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-5 border-b bg-muted/50 px-4 py-3">
              {Array(5)
                .fill(null)
                .map((_, i) => (
                  <Skeleton key={i} className="h-5 w-[80%]" />
                ))}
            </div>
            <div className="divide-y">
              {Array(4)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="grid grid-cols-5 items-center px-4 py-3">
                    <Skeleton className="h-5 w-[90%]" />
                    <Skeleton className="h-5 w-[90%]" />
                    <Skeleton className="h-5 w-[60%]" />
                    <Skeleton className="h-5 w-[70%]" />
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-9 w-[60px]" />
                      <Skeleton className="h-9 w-[60px]" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
