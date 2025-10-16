"use client"

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react"

const ItemsContext = createContext({
    ready: false,
    loading: false,
    error: null,
    items: [],
    byId: new Map(),
    categories: [],
    etag: null,
    updatedAt: null,
    refresh: () => {},
})

/**
 * Cache payload + ETag di localStorage
 * - pb_items_all: string JSON payload {items:[], total:...}
 * - pb_items_etag: string ETag dari server
 * - pb_items_updatedAt: ISO time saat cache disimpan
 */
const LS_PAYLOAD = "pb_items_all"
const LS_ETAG = "pb_items_etag"
const LS_UPDATED = "pb_items_updatedAt"

export default function ItemsProvider({ children }) {
    const [state, setState] = useState({
        ready: false,
        loading: true,
        error: null,
        items: [],
        byId: new Map(),
        categories: [],
        etag: null,
        updatedAt: null,
    })
    const fetching = useRef(false)

    const buildDerived = useCallback((items) => {
        const byId = new Map(items.map((it) => [it.id, it]))
        const categories = Array.from(
            new Set(items.map((it) => it.kategori).filter(Boolean)),
        ).sort((a, b) => String(a).localeCompare(String(b), "id"))
        return { byId, categories }
    }, [])

    const loadFromCache = useCallback(() => {
        try {
            const raw = localStorage.getItem(LS_PAYLOAD)
            if (!raw) return null
            const parsed = JSON.parse(raw)
            const items = Array.isArray(parsed?.items) ? parsed.items : []
            const etag = localStorage.getItem(LS_ETAG)
            const updatedAt = localStorage.getItem(LS_UPDATED)
            const { byId, categories } = buildDerived(items)
            setState((s) => ({
                ...s,
                items,
                byId,
                categories,
                etag,
                updatedAt,
                ready: true,
                loading: false,
                error: null,
            }))
            return { items, etag }
        } catch {
            return null
        }
    }, [buildDerived])

    const fetchAll = useCallback(async (opts = {}) => {
        if (fetching.current) return
        fetching.current = true
        setState((s) => ({ ...s, loading: true, error: null }))

        try {
            // pilih kolom sesuai skema terbaru
            const fields = [
                "id",
                "kodeItem",
                "namaItem",
                "deskripsi",
                "kategori",
                "jenisItem",
                "harga",
                "satuan",
                "nilaiSatuan",
                "nilaiKonversi",
                "satuanKonversi",
                "nilaiPenggunaan",
                "satuanPenggunaan",
                "deskripsiPenggunaan",
                "gambarUrl",
                "linkWeb",
                "diubahTanggal",
                "dibuatTanggal",
            ].join(",")

            const headers = {}
            const cachedEtag = localStorage.getItem(LS_ETAG)
            if (cachedEtag) headers["If-None-Match"] = cachedEtag

            const res = await fetch(`/api/items/all?fields=${fields}`, {
                cache: "no-store",
                headers,
                signal: opts.signal,
            })

            // 304: pakai cache apa adanya
            if (res.status === 304) {
                setState((s) => ({ ...s, loading: false, ready: true }))
                fetching.current = false
                return
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`)

            const json = await res.json()
            const items = Array.isArray(json?.items) ? json.items : []
            const etag = res.headers.get("etag") || null

            // simpan cache
            localStorage.setItem(LS_PAYLOAD, JSON.stringify({ items, total: items.length }))
            if (etag) localStorage.setItem(LS_ETAG, etag)
            const nowIso = new Date().toISOString()
            localStorage.setItem(LS_UPDATED, nowIso)

            const { byId, categories } = buildDerived(items)
            setState({
                ready: true,
                loading: false,
                error: null,
                items,
                byId,
                categories,
                etag,
                updatedAt: nowIso,
            })
        } catch (e) {
            console.error("ItemsProvider fetch error:", e)
            setState((s) => ({ ...s, loading: false, ready: true, error: e?.message || "Error" }))
        } finally {
            fetching.current = false
        }
    }, [buildDerived])

    // on mount: coba cache dulu, lalu sync ke server
    useEffect(() => {
        const controller = new AbortController()
        loadFromCache()
        fetchAll({ signal: controller.signal })
        return () => controller.abort()
    }, [loadFromCache, fetchAll])

    const value = useMemo(
        () => ({
            ...state,
            refresh: fetchAll,
        }),
        [state, fetchAll],
    )

    return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>
}

export { ItemsContext }
