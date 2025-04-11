"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, Semester } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export default function ExchangePage() {
  const { t } = useLanguage()

  // Mock exchange data
  const exchangeData = [
    {
      id: "fall-2023",
      name: "Fall 2023",
      semester: Semester.FALL,
      year: 2023,
      maxSelections: 3,
      status: "published",
      startDate: "2023-08-01",
      endDate: "2023-08-15",
      universitiesCount: 8,
      availableSpaces: true,
      selected: true,
      selectionStatus: "approved",
      selectedCount: 2,
    },
    {
      id: "spring-2024",
      name: "Spring 2024",
      semester: Semester.SPRING,
      year: 2024,
      maxSelections: 3,
      status: "published",
      startDate: "2024-01-10",
      endDate: "2024-01-25",
      universitiesCount: 10,
      availableSpaces: true,
      selected: true,
      selectionStatus: "pending",
      selectedCount: 1,
    },
    {
      id: "fall-2024",
      name: "Fall 2024",
      semester: Semester.FALL,
      year: 2024,
      maxSelections: 3,
      status: "published",
      startDate: "2024-08-01",
      endDate: "2024-08-15",
      universitiesCount: 12,
      availableSpaces: false,
      selected: false,
      selectedCount: 0,
    },
    {
      id: "spring-2025",
      name: "Spring 2025",
      semester: Semester.SPRING,
      year: 2025,
      maxSelections: 3,
      status: "draft",
      startDate: "2025-01-10",
      endDate: "2025-01-25",
      universitiesCount: 9,
      availableSpaces: true,
      selected: false,
      selectedCount: 0,
    },
  ]

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "none":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "none":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("Exchange Program Selection")}</h1>
          <p className="text-muted-foreground">
            {t("Browse and select exchange universities available for your program")}
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {exchangeData.map((exchange) => (
            <Card
              key={exchange.id}
              className={`h-full transition-all hover:shadow-md ${
                exchange.selected
                  ? exchange.selectionStatus === "approved"
                    ? "border-green-500 bg-green-50/30 dark:bg-green-950/10"
                    : "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
                  : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{exchange.name}</CardTitle>
                    {exchange.selected ? (
                      <Badge className={getStatusColor(exchange.selectionStatus)} variant="secondary">
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(exchange.selectionStatus)}
                          <span className="capitalize ml-1">{exchange.selectionStatus}</span>
                        </span>
                      </Badge>
                    ) : (
                      <Badge className={getStatusColor("none")} variant="secondary">
                        <span className="flex items-center space-x-1">
                          {getStatusIcon("none")}
                          <span className="capitalize ml-1">{t("No Selection")}</span>
                        </span>
                      </Badge>
                    )}
                  </div>
                  {exchange.status === "draft" ? (
                    <Badge variant="outline">{t("Coming Soon")}</Badge>
                  ) : exchange.availableSpaces ? (
                    <Badge variant="secondary">{t("Open")}</Badge>
                  ) : (
                    <Badge variant="destructive">{t("Limited")}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow"></CardContent>
              <CardFooter className="flex flex-col pt-0 pb-4 gap-4">
                <div className="flex flex-col gap-y-2 text-sm w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{t("Deadline")}:</span>
                    <span>{formatDate(exchange.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{t("Universities")}:</span>
                      <span>{exchange.universitiesCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{t("Limit")}:</span>
                      <span>{exchange.maxSelections}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between rounded-md p-2 w-full ${
                    exchange.selected
                      ? exchange.selectionStatus === "approved"
                        ? "bg-green-100/50 dark:bg-green-900/20"
                        : "bg-yellow-100/50 dark:bg-yellow-900/20"
                      : "bg-gray-100/50 dark:bg-gray-900/20"
                  }`}
                >
                  <span className="text-sm">
                    {t("Selected")}: {exchange.selectedCount}/{exchange.maxSelections}
                  </span>
                  <Link href={`/student/exchange/${exchange.id}`}>
                    <Button
                      size="sm"
                      variant={
                        exchange.status === "draft"
                          ? "outline"
                          : exchange.selected
                            ? exchange.selectionStatus === "approved"
                              ? "outline"
                              : "secondary"
                            : "default"
                      }
                      className={`h-7 gap-1 ${
                        exchange.selected && exchange.selectionStatus === "approved"
                          ? "border-green-200 hover:bg-green-100 dark:border-green-800 dark:hover:bg-green-900/30"
                          : exchange.status === "draft"
                            ? "border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-900/30"
                            : ""
                      }`}
                    >
                      <>
                        <span>{t("View")}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
