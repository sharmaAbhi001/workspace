export type ApiSuccess<T> = {
  statusCode: number
  success: boolean
  messages: string
  data: T
}

export type ApiErrorBody = {
  success: false
  message: string
  errors?: Record<string, string[] | undefined> | null
}
