"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, ChevronLeft, ChevronRight, LogIn } from "lucide-react"

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

export default function PublishedArticlesSearch() {
    const router = useRouter()
    const sp = useSearchParams()

    // URL state
    const urlQ = sp.get("q") || ""
    const urlPage = Math.max(1, Number(sp.get("page") || 1))
    const pageSize = 10

    // Input state sinkron dgn URL
    const [q, setQ] = useState(urlQ)
    useEffect(() => { setQ(urlQ) }, [urlQ])

    // Data artikel
    const [rows, setRows] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(urlPage)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)

    // Info login (null = belum login, object = sudah, undefined = loading)
    const [me, setMe] = useState(undefined)
    useEffect(() => {
        let ignore = false
        ;(async () => {
            try {
                const res = await fetch("/api/me", { cache: "no-store" })
                if (!ignore) setMe(res.ok ? await res.json() : null)
            } catch {
                if (!ignore) setMe(null)
            }
        })()
        return () => { ignore = true }
    }, [])

    async function fetchData(keyword, pageNum) {
        setLoading(true)
        try {
            const p = new URLSearchParams()
            if (keyword.trim()) p.set("q", keyword.trim())
            p.set("page", String(pageNum))
            p.set("pageSize", String(pageSize))
            const res = await fetch(`/api/public/articles?${p}`, { cache: "no-store" })
            const data = await res.json()
            setRows(data?.articles || [])
            setTotal(data?.total ?? 0)
            setPage(data?.page ?? pageNum)
            setTotalPages(data?.totalPages ?? 1)
        } catch {
            setRows([]); setTotal(0); setTotalPages(1)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData(urlQ, urlPage) }, [urlQ, urlPage])

    const onSubmit = (e) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (q.trim()) params.set("q", q.trim())
        params.set("page", "1")
        router.replace(`/artikel/terbit?${params.toString()}`)
    }

    const goPage = (p) => {
        const params = new URLSearchParams()
        if (urlQ.trim()) params.set("q", urlQ.trim())
        params.set("page", String(p))
        router.replace(`/artikel/terbit?${params.toString()}`)
    }

    // Redirect untuk tombol login (balik lagi ke halaman ini)
    const redirectParams = new URLSearchParams()
    if (urlQ.trim()) redirectParams.set("q", urlQ.trim())
    redirectParams.set("page", String(urlPage))
    const redirectBack = `/artikel/terbit?${redirectParams.toString()}`
    const loginHref = `/login?redirect=${encodeURIComponent(redirectBack)}`

    return (
        <div className="min-h-dvh bg-background">
            {/* Brand bar di atas header (tombol Masuk di kanan) */}
            {me === null && (
                <div className="bg-background">
                    <div className="mx-auto max-w-3xl px-4 pt-6">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-left">
                                <div className="text-sm font-semibold leading-tight">Sales Go</div>
                                <div className="text-xs text-muted-foreground">PT Power Block Indonesia</div>
                            </div>

                            {/* Tombol Masuk pindah ke sini */}
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

            {/* Header (input + tombol cari di dalam input) */}
            <header className="bg-background">
                <div className="mx-auto max-w-3xl px-4 py-4">
                    <div className="flex items-center gap-3">
                        <form onSubmit={onSubmit} className="flex-1">
                            <div className="relative">
                                <Input
                                    className="h-10 pr-12"
                                    placeholder="Cari…"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                                <Button
                                    type="submit"
                                    onClick={onSubmit}
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

                        {/* ⬇️ HAPUS blok tombol Masuk di header supaya tidak dobel */}
                        {/* (tidak ada apa-apa di sini) */}
                    </div>
                </div>
            </header>





            {/* Body */}
            <main className="mx-auto max-w-3xl px-4 py-6">
                <div className="text-xs text-muted-foreground mb-4">
                    {loading ? "Memuat…" : `Menampilkan ${rows.length} dari ${total} hasil • Halaman ${page}/${totalPages}`}
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

                    {/* Pager (responsif) */}
                    <div className="mt-6">
                        {/* Mobile: grid 3 kolom, ikon saja */}
                        <div className="grid grid-cols-3 items-center sm:hidden">
                            <div className="justify-self-start">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => goPage(Math.max(1, page - 1))}
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
                                    onClick={() => goPage(Math.min(totalPages, page + 1))}
                                    disabled={page >= totalPages || loading}
                                    aria-label="Selanjutnya"
                                    title="Selanjutnya"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* ≥sm: tombol berteks + indikator di tengah/kanan */}
                        <div className="hidden sm:flex items-center justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goPage(Math.max(1, page - 1))}
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
                                onClick={() => goPage(Math.min(totalPages, page + 1))}
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
