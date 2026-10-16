"use client"
import { ScannerPage } from "@/components/scanner/scanner-page"
import { useQuery } from "@/lib/nav"
import { parseScannerSearch } from "@/lib/scan/table"

export function ScannerRoute() {
  return <ScannerPage search={parseScannerSearch(useQuery())} />
}
