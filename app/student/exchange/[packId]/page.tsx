import type { Metadata } from "next"
import ExchangePageClient from "./ExchangePageClient"

interface ExchangePageProps {
  params: {
    packId: string
  }
}

export const metadata: Metadata = {
  title: "Exchange Program Details",
  description: "View and select universities for exchange",
}

export default function ExchangePage({ params }: ExchangePageProps) {
  return <ExchangePageClient params={params} />
}
