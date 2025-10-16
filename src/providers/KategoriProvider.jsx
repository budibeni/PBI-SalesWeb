"use client"

import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react"


const LS_PAYLOAD = "kategori_all_payload"
const LS_ETAG    = "kategori_all_etag"
const LS_AT      = "kategori_all_updated_at"

export const KategoriContext = createContext({
    ready: false,
    loading: false,
    error: null,
    items: [],
    byId: new Map(),
    etag: null,
    updatedAt: null,
    refresh: () => {},
})

export default function KategoriProvider({ children }) {
    const [state, setState] = useState({
        ready: false,
        loading: true,
        error: null,
        items: [],
        byId: new Map(),
        etag: null,
        updatedAt: null,
    })
    const fetching = useRef(false)

    const derive = useCallback((items) => {
        const byId = new Map(items.map(r => [r.id, r]))
        return { byId }
    }, [])

    // 1) coba baca cache dulu biar instan
    const loadFromCache = useCallback(() => {
        try {
            const raw = localStorage.getItem(LS_PAYLOAD)
            if (!raw) return false
            const parsed = JSON.parse(raw)
            const items = Array.isArray(parsed?.items) ? parsed.items : []
            const etag = localStorage.getItem(LS_ETAG)
            const updatedAt = localStorage.getItem(LS_AT)
            const { byId } = derive(items)
            setState(s => ({
                ...s, items, byId, etag, updatedAt, ready: true, loading: false, error: null,
            }))
            return true
        } catch {
            return false
        }
    }, [derive])

    // 2) sync ke server sekali (kalau belum pernah atau untuk cek 304 via ETag)
    const fetchAll = useCallback(async () => {
        if (fetching.current) return
        fetching.current = true
        setState(s => ({ ...s, loading: true, error: null }))

        try {
            const headers = {}
            const cachedEtag = localStorage.getItem(LS_ETAG)
            if (cachedEtag) headers["If-None-Match"] = cachedEtag

            const res = await fetch("/api/kategori/all", { cache: "no-store", headers })

            if (res.status === 304) {
                // data sama persis — biarkan state dari cache
                setState(s => ({ ...s, loading: false, ready: true }))
                return
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`)

            const json = await res.json()
            const items = Array.isArray(json?.items) ? json.items : []
            const etag = res.headers.get("etag") || null
            const updatedAt = new Date().toISOString()

            // cache
            localStorage.setItem(LS_PAYLOAD, JSON.stringify({ items, total: items.length }))
            if (etag) localStorage.setItem(LS_ETAG, etag)
            localStorage.setItem(LS_AT, updatedAt)

            const { byId } = derive(items)
            setState({
                ready: true,
                loading: false,
                error: null,
                items, byId, etag, updatedAt,
            })
        } catch (e) {
            console.error("KategoriProvider fetch error:", e)
            setState(s => ({ ...s, loading: false, ready: true, error: e?.message || "Error" }))
        } finally {
            fetching.current = false
        }
    }, [derive])

    useEffect(() => {
        const had = loadFromCache()
        // panggil server sekali — jika sama akan 304 jadi hemat
        fetchAll()
    }, [loadFromCache, fetchAll])

    const value = useMemo(() => ({
        ...state,
        refresh: fetchAll, // panggil ini setelah create/update/delete
    }), [state, fetchAll])

    return <KategoriContext.Provider value={value}>{children}</KategoriContext.Provider>
}

// helper hook
export function useKategori() {
    const ctx = React.useContext?.(KategoriContext)
    return ctx
}
