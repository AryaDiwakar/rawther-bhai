import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vendor = await prisma.vendor.findUnique({ where: { id } })
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    const adjustments = await prisma.vendorAdjustment.findMany({
      where: { vendorId: id },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(adjustments)
  } catch (error) {
    console.error("Error fetching adjustments:", error)
    return NextResponse.json(
      { error: "Failed to fetch adjustments" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount, type, reason, date } = body

    if (!amount || !type || !reason || !date) {
      return NextResponse.json(
        { error: "Amount, type, reason, and date are required" },
        { status: 400 }
      )
    }

    const vendor = await prisma.vendor.findUnique({ where: { id } })
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    const adjustmentAmount = parseFloat(amount)
    const isCredit = type === "CREDIT"

    const [adjustment] = await prisma.$transaction([
      prisma.vendorAdjustment.create({
        data: {
          vendorId: id,
          amount: adjustmentAmount,
          type,
          reason: reason.trim(),
          date: new Date(date),
        },
      }),
      prisma.vendor.update({
        where: { id },
        data: {
          outstandingBalance: isCredit
            ? { increment: adjustmentAmount }
            : { decrement: adjustmentAmount },
        },
      }),
    ])

    return NextResponse.json(adjustment, { status: 201 })
  } catch (error) {
    console.error("Error creating adjustment:", error)
    return NextResponse.json(
      { error: "Failed to create adjustment" },
      { status: 500 }
    )
  }
}
