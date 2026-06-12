import { auth } from "@/lib/auth/auth"
import type { Role } from "@/types"

export type { Role }

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireRole(...roles: Role[]) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  if (!roles.includes(user.role as Role)) {
    throw new Error("Forbidden")
  }

  return user
}
