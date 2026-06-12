import { prisma } from "@/lib/db/prisma"
import { NewProductForm } from "./new-product-form"

export const dynamic = "force-dynamic"

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-6">
      <NewProductForm categories={categories} />
    </div>
  )
}
