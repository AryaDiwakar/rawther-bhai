import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import type { OrderPaymentMode, OrderPaymentType } from "@prisma/client"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const payments = await prisma.orderPayment.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(payments)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const { amount, mode, type } = body as {
      amount: number
      mode: OrderPaymentMode
      type: OrderPaymentType
    }

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const paymentAmount = Number.parseFloat(String(amount))

    const [payment] = await prisma.$transaction([
      prisma.orderPayment.create({
        data: {
          orderId: id,
          amount: paymentAmount,
          mode,
          type,
        },
      }),
    ])

    const allPayments = await prisma.orderPayment.findMany({ where: { orderId: id } })
    const totalAdvance = allPayments
      .filter((p) => p.type === "ADVANCE")
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const totalAmount = Number(existing.totalAmount)
    const newBalance = totalAmount - totalPaid

    let newStatus = existing.status
    if (totalPaid >= totalAmount) {
      newStatus = "COMPLETED"
    } else if (totalPaid > 0) {
      newStatus = "PENDING_BALANCE"
    }

    await prisma.order.update({
      where: { id },
      data: {
        advance: totalAdvance,
        balance: Math.max(0, newBalance),
        status: newStatus,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error("Error adding payment:", error)
    return NextResponse.json({ error: "Failed to add payment" }, { status: 500 })
  }
}
