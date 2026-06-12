import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const outstandingFilter = searchParams.get("outstanding") || ""

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    if (outstandingFilter === "yes") {
      where.outstandingBalance = { gt: 0 }
    } else if (outstandingFilter === "no") {
      where.outstandingBalance = { equals: 0 }
    }

    const skip = (page - 1) * pageSize

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          settlements: {
            orderBy: { date: "desc" },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.vendor.count({ where }),
    ])

    const totalOutstanding = await prisma.vendor.aggregate({
      where,
      _sum: { outstandingBalance: true },
    })

    const totalSettled = await prisma.vendorSettlement.aggregate({
      _sum: { amount: true },
    })

    const data = vendors.map((v) => ({
      ...v,
      outstandingBalance: Number(v.outstandingBalance),
      lastSettlementDate: v.settlements[0]?.date || null,
    }))

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalVendors: total,
        totalOutstanding: Number(totalOutstanding._sum.outstandingBalance) || 0,
        totalSettled: Number(totalSettled._sum.amount) || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, email, address } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      )
    }

    const existing = await prisma.vendor.findUnique({
      where: { phone },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A vendor with this phone number already exists" },
        { status: 409 }
      )
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
      },
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    console.error("Error creating vendor:", error)
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    )
  }
}
