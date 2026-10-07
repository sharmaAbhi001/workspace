import axios from "axios"

import type { ApiErrorBody } from "./types"

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback
  }

  const data = error.response?.data as ApiErrorBody | undefined
  if (data?.message) return data.message

  if (data?.errors) {
    const first = Object.values(data.errors).flat().find(Boolean)
    if (first) return first
  }

  return error.message || fallback
}
