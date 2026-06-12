"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface UpcomingOrder {
  id: string
  orderNo: string
  customer: string
  deliveryDate: string | null
  advance: number
  balance: number
  status: string
}

interface UpcomingOrdersProps {
  orders: UpcomingOrder[]
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function UpcomingOrders({ orders }: UpcomingOrdersProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Upcoming Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {!orders || orders.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No upcoming orders
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{order.orderNo}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {order.status.toLowerCase().replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.customer}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {order.deliveryDate ?? "No date set"}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Adv: {formatINR(order.advance)}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      Bal: {formatINR(order.balance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
