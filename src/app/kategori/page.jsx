"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, RefreshCw, Search as SearchIcon } from "lucide-react"

const PAGE_SIZES = ["10", "25", "50", "100"]

export default function KomisiPage() {
    const [q, setQ] = useState("")
    const [size, setSize] = useState(PAGE_SIZES[0])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({ items: [], total: 0, totalPages: 1 })

    async function load() {
        setLoading(true)
        try {
            const p = new URLSearchParams()
            if (q.trim()) p.set("q", q.trim())
            p.set("page", String(page))
            p.set("pageSize", String(size))
            const res = await fetch(`/api/kategori?${p.toString()}`, { cache: "no-store" })
            const j = await res.json()
            setData({
                items: Array.isArray(j?.items) ? j.items : [],
                total: Number(j?.total ?? 0),
                totalPages: Number(j?.totalPages ?? 1),
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [q, page, size]) // eslint-disable-line react-hooks/exhaustive-deps

    const items = data.items
    const totalPages = data.totalPages

    return (
        <div className="p-4">
            <Card className="mx-auto max-w-4xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Master Komisi</CardTitle>
                    <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {loading ? "Memuat…" : `Total ${items.length} • Hal ${page}/${totalPages}`}
            </span>
                        <Button variant="outline" size="sm" onClick={() => load()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                        <CreateDialog onDone={load} />
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Filter */}
                    <form
                        onSubmit={(e) => { e.preventDefault(); setPage(1); load() }}
                        className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
                    >
                        <div className="relative w-full sm:w-80">
                            <Input
                                placeholder="Cari kategori…"
                                value={q}
                                onChange={(e) => { setQ(e.target.value); setPage(1) }}
                                className="pr-10"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                variant="ghost"
                                className="absolute right-0 top-0 h-full"
                                title="Cari"
                            >
                                <SearchIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        <select
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={size}
                            onChange={(e) => { setSize(e.target.value); setPage(1) }}
                        >
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}/hal</option>)}
                        </select>
                    </form>

                    {/* Tabel */}
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-56">Kategori</TableHead>
                                    <TableHead className="w-40">Persentase</TableHead>
                                    <TableHead className="w-40">Dibuat</TableHead>
                                    <TableHead className="w-40">Diubah</TableHead>
                                    <TableHead className="w-28 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium">{row.kategori}</TableCell>
                                        <TableCell>
                                            {row.persentase != null ? `${(row.persentase * 100).toFixed(2)}%` : "—"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {row.dibuatTanggal ? new Date(row.dibuatTanggal).toLocaleString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {row.diubahTanggal ? new Date(row.diubahTanggal).toLocaleString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <EditDialog row={row} onDone={load} />
                                                <DeleteDialog id={row.id} onDone={load} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {items.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                        >
                            ‹ Prev
                        </Button>
                        <div className="text-sm text-muted-foreground">Hal {page} / {totalPages}</div>
                        <Button
                            variant="outline"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                        >
                            Next ›
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

/* ===== Dialog: Create ===== */
function CreateDialog({ onDone }) {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [f, setF] = useState({ kategori: "", persentase: "" })

    const submit = async (e) => {
        e.preventDefault()
        if (!f.kategori.trim()) { alert("Kategori wajib diisi"); return }
        setBusy(true)
        try {
            const res = await fetch("/api/kategori", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(f),
            })
            const j = await res.json().catch(() => ({}))
            if (!res.ok) { alert(j.error || "Gagal tambah"); return }
            setOpen(false)
            setF({ kategori: "", persentase: "" })
            onDone?.()
        } finally { setBusy(false) }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Tambah</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Tambah Komisi</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Kategori *">
                        <Input value={f.kategori} onChange={(e)=>setF(s=>({...s, kategori: e.target.value}))} placeholder="BLOCK / SLAB / BOND / SHIELD" />
                    </Field>
                    <Field label="Persentase (desimal)">
                        <Input type="number" step="any" value={f.persentase} onChange={(e)=>setF(s=>({...s, persentase: e.target.value}))} placeholder="cth: 0.004 = 0.4%" />
                    </Field>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={()=>setOpen(false)} disabled={busy}>Batal</Button>
                        <Button type="submit" disabled={busy}>Simpan</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

/* ===== Dialog: Edit ===== */
function EditDialog({ row, onDone }) {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [f, setF] = useState({ kategori: row.kategori, persentase: row.persentase ?? "" })

    useEffect(() => {
        if (open) setF({ kategori: row.kategori, persentase: row.persentase ?? "" })
    }, [open, row])

    const submit = async (e) => {
        e.preventDefault()
        if (!f.kategori.trim()) { alert("Kategori wajib diisi"); return }
        setBusy(true)
        try {
            const res = await fetch(`/api/kategori/${row.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(f),
            })
            const j = await res.json().catch(() => ({}))
            if (!res.ok) { alert(j.error || "Gagal update"); return }
            setOpen(false)
            onDone?.()
        } finally { setBusy(false) }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Pencil className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Komisi</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Kategori *">
                        <Input value={f.kategori} onChange={(e)=>setF(s=>({...s, kategori: e.target.value}))} />
                    </Field>
                    <Field label="Persentase (desimal)">
                        <Input type="number" step="any" value={f.persentase} onChange={(e)=>setF(s=>({...s, persentase: e.target.value}))} />
                    </Field>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={()=>setOpen(false)} disabled={busy}>Batal</Button>
                        <Button type="submit" disabled={busy}>Simpan</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

/* ===== Dialog: Delete ===== */
function DeleteDialog({ id, onDone }) {
    const [busy, setBusy] = useState(false)

    const del = async () => {
        setBusy(true)
        try {
            const res = await fetch(`/api/kategori/${id}`, { method: "DELETE" })
            const j = await res.json().catch(() => ({}))
            if (!res.ok) { alert(j.error || "Gagal hapus"); return }
            onDone?.()
        } finally { setBusy(false) }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={busy}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus data komisi?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={del} disabled={busy}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

/* ===== Mini Field wrapper ===== */
function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm">{label}</label>
            {children}
        </div>
    )
}
