"use client"

import { useRouter } from "next/navigation"

export class HttpError extends Error {
    constructor(message, status, data) {
        super(message)
        this.name = "HttpError"
        this.status = status
        this.data = data
    }
}

/**
 * Hook untuk call API dengan:
 * - body object otomatis di-JSON-kan (kecuali FormData)
 * - ambil cookies (same-origin)
 * - auto-redirect ke /login saat 401 (bisa dimatikan)
 */
export function useApiAuth(options = {}) {
    const router = useRouter()
    const redirectOn401 = options.redirectOn401 ?? true

    return async function apiAuth(input, init = {}) {
        const { body, headers, ...rest } = init
        const h = new Headers(headers || {})
        const req = { ...rest, headers: h, credentials: "same-origin" }

        // JSONify body otomatis (kecuali FormData/Blob/string)
        if (body instanceof FormData || body instanceof Blob || typeof body === "string") {
            req.body = body
        } else if (body && typeof body === "object") {
            h.set("Content-Type", "application/json")
            req.body = JSON.stringify(body)
        }

        const res = await fetch(input, req)

        // coba parse JSON aman
        let data = null
        const text = await res.text()
        if (text) {
            try { data = JSON.parse(text) } catch { data = text }
        }

        if (!res.ok) {
            const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`
            const err = new HttpError(msg, res.status, data)

            if (res.status === 401 && redirectOn401) {
                const next = encodeURIComponent(window.location.pathname + window.location.search)
                window.location.replace(`/login?redirect=${next}&error=Sesi%20berakhir`)
                return
            }
            throw err
        }

        return data
    }
}
