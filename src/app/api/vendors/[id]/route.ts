import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        settlements: {
          orderBy: { date: "desc" },
        },
        adjustments: {
          orderBy: { date: "desc" },
        },
        expenses: {
          include: { category: true },
          orderBy: { date: "desc" },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...vendor,
      outstandingBalance: Number(vendor.outstandingBalance),
    })
  } catch (error) {
    console.error("Error fetching vendor:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, email, address } = body

    const existing = await prisma.vendor.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    if (phone && phone !== existing.phone) {
      const duplicate = await prisma.vendor.findUnique({
        where: { phone },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: "A vendor with this phone number already exists" },
          { status: 409 }
        )
      }
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
      },
    })

    return NextResponse.json(vendor)
  } catch (error) {
    console.error("Error updating vendor:", error)
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await prisma.vendor.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    await prisma.vendor.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting vendor:", error)
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    )
  }
}
