import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-md space-y-6 w-full">
        <div className="flex justify-center mb-6">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4 border rounded-lg p-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full mt-4" />
          <Skeleton className="h-4 w-full mt-2" />
          <div className="flex gap-2 w-full">
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="flex justify-center mt-4">
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}
