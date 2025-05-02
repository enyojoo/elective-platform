import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsLoading() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <Skeleton className="h-10 w-48 mb-6" />

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-6">
            <Skeleton className="h-[500px] w-full rounded-md" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
