"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, ChevronLeft, ChevronRight, LogIn, Shuffle, Clock } from "lucide-react"

// ========= Utils =========
const todayStr = () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD

function fmtDate(s) {
    try { return new Date(s).toLocaleDateString() } catch { return s }
}

function makeSnippet(text, q, size = 170) {
    const t = String(text || "")
    const qq = String(q || "").trim()
    if (!qq) return t.slice(0, size) + (t.length > size ? "…" : "")
    const idx = t.toLowerCase().indexOf(qq.toLowerCase())
    if (idx === -1) return t.slice(0, size) + (t.length > size ? "…" : "")
    const pad = Math.max(Math.floor(size / 3), 30)
    const start = Math.max(0, idx - pad)
    const end = Math.min(t.length, idx + qq.length + (size - (idx - start)))
    let snip = (start > 0 ? "…" : "") + t.slice(start, end) + (end < t.length ? "…" : "")
    const re = new RegExp(`(${qq.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})`, "ig")
    return snip.replace(re, "<mark>$1</mark>")
}

// ========= Local cache =========
const LS_PREFIX = "articles::"
const LS_TTL_MS = 60 * 60 * 1000 // 1 jam
function cacheKey({ q, page, pageSize, sort, seed }) {
    return `${LS_PREFIX}${(q || "").trim()}::${page}::${pageSize}::${sort || "random"}::${seed || ""}`
}
function cacheGet(key) {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        const { data, exp } = JSON.parse(raw)
        if (exp && Date.now() > exp) return null
        return data
    } catch { return null }
}
function cacheSet(key, data, ttlMs = LS_TTL_MS) {
    try { localStorage.setItem(key, JSON.stringify({ data, exp: Date.now() + ttlMs })) } catch {}
}

