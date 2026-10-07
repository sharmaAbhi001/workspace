import axios from "axios"

import { attachAuthInterceptors } from "@/shared/api/interceptors"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
})

attachAuthInterceptors(api)
