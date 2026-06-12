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

interface RecentExpense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  paymentMode: string
}

interface RecentExpensesProps {
  expenses: RecentExpense[]
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

const modeColors: Record<string, "default" | "secondary" | "outline"> = {
  CASH: "default",
  GPAY: "secondary",
  CARD: "outline",
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!expenses || expenses.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No expenses yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="max-w-[160px] truncate font-medium">
                    {expense.description}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                    -{formatINR(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={modeColors[expense.paymentMode] ?? "outline"}
                      className="capitalize"
                    >
                      {expense.paymentMode.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {expense.date}
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
