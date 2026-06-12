"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface TopCustomer {
  id: string
  name: string
  visitCount: number
  totalSpent: number
}

interface TopCustomersProps {
  customers: TopCustomer[]
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

const medals = ["🥇", "🥈", "🥉"]

export function TopCustomers({ customers }: TopCustomersProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Top Customers</CardTitle>
      </CardHeader>
      <CardContent>
        {!customers || customers.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No customer data yet
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index < 3 ? (
                    <span className="text-base">{medals[index]}</span>
                  ) : (
                    <span className="text-muted-foreground">#{index + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.visitCount} visit{customer.visitCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatINR(customer.totalSpent)}
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
