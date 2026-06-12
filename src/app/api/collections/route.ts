import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "daily"
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")
  const now = new Date()

  let startDate: Date
  let endDate: Date

  if (dateFrom && dateTo) {
    startDate = new Date(dateFrom)
    endDate = new Date(dateTo)
  } else {
    switch (period) {
      case "daily":
        startDate = startOfDay(now)
        endDate = endOfDay(now)
        break
      case "weekly":
        startDate = startOfWeek(now, { weekStartsOn: 1 })
        endDate = endOfWeek(now, { weekStartsOn: 1 })
        break
      case "monthly":
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      default:
        startDate = startOfDay(now)
        endDate = endOfDay(now)
    }
  }

  const collections = await prisma.collection.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "desc" },
  })

  const totals = collections.reduce(
    (acc, col) => ({
      cashAmount: acc.cashAmount + Number(col.cashAmount),
      gpayAmount: acc.gpayAmount + Number(col.gpayAmount),
      advanceAmount: acc.advanceAmount + Number(col.advanceAmount),
      balanceAmount: acc.balanceAmount + Number(col.balanceAmount),
    }),
    { cashAmount: 0, gpayAmount: 0, advanceAmount: 0, balanceAmount: 0 }
  )

  return NextResponse.json({
    collections,
    totals: {
      totalCash: totals.cashAmount,
      totalGpay: totals.gpayAmount,
      totalAdvance: totals.advanceAmount,
      totalBalance: totals.balanceAmount,
      totalCollection: totals.cashAmount + totals.gpayAmount,
    },
    period: {
      start: startDate,
      end: endDate,
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { date, cashAmount, gpayAmount, advanceAmount, balanceAmount, notes } = body

    const collection = await prisma.collection.create({
      data: {
        date: new Date(date),
        cashAmount: Number.parseFloat(cashAmount || 0),
        gpayAmount: Number.parseFloat(gpayAmount || 0),
        advanceAmount: Number.parseFloat(advanceAmount || 0),
        balanceAmount: Number.parseFloat(balanceAmount || 0),
        notes: notes || null,
      },
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error("Error creating collection:", error)
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 })
  }
}
