import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ElectivePackDetailsLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href="/admin/electives">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Electives
          </Link>
        </Button>
        <div>
          <Skeleton className="h-8 w-[300px] mb-2" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-6 w-[80px] ml-auto" />
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-[100px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-[100px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-[120px] mb-1" />
            <Skeleton className="h-4 w-[100px]" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Student Selections</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <Skeleton className="h-5 w-[150px] mb-2" />
                  <Skeleton className="h-4 w-[250px]" />
                </div>
                <Skeleton className="h-9 w-[150px] mt-2 md:mt-0" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[180px]" />
              </div>

              <div className="rounded-md border">
                <div className="border-b bg-muted/50 py-3 px-4">
                  <div className="grid grid-cols-7 gap-4">
                    <Skeleton className="h-5 w-[100px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[120px]" />
                    <Skeleton className="h-5 w-[60px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[60px]" />
                  </div>
                </div>
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="border-b py-3 px-4">
                      <div className="grid grid-cols-7 gap-4">
                        <Skeleton className="h-5 w-[150px]" />
                        <Skeleton className="h-5 w-[60px]" />
                        <Skeleton className="h-5 w-[140px]" />
                        <Skeleton className="h-5 w-[40px]" />
                        <Skeleton className="h-5 w-[70px]" />
                        <Skeleton className="h-5 w-[50px]" />
                        <Skeleton className="h-8 w-[30px]" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
