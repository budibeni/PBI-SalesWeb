// lib/api.js
class HttpError extends Error {
    constructor(message, { status, data } = {}) {
        super(message)
        this.name = "HttpError"
        this.status = status
        this.data = data
    }
}

/**
 * api(path, { method, body, headers, timeoutMs, cache, next })
 * - Selalu kirim/terima JSON (kalau ada body)
 * - Timeout via AbortController (default 15s)
 * - Lempar HttpError saat !res.ok, dengan .status & .data
 */
export async function api(
    path,
    { method = "GET", body, headers, timeoutMs = 15000, cache = "no-store", next } = {}
) {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(new Error("Request timeout")), timeoutMs)

    try {
        const res = await fetch(path, {
            method,
            headers: {
                ...(body ? { "Content-Type": "application/json" } : {}),
                ...headers,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: ctrl.signal,
            cache,
            next, // opsional untuk App Router (tag/revalidate, dsb.)
        })

        let data = null
        try { data = await res.json() } catch { data = null }

        if (!res.ok) {
            const msg = data?.error || `HTTP ${res.status}`
            throw new HttpError(msg, { status: res.status, data })
        }

        return data
    } finally {
        clearTimeout(to)
    }
}

// Shortcut opsional
export const get   = (path, opts) => api(path, { ...opts, method: "GET" })
export const post  = (path, opts) => api(path, { ...opts, method: "POST" })
export const patch = (path, opts) => api(path, { ...opts, method: "PATCH" })
export const del   = (path, opts) => api(path, { ...opts, method: "DELETE" })
