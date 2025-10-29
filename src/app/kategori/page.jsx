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

// ✅ gunakan path sesuai file yang kamu kirimkan
import NumericInput from "@/components/ui/NumericInput"

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
            <Card className="mx-auto max-w-6xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Master Kategori Komisi</CardTitle>
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
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / halaman</option>)}
                        </select>
                    </form>

                    {/* Tabel */}
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-56">Kategori</TableHead>
                                    <TableHead className="w-40">Persentase</TableHead>
                                    <TableHead className="w-40">Min Ach Bonus Utama</TableHead>
                                    <TableHead className="w-40">Min Ach Bonus Extra</TableHead>
                                    <TableHead className="w-40">Dibuat Oleh</TableHead>
                                    <TableHead className="w-40">Diubah Tanggal</TableHead>
                                    <TableHead className="w-40">Dibuat Oleh</TableHead>
                                    <TableHead className="w-40">Diubah Tanggal</TableHead>
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
                                        <TableCell>
                                            {row.minAchBonusUtama != null ? `${row.minAchBonusUtama.toFixed(2)}%` : "—"}
                                        </TableCell>
                                        <TableCell>
                                            {row.minAchBonusExtra != null ? `${row.minAchBonusExtra.toFixed(2)}%` : "—"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{row.dibuatOleh}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {row.dibuatTanggal ? new Date(row.dibuatTanggal).toLocaleString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{row.diubahOleh}</TableCell>
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
    // simpan sebagai string untuk kontrol NumericInput
    const [f, setF] = useState({ kategori: "", persentase: "", minAchBonusUtama: "", minAchBonusExtra: "" })

    const submit = async (e) => {
        e.preventDefault()
        if (!f.kategori.trim()) { alert("Kategori wajib diisi"); return }
        setBusy(true)
        try {
            const payload = {
                kategori: f.kategori,
                persentase: f.persentase === "" || f.persentase == null ? null : Number(f.persentase),
                minAchBonusUtama: f.minAchBonusUtama === "" || f.minAchBonusUtama == null ? null : Number(f.minAchBonusUtama),
                minAchBonusExtra: f.minAchBonusExtra === "" || f.minAchBonusExtra == null ? null : Number(f.minAchBonusExtra),
            }
            const res = await fetch("/api/kategori", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const j = await res.json().catch(() => ({}))
            if (!res.ok) { alert(j.error || "Gagal tambah"); return }
            setOpen(false)
            setF({ kategori: "", persentase: "", minAchBonusUtama: "", minAchBonusExtra: "" })
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
                        <Input
                            value={f.kategori}
                            onChange={(e) => setF(s => ({ ...s, kategori: e.target.value }))}
                            placeholder="BLOCK / SLAB / BOND / SHIELD"
                        />
                    </Field>

                    <Field label="Persentase (desimal)">
                        <NumericInput
                            value={f.persentase}
                            onValue={(val) => setF((s) => ({ ...s, persentase: val }))}
                            decimalScale={8}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            placeholder="cth: 0.004 = 0.4%"
                            className="w-full"
                        />
                    </Field>

                    <Field label="Min Ach Bonus Utama (%)">
                        <NumericInput
                            value={f.minAchBonusUtama}
                            onValue={(val) => setF((s) => ({ ...s, minAchBonusUtama: val }))}
                            decimalScale={8}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            placeholder="cth: 70"
                            className="w-full"
                        />
                    </Field>

                    <Field label="Min Ach Bonus Extra (%)">
                        <NumericInput
                            value={f.minAchBonusExtra}
                            onValue={(val) => setF((s) => ({ ...s, minAchBonusExtra: val }))}
                            decimalScale={8}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            placeholder="cth: 110"
                            className="w-full"
                        />
                    </Field>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
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

    // helper: number -> string untuk kontrol NumericInput
    const numToStr = (v) => (v == null || Number.isNaN(v) ? "" : String(v))

    // simpan sebagai string
    const [f, setF] = useState({
        kategori: row.kategori,
        persentase: numToStr(row.persentase),
        minAchBonusUtama: numToStr(row.minAchBonusUtama),
        minAchBonusExtra: numToStr(row.minAchBonusExtra),
    })

    useEffect(() => {
        if (open) {
            setF({
                kategori: row.kategori,
                persentase: numToStr(row.persentase),
                minAchBonusUtama: numToStr(row.minAchBonusUtama),
                minAchBonusExtra: numToStr(row.minAchBonusExtra),
            })
        }
    }, [open, row])

    const submit = async (e) => {
        e.preventDefault()
        if (!f.kategori.trim()) { alert("Kategori wajib diisi"); return }
        setBusy(true)
        try {
            const payload = {
                kategori: f.kategori,
                persentase: f.persentase === "" || f.persentase == null ? null : Number(f.persentase),
                minAchBonusUtama: f.minAchBonusUtama === "" || f.minAchBonusUtama == null ? null : Number(f.minAchBonusUtama),
                minAchBonusExtra: f.minAchBonusExtra === "" || f.minAchBonusExtra == null ? null : Number(f.minAchBonusExtra),
            }
            const res = await fetch(`/api/kategori/${row.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
                        <Input
                            value={f.kategori}
                            onChange={(e) => setF(s => ({ ...s, kategori: e.target.value }))}
                        />
                    </Field>

                    <Field label="Persentase (desimal)">
                        <NumericInput
                            value={f.persentase}
                            onValue={(val) => setF((s) => ({ ...s, persentase: val }))}
                            decimalScale={6}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            placeholder="cth: 0.004 = 0.4%"
                            className="w-full"
                        />
                    </Field>

                    <Field label="Min Ach Bonus Utama (%)">
                        <NumericInput
                            value={f.minAchBonusUtama}
                            onValue={(val) => setF((s) => ({ ...s, minAchBonusUtama: val }))}
                            decimalScale={8}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            placeholder="cth: 70"
                            className="w-full"
                        />
                    </Field>

                    <Field label="Min Ach Bonus Extra (%)">
                        <NumericInput
                            value={f.minAchBonusExtra}
                            onValue={(val) => setF((s) => ({ ...s, minAchBonusExtra: val }))}
                            decimalScale={8}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            placeholder="cth: 110"
                            className="w-full"
                        />
                    </Field>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
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
