"use client"

import { useEffect, useState, useCallback } from "react"
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
import NumericInput from "@/components/ui/NumericInput"

const PAGE_SIZES = ["10", "25", "50", "100"]

// ===== Utility =====
const api = async (url, init) => {
    const res = await fetch(url, init)
    const j = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(j.error || "Request gagal")
    return j
}
const numToStr = (v) => (v == null || Number.isNaN(v) ? "" : String(v))
const toNullNum = (s) => (s === "" || s == null ? null : Number(s))
const fmtPct = (v) => (v != null && !Number.isNaN(v) ? `${(v * 100).toFixed(2)}%` : "—")

// ===== Halaman Utama =====
export default function KomisiPage() {
    const [q, setQ] = useState("")
    const [size, setSize] = useState(PAGE_SIZES[0])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({ items: [], total: 0, totalPages: 1 })

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const p = new URLSearchParams()
            if (q.trim()) p.set("q", q.trim())
            p.set("page", String(page))
            p.set("pageSize", String(size))
            const j = await api(`/api/kategori?${p.toString()}`, { cache: "no-store" })
            setData({
                items: Array.isArray(j?.items) ? j.items : [],
                total: Number(j?.total ?? 0),
                totalPages: Number(j?.totalPages ?? 1),
            })
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }, [q, page, size])

    useEffect(() => { load() }, [load])

    const items = data.items
    const totalPages = data.totalPages

    return (
        <div className="p-4">
            <Card className="mx-auto max-w-7xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Master Kategori Komisi</CardTitle>
                    <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {loading ? "Memuat…" : `Total ${items.length} • Hal ${page}/${totalPages}`}
            </span>
                        <Button variant="outline" size="sm" onClick={load}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                        <KomisiForm mode="create" onDone={load} />
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

                    {/* Table */}
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Persentase</TableHead>
                                    <TableHead>Komisi Dasar</TableHead>
                                    <TableHead>Bonus Utama</TableHead>
                                    <TableHead>Bonus Extra</TableHead>
                                    <TableHead>Dibuat</TableHead>
                                    <TableHead>Diubah</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-medium">{r.kategori}</TableCell>
                                        <TableCell>{fmtPct(r.persentase)}</TableCell>
                                        <TableCell>{fmtPct(r.minAchKomisiDasar)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                <span>Min Ach : {fmtPct(r.minAchBonusUtama)}</span>
                                                <span>Value : {fmtPct(r.valueBonusUtama)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                <span>Min Ach : {fmtPct(r.minAchBonusExtra)}</span>
                                                <span>Value : {fmtPct(r.valueBonusExtra)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                <span>{r.dibuatOleh ?? "—"}</span>
                                                <span>{`${new Date(r.dibuatTanggal).toLocaleString("id-ID")}`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                <span>{r.diubahOleh ?? "—"}</span>
                                                <span>{`${new Date(r.diubahTanggal).toLocaleString("id-ID")}`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <KomisiForm mode="edit" initial={r} onDone={load} />
                                                <DeleteDialog id={r.id} onDone={load} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {items.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
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
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                        >
                            ‹ Prev
                        </Button>
                        <div className="text-sm text-muted-foreground">Hal {page} / {totalPages}</div>
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

// ===== KomisiForm (Create/Edit) =====
function KomisiForm({ mode = "create", initial = {}, onDone }) {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)

    const seed = (r) => ({
        kategori: r.kategori ?? "",
        persentase: numToStr(r.persentase),
        minAchKomisiDasar: numToStr(r.minAchKomisiDasar),
        minAchBonusUtama: numToStr(r.minAchBonusUtama),
        valueBonusUtama: numToStr(r.valueBonusUtama),
        minAchBonusExtra: numToStr(r.minAchBonusExtra),
        valueBonusExtra: numToStr(r.valueBonusExtra),
    })

    const [f, setF] = useState(() => seed(initial))

    useEffect(() => {
        if (open) setF(seed(initial))
    }, [open, initial?.id])

    const submit = async (e) => {
        e.preventDefault()
        if (!f.kategori.trim()) return alert("Kategori wajib diisi")

        setBusy(true)
        try {
            const payload = {
                kategori: f.kategori,
                persentase: toNullNum(f.persentase),
                minAchKomisiDasar: toNullNum(f.minAchKomisiDasar),
                minAchBonusUtama: toNullNum(f.minAchBonusUtama),
                valueBonusUtama: toNullNum(f.valueBonusUtama),
                minAchBonusExtra: toNullNum(f.minAchBonusExtra),
                valueBonusExtra: toNullNum(f.valueBonusExtra),
            }

            const url = mode === "create" ? "/api/kategori" : `/api/kategori/${initial.id}`
            const method = mode === "create" ? "POST" : "PATCH"
            await api(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            alert("Tersimpan ✔︎")
            setOpen(false)
            onDone?.()
        } catch (err) {
            alert("Gagal menyimpan: " + err.message)
        } finally {
            setBusy(false)
        }
    }

    const title = mode === "create" ? "Tambah Komisi" : "Edit Komisi"

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button><Plus className="h-4 w-4 mr-2" /> Tambah</Button>
                ) : (
                    <Button size="sm" variant="outline"><Pencil className="h-4 w-4" /></Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-h-[85dvh] overflow-y-auto">
                <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Kategori *">
                        <Input
                            autoFocus
                            value={f.kategori}
                            onChange={(e) => setF(s => ({ ...s, kategori: e.target.value }))}
                            placeholder="BLOCK / SLAB / BOND / SHIELD"
                        />
                    </Field>

                    <label className="text-xs text-muted-foreground">
                        Isi data dibawah ini dalam bentuk desimal. Misal 10% = 0.10
                    </label>


                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            ["persentase", "Komisi Kategori Item", "Formula : (harga - hpp) * qty * value"],
                            ["minAchKomisiDasar", "Min Ach Komisi Dasar", "Min Achievement"],
                            ["minAchBonusUtama", "Min Ach Bonus Utama", "Min Achievement"],
                            ["valueBonusUtama", "Value Bonus Utama","Formula : Komisi Dasar * value"],
                            ["minAchBonusExtra", "Min Ach Bonus Extra", "Min Achievement"],
                            ["valueBonusExtra", "Value Bonus Extra","Formula : (Achievement * Komisi Dasar * value) - (Komisi Dasar + Bonus Utama)"],
                        ].map(([key, label, ket]) => (
                            <Field key={key} label={label} keterangan={ket}>
                                <NumericInput
                                    value={f[key]}
                                    onValue={(v) => setF(s => ({ ...s, [key]: v }))}
                                    decimalScale={8}
                                    fixedDecimalScale={false}
                                    allowNegative={false}
                                    className="w-full"
                                />
                            </Field>
                        ))}
                    </div>



                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
                        <Button type="submit" disabled={busy}>Simpan</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ===== Delete Dialog =====
function DeleteDialog({ id, onDone }) {
    const [busy, setBusy] = useState(false)
    const del = async () => {
        setBusy(true)
        try {
            await api(`/api/kategori/${id}`, { method: "DELETE" })
            onDone?.()
        } catch (err) {
            alert("Gagal hapus: " + err.message)
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

// ===== Field Wrapper =====
function Field({ label, children, keterangan="" }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm">{label}</label>
            {children}
            <label className="text-xs text-muted-foreground">{keterangan}</label>
        </div>
    )
}
