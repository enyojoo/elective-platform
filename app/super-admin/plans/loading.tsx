import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function PlansLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-4 w-[350px] mt-2" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 border-b bg-muted/50 px-4 py-3">
              <Skeleton className="h-5 w-[80%] col-span-2" />
              <Skeleton className="h-5 w-[80%] col-span-2" />
              <Skeleton className="h-5 w-[80%] col-span-2" />
              <Skeleton className="h-5 w-[80%] col-span-2" />
              <Skeleton className="h-5 w-[80%] col-span-2" />
              <Skeleton className="h-5 w-[80%] col-span-2" />
            </div>
            <div className="divide-y">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="grid grid-cols-12 items-center px-4 py-3">
                  <Skeleton className="h-5 w-[80%] col-span-2" />
                  <Skeleton className="h-5 w-[80%] col-span-2" />
                  <Skeleton className="h-5 w-[80%] col-span-2" />
                  <Skeleton className="h-5 w-[80%] col-span-2" />
                  <Skeleton className="h-5 w-[80%] col-span-2" />
                  <Skeleton className="h-5 w-[20px] col-span-2 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
