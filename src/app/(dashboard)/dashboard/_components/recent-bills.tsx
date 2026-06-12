"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface RecentBill {
  id: string
  billNo: string
  customer: string | null
  total: number
  paymentMode: string
  date: string
  status: string
}

interface RecentBillsProps {
  bills: RecentBill[]
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

const paymentModeColors: Record<string, "default" | "secondary" | "outline" | "ghost"> = {
  CASH: "default",
  GPAY: "secondary",
  SPLIT: "outline",
  CARD: "secondary",
}

export function RecentBills({ bills }: RecentBillsProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Recent Bills</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!bills || bills.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No bills yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.billNo}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {bill.customer ?? "Walk-in"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatINR(bill.total)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={paymentModeColors[bill.paymentMode] ?? "outline"}
                      className="capitalize"
                    >
                      {bill.paymentMode.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {bill.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