export default function PublishedArticlesSearch() {
    const router = useRouter()
    const sp = useSearchParams()

    // URL state
    const urlQ = sp.get("q") || ""
    const urlPage = Math.max(1, Number(sp.get("page") || 1))
    const pageSize = 10

    // Sort & seed dari URL (default: random + seed=today)
    const urlSort = (sp.get("sort") || "random").toLowerCase() // "random" | "newest"
    const urlSeed = sp.get("seed") || (urlSort === "random" ? todayStr() : "")

    // Input cari sinkron dgn URL
    const [q, setQ] = useState(urlQ)
    useEffect(() => { setQ(urlQ) }, [urlQ])

    // Data artikel
    const [rows, setRows] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(urlPage)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)

    // Info login
    const [me, setMe] = useState(undefined)
    useEffect(() => {
        let ignore = false
        ;(async () => {
            try {
                const res = await fetch("/api/me", { cache: "no-cache" })
                if (!ignore) setMe(res.ok ? await res.json() : null)
            } catch { if (!ignore) setMe(null) }
        })()
        return () => { ignore = true }
    }, [])

    // Pastikan URL punya default sort/seed saat pertama mount
    useEffect(() => {
        const hasSort = !!sp.get("sort")
        const needsSeed = ((sp.get("sort") || "random").toLowerCase() === "random") && !sp.get("seed")
        if (!hasSort || needsSeed) {
            const params = new URLSearchParams(sp.toString())
            if (!hasSort) params.set("sort", "random")
            if ((params.get("sort") || "random").toLowerCase() === "random" && !params.get("seed")) {
                params.set("seed", todayStr())
            }
            router.replace(`/artikel/terbit?${params.toString()}`)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Fetcher
    async function fetchData(keyword, pageNum, sort, seed) {
        const key = cacheKey({ q: keyword, page: pageNum, pageSize, sort, seed })
        const cached = typeof window !== "undefined" ? cacheGet(key) : null

        if (cached) {
            setRows(cached.articles || [])
            setTotal(cached.total ?? 0)
            setPage(cached.page ?? pageNum)
            setTotalPages(cached.totalPages ?? 1)

            // refresh diam-diam (fire-and-forget) — tandai dengan `void` agar ESLint tidak protes
            void (async () => {
                try {
                    const p = new URLSearchParams()
                    if (keyword.trim()) p.set("q", keyword.trim())
                    p.set("page", String(pageNum))
                    p.set("pageSize", String(pageSize))
                    if (sort) p.set("sort", sort)
                    if (seed && sort === "random") p.set("seed", seed)

                    const res = await fetch(`/api/public/articles?${p}`, { next: { revalidate: 3600 } })
                    if (res.ok) {
                        const data = await res.json()
                        cacheSet(key, data)
                        // (opsional) jika ingin auto-update UI ketika refresh selesai:
                        // setRows(data?.articles || [])
                        // setTotal(data?.total ?? 0)
                        // setPage(data?.page ?? pageNum)
                        // setTotalPages(data?.totalPages ?? 1)
                    }
                } catch {
                    // sengaja diabaikan (silent refresh)
                }
            })()

            return
        }


        setLoading(true)
        try {
            const p = new URLSearchParams()
            if (keyword.trim()) p.set("q", keyword.trim())
            p.set("page", String(pageNum))
            p.set("pageSize", String(pageSize))
            if (sort) p.set("sort", sort)
            if (seed && sort === "random") p.set("seed", seed)

            const res = await fetch(`/api/public/articles?${p}`, { next: { revalidate: 3600 } })
            const data = await res.json()
            setRows(data?.articles || [])
            setTotal(data?.total ?? 0)
            setPage(data?.page ?? pageNum)
            setTotalPages(data?.totalPages ?? 1)
            cacheSet(key, data)
        } catch {
            setRows([]); setTotal(0); setTotalPages(1)
        } finally {
            setLoading(false)
        }
    }

    // Load saat URL berubah
    useEffect(() => {
        fetchData(urlQ, urlPage, urlSort, urlSeed)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlQ, urlPage, urlSort, urlSeed])

    // Ganti sort via URL + reset page=1. Random selalu set seed=today.
    const switchSort = (sort) => {
        const params = new URLSearchParams(sp.toString())
        params.set("sort", sort)
        params.set("page", "1")
        if (sort === "random") params.set("seed", todayStr())
        else params.delete("seed")
        router.replace(`/artikel/terbit?${params.toString()}`)
    }

    // Toggle satu tombol (Acak <-> Terbaru)
    const toggleSort = () => {
        switchSort(urlSort === "random" ? "newest" : "random")
    }

    // Redirect back untuk tombol login
    const redirectParams = useMemo(() => {
        const p = new URLSearchParams()
        if (urlQ.trim()) p.set("q", urlQ.trim())
        p.set("page", String(urlPage))
        p.set("sort", urlSort)
        if (urlSort === "random") p.set("seed", urlSeed)
        return p
    }, [urlQ, urlPage, urlSort, urlSeed])
    const redirectBack = `/artikel/terbit?${redirectParams.toString()}`
    const loginHref = `/login?redirect=${encodeURIComponent(redirectBack)}`

    return (
        <div className="min-h-dvh bg-background">
            {/* Brand bar + tombol Masuk (jika belum login) */}
            {me === null && (
                <div className="bg-background">
                    <div className="mx-auto max-w-3xl px-4 pt-6">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-left">
                                <div className="text-sm font-semibold leading-tight">Sales Go</div>
                                <div className="text-xs text-muted-foreground">PT Power Block Indonesia</div>
                            </div>
                            <Button asChild variant="ghost">
                                <Link href={loginHref} prefetch={false} aria-label="Masuk">
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Masuk
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header: Input + tombol cari */}
            <header className="bg-background">
                <div className="mx-auto max-w-3xl px-4 py-4">
                    <div className="flex items-center gap-3">
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const params = new URLSearchParams()
                            if (q.trim()) params.set("q", q.trim())
                            params.set("page", "1")
                            params.set("sort", urlSort) // pertahankan mode saat ini
                            if (urlSort === "random") params.set("seed", todayStr())
                            router.replace(`/artikel/terbit?${params.toString()}`)
                        }} className="flex-1">
                            <div className="relative">
                                <Input
                                    className="h-10 pr-12"
                                    placeholder="Cari…"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    variant="secondary"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md"
                                    aria-label="Cari artikel"
                                    title="Cari"
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </header>

            {/* Body */}
            <main className="mx-auto max-w-3xl px-4 pb-1">
                {/* ====== STATUS BAR dengan tombol toggle di kanan ====== */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        {loading
                            ? "Memuat…"
                            : `Menampilkan ${rows.length} dari ${total} hasil • Halaman ${page}/${totalPages} • Artikel ${urlSort === "random" ? `Acak` : "Terbaru"}`}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSort}
                        aria-pressed={urlSort === "random"}
                        aria-label={urlSort === "random" ? "Ubah ke Terbaru" : "Ubah ke Acak"}
                        title={urlSort === "random" ? "Urutkan: Terbaru" : "Urutkan: Acak (berubah tiap hari)"}
                        className="ml-3"
                    >
                        {urlSort === "random" ? (
                            <Clock className="h-4 w-4" />
                        ) : (
                            <Shuffle className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                <div className="space-y-6">
                    {rows.map((r) => (
                        <div key={r.id} className="group">
                            <Link
                                href={`/baca/${r.id}?q=${encodeURIComponent(urlQ)}&page=${page}`}
                                className="text-lg text-blue-600 hover:underline"
                            >
                                {r.judul}
                            </Link>
                            <div className="text-xs text-muted-foreground mt-1">
                                {`/baca/${r.id}`} · {fmtDate(r.dibuatTanggal)}
                            </div>

                            <div
                                className="text-sm mt-1 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: makeSnippet(r.artikel, urlQ) }}
                            />
                        </div>
                    ))}

                    {!loading && rows.length === 0 && (
                        <Card>
                            <CardContent className="p-6 text-sm text-muted-foreground">
                                Tidak ada hasil yang cocok.
                            </CardContent>
                        </Card>
                    )}

                    {/* Pager */}
                    <div className="mt-6">
                        {/* Mobile */}
                        <div className="grid grid-cols-3 items-center sm:hidden">
                            <div className="justify-self-start">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        const p = Math.max(1, page - 1)
                                        const params = new URLSearchParams()
                                        if (urlQ.trim()) params.set("q", urlQ.trim())
                                        params.set("page", String(p))
                                        params.set("sort", urlSort)
                                        if (urlSort === "random") params.set("seed", urlSeed)
                                        router.replace(`/artikel/terbit?${params.toString()}`)
                                    }}
                                    disabled={page <= 1 || loading}
                                    aria-label="Sebelumnya"
                                    title="Sebelumnya"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="text-center text-xs text-muted-foreground">
                                Hal {page}/{totalPages}
                            </div>

                            <div className="justify-self-end">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        const p = Math.min(totalPages, page + 1)
                                        const params = new URLSearchParams()
                                        if (urlQ.trim()) params.set("q", urlQ.trim())
                                        params.set("page", String(p))
                                        params.set("sort", urlSort)
                                        if (urlSort === "random") params.set("seed", urlSeed)
                                        router.replace(`/artikel/terbit?${params.toString()}`)
                                    }}
                                    disabled={page >= totalPages || loading}
                                    aria-label="Selanjutnya"
                                    title="Selanjutnya"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Desktop */}
                        <div className="hidden sm:flex items-center justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const p = Math.max(1, page - 1)
                                    const params = new URLSearchParams()
                                    if (urlQ.trim()) params.set("q", urlQ.trim())
                                    params.set("page", String(p))
                                    params.set("sort", urlSort)
                                    if (urlSort === "random") params.set("seed", urlSeed)
                                    router.replace(`/artikel/terbit?${params.toString()}`)
                                }}
                                disabled={page <= 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
                            </Button>

                            <div className="text-xs text-muted-foreground">
                                Halaman {page} dari {totalPages}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const p = Math.min(totalPages, page + 1)
                                    const params = new URLSearchParams()
                                    if (urlQ.trim()) params.set("q", urlQ.trim())
                                    params.set("page", String(p))
                                    params.set("sort", urlSort)
                                    if (urlSort === "random") params.set("seed", urlSeed)
                                    router.replace(`/artikel/terbit?${params.toString()}`)
                                }}
                                disabled={page >= totalPages || loading}
                            >
                                Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
