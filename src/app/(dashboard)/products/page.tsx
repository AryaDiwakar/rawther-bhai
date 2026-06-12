import { prisma } from "@/lib/db/prisma"
import { ProductsClient } from "./products-client"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  return <ProductsClient categories={categories} />
}
