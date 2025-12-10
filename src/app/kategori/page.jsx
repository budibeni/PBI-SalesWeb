"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Search as SearchIcon, RefreshCcw } from "lucide-react"
import NumericInput from "@/components/ui/NumericInput"

// ✅ import form dari file terpisah
import Form from "./form"

// ===== Utility =====
const api = async (url, init) => {
    const res = await fetch(url, init)
    const j = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(j.error || "Request gagal")
    return j
}

const fmtPct = (v) =>
    v != null && !Number.isNaN(v) ? `${(v * 100).toFixed(2)}%` : "—"

const fmtDateTime = (v) => {
    if (!v) return "—"
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return "—"
    return d.toLocaleString("id-ID")
}

// ===== Halaman Utama =====
export default function KomisiPage() {
    const [q, setQ] = useState("")
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({ items: [], total: 0, totalPages: 1 })

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const p = new URLSearchParams()
            if (q.trim()) p.set("q", q.trim())
            p.set("page", String(page))
            p.set("pageSize", "25") // page size tetap, tidak perlu state terpisah

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
    }, [q, page])

    useEffect(() => {
        load()
    }, [load])

    const items = data.items
    const totalPages = data.totalPages

    return (
        <div className="">
            <Card className="mx-auto max-w-7xl ">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Kiri: Judul + tombol Tambah */}
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base sm:text-lg font-semibold">
                            Atur Komisi per Kategori
                        </CardTitle>
                        <span className="hidden sm:inline-block text-xs text-muted-foreground">
                            {loading
                                ? "Memuat…"
                                : `Total ${items.length} • Hal ${page}/${totalPages}`}
                        </span>
                    </div>

                    {/* Kanan: form create + search + refresh (responsif) */}
                    <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                        {/* Tombol Tambah di mobile: full width, di desktop: kecil & rapat */}
                        <div className="w-full sm:w-auto">
                            <Form mode="create" onDone={load} />
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Input
                                    placeholder="Cari kategori…"
                                    value={q}
                                    onChange={(e) => {
                                        setQ(e.target.value)
                                        setPage(1)
                                    }}
                                    className="pr-9"
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <SearchIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={load}
                                className="flex items-center gap-1"
                                title="Refresh"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                        </div>

                        {/* Info total (tampil di mobile) */}
                        <span className="block sm:hidden text-[11px] text-muted-foreground text-right">
                            {loading
                                ? "Memuat…"
                                : `Total ${items.length} • Hal ${page}/${totalPages}`}
                        </span>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* ===== MOBILE: LIST CARD ===== */}
                    <div className="space-y-3 sm:hidden">
                        {items.map((r) => (
                            <Card key={r.id} className="border">
                                <CardContent className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="font-semibold text-sm uppercase">
                                                {r.kategori}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                Customer: <b>{r.customer}</b>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Form mode="edit" initial={r} onDone={load} />
                                            <DeleteDialog id={r.id} onDone={load} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div className="space-y-0.5">
                                            <div className="font-medium text-xs text-muted-foreground">Persentase Item</div>
                                            <div>{fmtPct(r.persentase)}</div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="font-medium text-xs text-muted-foreground">Komisi Dasar</div>
                                            <div>Min Ach: {fmtPct(r.minAchKomisiDasar)}</div>
                                        </div>

                                        <div className="space-y-0.5">
                                            <div className="font-medium text-xs text-muted-foreground">Bonus Utama</div>
                                            <div>Min Ach: {fmtPct(r.minAchBonusUtama)}</div>
                                            <div>Value: {fmtPct(r.valueBonusUtama)}</div>
                                        </div>

                                        <div className="space-y-0.5">
                                            <div className="font-medium text-xs text-muted-foreground">Bonus Extra</div>
                                            <div>Min Ach: {fmtPct(r.minAchBonusExtra)}</div>
                                            <div>Value: {fmtPct(r.valueBonusExtra)}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {items.length === 0 && !loading && (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                                Tidak ada data
                            </div>
                        )}
                    </div>

                    {/* ===== DESKTOP: TABLE ===== */}
                    <Card className="hidden sm:block p-0.5">
                        <CardContent className="p-0 ">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Customer</TableHead>
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
                                            <TableCell className="font-medium">
                                                {r.kategori}
                                            </TableCell>
                                            <TableCell>{r.customer}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs">
                                                    <span>Min Ach : {fmtPct(r.minAchKomisiDasar)}</span>
                                                    <span>Value : {fmtPct(r.persentase)}</span>
                                                </div>
                                            </TableCell>
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
                                                    <span>{fmtDateTime(r.dibuatTanggal)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs text-muted-foreground">
                                                    <span>{r.diubahOleh ?? "—"}</span>
                                                    <span>{fmtDateTime(r.diubahTanggal)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Form mode="edit" initial={r} onDone={load} />
                                                    <DeleteDialog id={r.id} onDone={load} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                Tidak ada data
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex justify-between gap-2 sm:justify-start">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || loading}
                            >
                                ‹ Prev
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                            >
                                Next ›
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground text-center sm:text-right">
                            Halaman {page} dari {totalPages}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
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
        } finally {
            setBusy(false)
        }
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
                    <AlertDialogAction onClick={del} disabled={busy}>
                        Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// ===== Field Wrapper (masih dipakai kalau mau, tapi form utama sekarang di file lain) =====
function Field({ label, children, keterangan = "" }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">{label}</label>
            {children}
            {keterangan && (
                <p className="text-xs text-muted-foreground">{keterangan}</p>
            )}
        </div>
    )
}
