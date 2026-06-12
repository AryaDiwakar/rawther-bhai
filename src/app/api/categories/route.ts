import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    })
    return Response.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return Response.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
