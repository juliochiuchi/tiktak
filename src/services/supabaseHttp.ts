import axios from "axios"

import { startLoading, stopLoading } from "@/stores/loadingStore"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseHttp = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  },
})

supabaseHttp.interceptors.request.use(
  (config) => {
    startLoading()
    return config
  },
  (error) => {
    stopLoading()
    return Promise.reject(error)
  }
)

supabaseHttp.interceptors.response.use(
  (response) => {
    stopLoading()
    return response
  },
  (error) => {
    stopLoading()
    return Promise.reject(error)
  }
)
