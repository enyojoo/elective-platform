"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, SelectionStatus } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Clock, AlertTriangle, Calendar, Users, Globe, Info } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { useCachedStudentExchange } from "@/hooks/use-cached-student-exchange"

export default function StudentExchangePage() {
  const { t, language } = useLanguage()
  const { data, isLoading, error } = useCachedStudentExchange()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: SelectionStatus) => {
    switch (status) {
      case SelectionStatus.APPROVED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case SelectionStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case SelectionStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: SelectionStatus) => {
    switch (status) {
      case SelectionStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />
      case SelectionStatus.PENDING:
        return <Clock className="h-4 w-4" />
      case SelectionStatus.REJECTED:
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <PageSkeleton />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Exchange Programs</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const { exchanges, selections } = data || { exchanges: [], selections: [] }

  // Create a map of selections by elective_exchange_id for quick lookup
  const selectionMap = new Map(selections.map((sel) => [sel.elective_exchange_id, sel]))

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("student.exchange.title")}</h1>
          <p className="text-muted-foreground">{t("student.exchange.description")}</p>
        </div>

        {exchanges.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("student.exchange.noExchangesAvailable")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exchanges.map((exchange) => {
              const selection = selectionMap.get(exchange.id)
              const name = language === "ru" && exchange.name_ru ? exchange.name_ru : exchange.name
              const description =
                language === "ru" && exchange.description_ru ? exchange.description_ru : exchange.description
              const isDeadlinePassed = new Date(exchange.deadline) < new Date()
              const isDraft = exchange.status === "draft"

              return (
                <Card
                  key={exchange.id}
                  className={`flex flex-col h-full transition-all hover:shadow-md ${
                    selection?.status === SelectionStatus.APPROVED
                      ? "border-green-200 dark:border-green-800"
                      : selection?.status === SelectionStatus.PENDING
                        ? "border-yellow-200 dark:border-yellow-800"
                        : selection?.status === SelectionStatus.REJECTED
                          ? "border-red-200 dark:border-red-800"
                          : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg leading-tight">{name}</CardTitle>
                      {isDraft ? (
                        <Badge variant="outline" className="text-xs">
                          {t("student.exchange.comingSoon")}
                        </Badge>
                      ) : isDeadlinePassed ? (
                        <Badge variant="destructive" className="text-xs">
                          {t("student.exchange.closed")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {t("student.exchange.open")}
                        </Badge>
                      )}
                    </div>
                    {description && <CardDescription className="text-sm line-clamp-2">{description}</CardDescription>}
                  </CardHeader>

                  <CardContent className="flex-grow pb-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {t("student.exchange.deadline")}: {formatDate(exchange.deadline)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {t("student.exchange.maxSelections")}: {exchange.max_selections}
                        </span>
                      </div>

                      {selection && (
                        <div className="pt-2">
                          <Badge className={getStatusColor(selection.status)} variant="secondary">
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(selection.status)}
                              <span className="capitalize ml-1">
                                {t(`student.exchange.status.${selection.status}` as any, selection.status)}
                              </span>
                            </span>
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardContent className="pt-0 border-t mt-auto">
                    <Link href={`/student/exchange/${exchange.id}`} className="block w-full">
                      <Button variant="outline" className="w-full bg-transparent">
                        <Globe className="h-4 w-4 mr-2" />
                        {selection ? t("student.exchange.viewSelection") : t("student.exchange.viewDetails")}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
