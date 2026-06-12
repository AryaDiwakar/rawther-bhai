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

    const settlements = await prisma.vendorSettlement.findMany({
      where: { vendorId: id },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(settlements)
  } catch (error) {
    console.error("Error fetching settlements:", error)
    return NextResponse.json(
      { error: "Failed to fetch settlements" },
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
    const { amount, mode, date, notes } = body

    if (!amount || !mode || !date) {
      return NextResponse.json(
        { error: "Amount, mode, and date are required" },
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

    const settlementAmount = parseFloat(amount)

    const [settlement] = await prisma.$transaction([
      prisma.vendorSettlement.create({
        data: {
          vendorId: id,
          amount: settlementAmount,
          mode,
          date: new Date(date),
          notes: notes?.trim() || null,
        },
      }),
      prisma.vendor.update({
        where: { id },
        data: {
          outstandingBalance: {
            decrement: settlementAmount,
          },
        },
      }),
    ])

    return NextResponse.json(settlement, { status: 201 })
  } catch (error) {
    console.error("Error creating settlement:", error)
    return NextResponse.json(
      { error: "Failed to create settlement" },
      { status: 500 }
    )
  }
}
