"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface PendingVendor {
  id: string
  name: string
  outstanding: number
}

interface PendingVendorsProps {
  vendors: PendingVendor[]
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function PendingVendors({ vendors }: PendingVendorsProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Pending Vendor Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {!vendors || vendors.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No pending vendor payments
          </div>
        ) : (
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{vendor.name}</p>
                  <p className="text-xs text-muted-foreground">Payment due</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {formatINR(vendor.outstanding)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
