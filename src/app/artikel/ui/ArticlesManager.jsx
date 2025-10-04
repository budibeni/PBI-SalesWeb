"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useApiAuth } from "@/lib/client-api"
import { Edit3, Plus, Search, X } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

function fmtDate(s) {
    try { return new Date(s).toLocaleString() } catch { return s }
}
function snippet(t, n=160) {
    const s = String(t || "")
    return s.length > n ? s.slice(0, n) + "…" : s
}

export default function ArticlesManager({ initialArticles }) {
    const apiAuth = useApiAuth()
    const [rows, setRows] = useState(initialArticles || [])
    const [total, setTotal] = useState(initialArticles?.length || 0)
    const [err, setErr] = useState("")

    // === SEARCH STATE ===
    const [query, setQuery] = useState("")
    const [terbitFilter, setTerbitFilter] = useState("all") // all|true|false
    const qs = useMemo(() => {
        const p = new URLSearchParams()
        if (query.trim()) p.set("q", query.trim())
        if (terbitFilter === "true")  p.set("terbit", "true")
        if (terbitFilter === "false") p.set("terbit", "false")
        return p.toString()
    }, [query, terbitFilter])

    const refreshList = async () => {
        const url = qs ? `/api/articles?${qs}` : "/api/articles"
        const list = await apiAuth(url)
        setRows(list?.articles || [])
        setTotal(list?.total ?? 0)
    }

    // debounce pencarian saat user mengetik
    useEffect(() => {
        const t = setTimeout(() => { refreshList().catch(()=>{}) }, 400)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qs])

    // === CREATE ===
    const [openNew, setOpenNew] = useState(false)
    const [f, setF] = useState({ judul: "", artikel: "", terbit: false })
    const [creating, setCreating] = useState(false)

    const submitNew = async (e) => {
        e.preventDefault()
        setCreating(true); setErr("")
        try {
            await apiAuth("/api/articles", { method: "POST", body: f })
            await refreshList()
            setOpenNew(false)
            setF({ judul: "", artikel: "", terbit: false })
        } catch (e) {
            setErr(e.message || "Gagal menyimpan")
        } finally {
            setCreating(false)
        }
    }

    // === EDIT ===
    const [openEdit, setOpenEdit] = useState(null)
    const [eF, setEF] = useState({ judul: "", artikel: "", terbit: false })
    const [updating, setUpdating] = useState(false)

    const openEditFor = (id) => {
        const r = rows.find(x => x.id === id)
        if (!r) return
        setEF({ judul: r.judul || "", artikel: r.artikel || "", terbit: !!r.terbit })
        setOpenEdit(id)
    }

    const submitEdit = async () => {
        if (!openEdit) return
        setUpdating(true); setErr("")
        try {
            await apiAuth(`/api/articles/${openEdit}`, { method: "PATCH", body: eF })
            await refreshList()
            setOpenEdit(null)
        } catch (e) {
            setErr(e.message || "Gagal menyimpan perubahan")
        } finally {
            setUpdating(false)
        }
    }

    const clearSearch = () => {
        setQuery("")
        setTerbitFilter("all")
    }

    return (
        <div className="space-y-4">
            {/* Header + aksi tambah */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h1 className="text-xl font-semibold">Artikel</h1>
                <div className="flex items-center gap-2">
                    <Dialog open={openNew} onOpenChange={setOpenNew}>
                        <DialogTrigger asChild>
                            <Button><Plus className="h-4 w-4 mr-2" /> Artikel Baru</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl"> {/* dialog lebar */}
                            <DialogHeader><DialogTitle>Tambah Artikel</DialogTitle></DialogHeader>

                            {err && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
                            )}

                            <form className="grid gap-4" onSubmit={submitNew}>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="judul">Judul</Label>
                                    <Input id="judul" value={f.judul} onChange={e=>setF(s=>({...s, judul:e.target.value}))} required />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="artikel">Isi Artikel</Label>
                                    <Textarea
                                        id="artikel"
                                        rows={22}
                                        className="min-h-[60vh] resize-y"
                                        value={f.artikel}
                                        onChange={(e)=>setF(s=>({...s, artikel:e.target.value}))}
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch id="terbit" checked={f.terbit} onCheckedChange={(v)=>setF(s=>({...s, terbit:v}))} />
                                    <Label htmlFor="terbit">Terbit</Label>
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                    <Button type="button" variant="ghost" onClick={()=>setOpenNew(false)}>Batal</Button>
                                    <Button type="submit" disabled={creating}>{creating ? "Menyimpan..." : "Simpan"}</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Bar Pencarian */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                            <Input
                                placeholder="Cari judul atau isi artikel…"
                                className="pl-8"
                                value={query}
                                onChange={(e)=>setQuery(e.target.value)}
                                onKeyDown={(e)=>{ if (e.key === "Enter") { e.preventDefault(); refreshList() } }}
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                    aria-label="Clear"
                                    title="Bersihkan"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="w-full md:w-48">
                            <Select value={terbitFilter} onValueChange={setTerbitFilter}>
                                <SelectTrigger><SelectValue placeholder="Terbit" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="true">Terbit</SelectItem>
                                    <SelectItem value="false">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={clearSearch}>Reset</Button>
                            <Button onClick={refreshList}><Search className="h-4 w-4 mr-2" />Cari</Button>
                        </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                        Menampilkan {rows.length} dari {total} artikel
                    </div>
                </CardContent>
            </Card>

            {/* Tabel daftar */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Artikel</CardTitle>
                </CardHeader>
                <CardContent>
                    {rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Tidak ada artikel.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-muted-foreground">
                                <tr className="[&>th]:py-2 [&>th]:px-2">
                                    <th>Judul</th>
                                    <th className="hidden md:table-cell">Ringkasan</th>
                                    <th>Terbit</th>
                                    <th className="hidden md:table-cell">Dibuat</th>
                                    <th className="hidden md:table-cell">Diubah</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody className="divide-y">
                                {rows.map(r => (
                                    <tr key={r.id} className="[&>td]:py-2 [&>td]:px-2 align-top">
                                        <td className="font-medium">{r.judul}</td>
                                        <td className="hidden md:table-cell text-muted-foreground">{snippet(r.artikel, 160)}</td>
                                        <td>{r.terbit ? "Ya" : "Tidak"}</td>
                                        <td className="hidden md:table-cell">
                                            <div className="text-xs">{fmtDate(r.dibuatTanggal)}</div>
                                            <div className="text-[11px] text-muted-foreground">{r.dibuatOleh || "-"}</div>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <div className="text-xs">{fmtDate(r.diubahTanggal)}</div>
                                            <div className="text-[11px] text-muted-foreground">{r.diubahOleh || "-"}</div>
                                        </td>
                                        <td className="text-right">
                                            <Dialog open={openEdit === r.id} onOpenChange={(v)=> v ? openEditFor(r.id) : setOpenEdit(null)}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline"><Edit3 className="h-4 w-4 mr-2" />Edit</Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl"> {/* dialog lebar */}
                                                    <DialogHeader><DialogTitle>Edit Artikel</DialogTitle></DialogHeader>

                                                    {err && (
                                                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
                                                    )}

                                                    <div className="grid gap-4">
                                                        <div className="grid gap-1.5">
                                                            <Label htmlFor="e-judul">Judul</Label>
                                                            <Input id="e-judul" value={eF.judul} onChange={e=>setEF(s=>({...s, judul:e.target.value}))} />
                                                        </div>
                                                        <div className="grid gap-1.5">
                                                            <Label htmlFor="e-artikel">Isi Artikel</Label>
                                                            <Textarea
                                                                id="e-artikel"
                                                                rows={22}
                                                                className="min-h-[60vh] resize-y"
                                                                value={eF.artikel}
                                                                onChange={(e)=>setEF(s=>({...s, artikel:e.target.value}))}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Switch id="e-terbit" checked={eF.terbit} onCheckedChange={(v)=>setEF(s=>({...s, terbit:v}))} />
                                                            <Label htmlFor="e-terbit">Terbit</Label>
                                                        </div>

                                                        <div className="flex gap-2 justify-end pt-2">
                                                            <Button type="button" variant="ghost" onClick={()=>setOpenEdit(null)}>Batal</Button>
                                                            <Button onClick={submitEdit} disabled={updating}>{updating ? "Menyimpan..." : "Simpan"}</Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
