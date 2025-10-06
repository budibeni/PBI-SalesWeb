// app/items/page.js
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search as SearchIcon, Trash2, MoreHorizontal, Pencil, Calculator, SlidersHorizontal } from "lucide-react"

const CAT_ALL = "__ALL__"

export default function ItemsPage() {
    const sp = useSearchParams()
    const router = useRouter()

    const urlQ = sp.get("q") || ""
    const urlPage = Math.max(1, Number(sp.get("page") || 1))
    const urlCat = sp.get("cat") || ""

    const [q, setQ] = useState(urlQ)
    const [cat, setCat] = useState(urlCat || CAT_ALL)
    const [cats, setCats] = useState([])

    const [data, setData] = useState({ items: [], total: 0, page: urlPage, totalPages: 1 })
    const [loading, setLoading] = useState(false)

    // selection (untuk bulk)
    const [selected, setSelected] = useState(() => new Set())
    const allIds = useMemo(() => data.items.map((it) => it.id), [data.items])
    const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id))
    const someChecked = allIds.some((id) => selected.has(id)) && !allChecked

    function toggleOne(id, checked) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (checked) next.add(id); else next.delete(id)
            return next
        })
    }
    function toggleAll(checked) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (checked) { allIds.forEach((id) => next.add(id)) }
            else { allIds.forEach((id) => next.delete(id)) }
            return next
        })
    }

    // sync state saat URL berubah
    useEffect(() => {
        setQ(urlQ)
        setCat(urlCat || CAT_ALL)
    }, [urlQ, urlCat])

    // load daftar kategori (sekali)
    useEffect(() => {
        let ignore = false
        ;(async () => {
            try {
                const res = await fetch("/api/items/categories", { cache: "no-store" })
                const j = await res.json()
                if (!ignore && Array.isArray(j.categories)) setCats(j.categories)
            } catch {}
        })()
        return () => { ignore = true }
    }, [])

    async function load() {
        setLoading(true)
        try {
            const p = new URLSearchParams()
            if (urlQ.trim()) p.set("q", urlQ.trim())
            if (urlCat.trim()) p.set("cat", urlCat.trim())
            p.set("page", String(urlPage))
            p.set("pageSize", "10")
            const res = await fetch(`/api/items?${p}`, { cache: "no-store" })
            const json = await res.json()
            setData(json)
            // buang selection item yg tidak ada di halaman ini
            setSelected((prev) => new Set([...prev].filter((id) => json.items.some((x) => x.id === id))))
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { load() }, [urlQ, urlPage, urlCat]) // eslint-disable-line react-hooks/exhaustive-deps

    // helper apply param ke URL
    function pushParams(nextQ, nextCat, page = 1) {
        const p = new URLSearchParams()
        const qq = String(nextQ || "").trim()
        const cc = nextCat === CAT_ALL ? "" : String(nextCat || "").trim()
        if (qq) p.set("q", qq)
        if (cc) p.set("cat", cc)
        p.set("page", String(page))
        router.replace(`/items?${p.toString()}`)
    }

    function submit(e) {
        e.preventDefault()
        pushParams(q, cat, 1)
    }
    const go = (p) => {
        pushParams(urlQ, cat, p) // pakai cat dari state agar konsisten
    }
    function onChangeCategory(val) {
        setCat(val)
        pushParams(q, val, 1) // langsung refresh ketika kategori berubah
    }

    return (
        <div className="p-4">
            <Card className="mx-auto max-w-6xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xl">Master Item</CardTitle>
                    <div className="flex items-center gap-2">
                        <BulkCalcDialog
                            disabled={selected.size === 0}
                            count={selected.size}
                            ids={[...selected]}
                            onDone={async () => { await load() }}
                        />
                        <Button asChild>
                            <Link href="/items/new"><Plus className="mr-2 h-4 w-4" />Tambah</Link>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Search + Kategori */}
                    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <div className="relative w-full sm:w-80">
                            <Input
                                placeholder="Cari kode / nama / kategori / merek"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="pr-10"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                variant="ghost"
                                className="absolute right-0 top-0 h-full"
                                aria-label="Cari"
                                title="Cari"
                            >
                                <SearchIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        <Select value={cat} onValueChange={onChangeCategory}>
                            <SelectTrigger className="w-full sm:w-56">
                                <SelectValue placeholder="Kategori (semua)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={CAT_ALL}>(Semua Kategori)</SelectItem>
                                {cats.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* tombol submit tetap untuk mobile (kalau mau submit manual setelah isi search) */}
                        <Button type="submit" className="sm:hidden">Terapkan</Button>
                    </form>

                    <div className="text-xs text-muted-foreground">
                        {loading
                            ? "Memuat…"
                            : `Menampilkan ${data.items.length} dari ${data.total} • Hal ${data.page}/${data.totalPages}${urlCat ? ` • Kategori: ${urlCat}` : ""} • Terpilih ${selected.size}`}
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <div className="flex items-center">
                                            <Checkbox
                                                checked={allChecked || (someChecked ? "indeterminate" : false)}
                                                onCheckedChange={(v) => toggleAll(Boolean(v))}
                                                aria-label="Pilih semua di halaman ini"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-32">Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead className="w-24">Satuan</TableHead>
                                    <TableHead className="w-52">Konversi</TableHead>
                                    <TableHead className="w-56">Cakupan</TableHead>
                                    <TableHead className="w-20 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.map((it) => (
                                    <TableRow key={it.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selected.has(it.id)}
                                                onCheckedChange={(v) => toggleOne(it.id, Boolean(v))}
                                                aria-label={`Pilih ${it.kodeItem}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{it.kodeItem}</TableCell>
                                        <TableCell>{it.namaItem}</TableCell>
                                        <TableCell>{it.satuan}</TableCell>
                                        <TableCell>
                                            {it.faktorKonversi
                                                ? `1 ${it.satuan} = ${it.faktorKonversi} ${it.satuanKonversi || "-"}` : "—"}
                                        </TableCell>
                                        <TableCell>
                                            {it.nilaiCakupan
                                                ? `1 ${it.satuan} = ${it.nilaiCakupan} ${it.satuanCakupan || "?"}` : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/items/${it.id}/edit`} className="flex items-center gap-2">
                                                                <Pencil className="h-4 w-4" /> Edit Umum
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/items/${it.id}/calc`} className="flex items-center gap-2">
                                                                <Calculator className="h-4 w-4" /> Edit Kalkulator
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <DeleteDialog id={it.id} onDeleted={load} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {data.items.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() => go(Math.max(1, data.page - 1))}
                            disabled={data.page <= 1 || loading}
                        >
                            ‹ Prev
                        </Button>
                        <div className="text-sm text-muted-foreground">Hal {data.page} / {data.totalPages}</div>
                        <Button
                            variant="outline"
                            onClick={() => go(Math.min(data.totalPages, data.page + 1))}
                            disabled={data.page >= data.totalPages || loading}
                        >
                            Next ›
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function DeleteDialog({ id, onDeleted }) {
    const [busy, setBusy] = useState(false)
    async function del() {
        setBusy(true)
        try {
            const res = await fetch(`/api/items/${id}`, { method: "DELETE" })
            if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                alert(j.error || "Gagal hapus")
            } else {
                onDeleted?.()
            }
        } finally { setBusy(false) }
    }
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={busy}>
                    <Trash2 className="mr-2 h-4 w-4" />Hapus
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus item?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak bisa dibatalkan. Item akan dihapus permanen.
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

function BulkCalcDialog({ disabled, ids, count, onDone }) {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [f, setF] = useState({
        // isi hanya yang mau diubah; kosong = diabaikan
        satuan: "",
        satuanKonversi: "",
        faktorKonversi: "",
        nilaiCakupan: "",
        satuanCakupan: "",
        jenisCakupan: "",
    })
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

    async function submit(e) {
        e?.preventDefault?.()
        setBusy(true)
        try {
            const payload = {
                ids,
                // kirim apa adanya; API hanya apply field yang tidak kosong
                ...f,
            }
            const res = await fetch("/api/items/bulk", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const j = await res.json().catch(() => ({}))
            if (!res.ok) {
                alert(j.error || "Bulk update gagal")
                return
            }
            setOpen(false)
            onDone?.()
            // reset form biar bersih kalau buka lagi
            setF({ satuan: "", satuanKonversi: "", faktorKonversi: "", nilaiCakupan: "", satuanCakupan: "", jenisCakupan: "" })
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
            <DialogTrigger asChild>
                <Button variant="secondary" disabled={disabled} title="Edit nilai kalkulator untuk banyak item">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Edit Kalkulator (Bulk){count ? ` • ${count}` : ""}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Edit Kalkulator</DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                        Menerapkan perubahan ke <b>{count}</b> item terpilih. Field yang dikosongkan akan <b>diabaikan</b>.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-sm">Satuan (base)</label>
                            <Input value={f.satuan} onChange={(e)=>set("satuan", e.target.value)} placeholder="cth: M3" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm">Satuan Konversi</label>
                            <Input value={f.satuanKonversi} onChange={(e)=>set("satuanKonversi", e.target.value)} placeholder="cth: PCS" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm">Faktor Konversi</label>
                            <Input type="number" step="any" value={f.faktorKonversi} onChange={(e)=>set("faktorKonversi", e.target.value)} placeholder="cth: 111" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-sm">Nilai Cakupan</label>
                            <Input type="number" step="any" value={f.nilaiCakupan} onChange={(e)=>set("nilaiCakupan", e.target.value)} placeholder="cth: 13" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm">Satuan Cakupan</label>
                            <Input value={f.satuanCakupan} onChange={(e)=>set("satuanCakupan", e.target.value)} placeholder="cth: M2" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm">Jenis Cakupan</label>
                            <Input value={f.jenisCakupan} onChange={(e)=>set("jenisCakupan", e.target.value)} placeholder="cth: Luas Dinding (m²)" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={()=>setOpen(false)} disabled={busy}>Batal</Button>
                        <Button type="submit" disabled={busy}>Terapkan</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
