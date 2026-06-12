import { NextResponse } from "next/server"

export function apiSuccess(data: unknown, message = "Success") {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status: 200 }
  )
}

export function apiError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  )
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    return apiError(error.message, 500)
  }
  return apiError("An unexpected error occurred", 500)
}
