import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminElectivesLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Skeleton className="h-8 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="courses">Course Electives</TabsTrigger>
          <TabsTrigger value="exchange">Exchange Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <div className="flex flex-col sm:flex-row gap-2">
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-[200px] mb-2" />
                      <Skeleton className="h-4 w-[150px]" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div>
                          <Skeleton className="h-4 w-[60px] mb-1" />
                          <Skeleton className="h-6 w-[40px]" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-[80px] mb-1" />
                          <Skeleton className="h-6 w-[40px]" />
                        </div>
                        <div className="col-span-2">
                          <Skeleton className="h-4 w-[80px] mb-1" />
                          <Skeleton className="h-4 w-[180px]" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
