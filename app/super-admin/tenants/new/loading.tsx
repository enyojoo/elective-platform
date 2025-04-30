import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NewTenantLoading() {
  return (
    <div className="container mx-auto py-10">
      <Skeleton className="h-10 w-[200px] mb-6" />

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="basic" disabled>
            Basic Information
          </TabsTrigger>
          <TabsTrigger value="admin" disabled>
            Admin Account
          </TabsTrigger>
          <TabsTrigger value="limits" disabled>
            Subscription & Limits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-[180px]" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-[250px]" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
