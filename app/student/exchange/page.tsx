"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { type ExchangeProgram, getExchangePrograms } from "@/actions/exchange-programs"
import { Skeleton } from "@/components/ui/skeleton"

export default function ExchangePage() {
  const { t } = useLanguage()
  const [exchangeData, setExchangeData] = useState<ExchangeProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchExchangePrograms() {
      try {
        setLoading(true)
        const programs = await getExchangePrograms()
        setExchangeData(programs)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch exchange programs:", err)
        setError("Failed to load exchange programs. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchExchangePrograms()
  }, [])

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Helper function to get status color
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "none":
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  // Helper function to get status icon
  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "rejected":
        return <AlertCircle className="h-4 w-4" />
      case "none":
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("student.exchange.title")}</h1>
          <p className="text-muted-foreground">{t("student.exchange.subtitle")}</p>
        </div>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter className="flex flex-col pt-0 pb-4 gap-4">
                  <div className="flex flex-col gap-y-2 text-sm w-full">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            <p>{error}</p>
            <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : exchangeData.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
            <p>{t("student.exchange.noPrograms")}</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {exchangeData.map((exchange) => (
              <Card
                key={exchange.id}
                className={`h-full transition-all hover:shadow-md ${
                  exchange.selected
                    ? exchange.selection_status === "approved"
                      ? "border-green-500 bg-green-50/30 dark:bg-green-950/10"
                      : exchange.selection_status === "pending"
                        ? "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
                        : "border-red-500 bg-red-50/30 dark:bg-red-950/10"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{exchange.name}</CardTitle>
                      {exchange.selected ? (
                        <Badge className={getStatusColor(exchange.selection_status)} variant="secondary">
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(exchange.selection_status)}
                            <span className="capitalize ml-1">{exchange.selection_status}</span>
                          </span>
                        </Badge>
                      ) : (
                        <Badge className={getStatusColor("none")} variant="secondary">
                          <span className="flex items-center space-x-1">
                            {getStatusIcon("none")}
                            <span className="capitalize ml-1">{t("student.exchange.noSelection")}</span>
                          </span>
                        </Badge>
                      )}
                    </div>
                    {exchange.status === "draft" ? (
                      <Badge variant="outline">{t("student.exchange.comingSoon")}</Badge>
                    ) : exchange.available_spaces ? (
                      <Badge variant="secondary">{t("student.exchange.open")}</Badge>
                    ) : (
                      <Badge variant="destructive">{t("student.exchange.limited")}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow"></CardContent>
                <CardFooter className="flex flex-col pt-0 pb-4 gap-4">
                  <div className="flex flex-col gap-y-2 text-sm w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{t("student.exchange.deadline")}:</span>
                      <span>{formatDate(exchange.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{t("student.exchange.universities")}:</span>
                        <span>{exchange.universities_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{t("student.exchange.limit")}:</span>
                        <span>{exchange.max_selections}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between rounded-md p-2 w-full ${
                      exchange.selected
                        ? exchange.selection_status === "approved"
                          ? "bg-green-100/50 dark:bg-green-900/20"
                          : exchange.selection_status === "pending"
                            ? "bg-yellow-100/50 dark:bg-yellow-900/20"
                            : "bg-red-100/50 dark:bg-red-900/20"
                        : "bg-gray-100/50 dark:bg-gray-900/20"
                    }`}
                  >
                    <span className="text-sm">
                      {t("student.exchange.selected")}: {exchange.selected_count}/{exchange.max_selections}
                    </span>
                    <Link href={`/student/exchange/${exchange.id}`}>
                      <Button
                        size="sm"
                        variant={
                          exchange.status === "draft"
                            ? "outline"
                            : exchange.selected
                              ? exchange.selection_status === "approved"
                                ? "outline"
                                : "secondary"
                              : "default"
                        }
                        className={`h-7 gap-1 ${
                          exchange.selected && exchange.selection_status === "approved"
                            ? "border-green-200 hover:bg-green-100 dark:border-green-800 dark:hover:bg-green-900/30"
                            : exchange.status === "draft"
                              ? "border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-900/30"
                              : ""
                        }`}
                      >
                        <>
                          <span>{t("student.exchange.view")}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
