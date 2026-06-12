import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { Prisma } from "@prisma/client"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        user: { select: { id: true, name: true } },
      },
    })

    if (!bill) {
      return Response.json({ error: "Bill not found" }, { status: 404 })
    }

    return Response.json(bill)
  } catch (error) {
    console.error("Error fetching bill:", error)
    return Response.json({ error: "Failed to fetch bill" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status } = body

    const existing = await prisma.bill.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Bill not found" }, { status: 404 })
    }

    if (status === "CANCELLED") {
      const bill = await prisma.bill.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { items: true, customer: true },
      })

      if (bill.customerId) {
        const total = new Prisma.Decimal(bill.total.toString())
        await prisma.customer.update({
          where: { id: bill.customerId },
          data: {
            visitCount: { decrement: 1 },
            totalSpent: { decrement: total },
          },
        })
      }

      return Response.json(bill)
    }

    const bill = await prisma.bill.update({
      where: { id },
      data: { ...body },
      include: { items: true, customer: true },
    })

    return Response.json(bill)
  } catch (error) {
    console.error("Error updating bill:", error)
    return Response.json({ error: "Failed to update bill" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.bill.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Bill not found" }, { status: 404 })
    }

    const bill = await prisma.bill.update({
      where: { id },
      data: { ...body },
      include: { items: true, customer: true },
    })

    return Response.json(bill)
  } catch (error) {
    console.error("Error updating bill:", error)
    return Response.json({ error: "Failed to update bill" }, { status: 500 })
  }
}
