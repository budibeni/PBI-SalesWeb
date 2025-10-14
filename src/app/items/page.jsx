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
import {
    Plus, Search as SearchIcon, Trash2, MoreHorizontal, Pencil, Calculator,
    Image as ImageIcon, Link as LinkIcon,
} from "lucide-react"

const CAT_ALL = "__ALL__"
const PAGE_SIZES = ["10","25","50","100","500","1000"]

export default function ItemsPage() {
    const sp = useSearchParams()
    const router = useRouter()

    const urlQ = sp.get("q") || ""
    const urlPage = Math.max(1, Number(sp.get("page") || 1))
    const urlCat = sp.get("cat") || ""
    const urlSize = sp.get("size") || PAGE_SIZES[0]

    const [q, setQ] = useState(urlQ)
    const [cat, setCat] = useState(urlCat || CAT_ALL)
    const [size, setSize] = useState(urlSize)
    const [cats, setCats] = useState([])

    const [data, setData] = useState({ items: [], total: 0, page: urlPage, totalPages: 1 })
    const [loading, setLoading] = useState(false)

    const items = Array.isArray(data?.items) ? data.items : []
    const total = Number(data?.total ?? 0)
    const page = Number(data?.page ?? 1)
    const totalPages = Number(data?.totalPages ?? 1)

    const [selected, setSelected] = useState(() => new Set())
    const allIds = useMemo(() => items.map((it) => it.id), [items])
    const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id))
    const someChecked = allIds.some((id) => selected.has(id)) && !allChecked

    const toggleOne = (id, checked) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (checked) next.add(id); else next.delete(id)
            return next
        })
    }
    const toggleAll = (checked) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (checked) allIds.forEach((id) => next.add(id))
            else allIds.forEach((id) => next.delete(id))
            return next
        })
    }

    useEffect(() => {
        setQ(urlQ)
        setCat(urlCat || CAT_ALL)
        setSize(urlSize || PAGE_SIZES[0])
    }, [urlQ, urlCat, urlSize])

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
            p.set("pageSize", String(urlSize))
            const res = await fetch(`/api/items?${p}`, { cache: "no-store" })
            const json = await res.json()
            setData({
                items: Array.isArray(json?.items) ? json.items : [],
                total: Number(json?.total ?? 0),
                page: Number(json?.page ?? 1),
                totalPages: Number(json?.totalPages ?? 1),
            })
            setSelected((prev) => new Set(
                [...prev].filter((id) => Array.isArray(json?.items) && json.items.some((x) => x.id === id))
            ))
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { load() }, [urlQ, urlPage, urlCat, urlSize]) // eslint-disable-line react-hooks/exhaustive-deps

    function pushParams(nextQ, nextCat, nextSize, nextPage = 1) {
        const p = new URLSearchParams()
        const qq = String(nextQ || "").trim()
        const cc = nextCat === CAT_ALL ? "" : String(nextCat || "").trim()
        const ss = PAGE_SIZES.includes(String(nextSize)) ? String(nextSize) : PAGE_SIZES[0]
        if (qq) p.set("q", qq)
        if (cc) p.set("cat", cc)
        p.set("size", ss)
        p.set("page", String(nextPage))
        router.replace(`/items?${p.toString()}`)
    }
    function submit(e) {
        e.preventDefault()
        pushParams(q, cat, size, 1)
    }
    const go = (p) => { pushParams(urlQ, cat, size, p) }
    function onChangeCategory(val) {
        setCat(val)
        pushParams(q, val, size, 1)
    }
    function onChangeSize(val) {
        setSize(val)
        pushParams(q, cat, val, 1)
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
                    {/* Search + Kategori + PageSize */}
                    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <div className="relative w-full sm:w-80">
                            <Input
                                placeholder="Cari kode / nama / kategori / jenis"
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

                        <Select value={size} onValueChange={onChangeSize}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Per halaman" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZES.map((s) => (
                                    <SelectItem key={s} value={s}>{s} / halaman</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button type="submit" className="sm:hidden">Terapkan</Button>
                    </form>

                    {/* Summary */}
                    <div className="text-xs text-muted-foreground">
                        {loading
                            ? "Memuat…"
                            : `Menampilkan ${items.length} dari ${total} • Hal ${page}/${totalPages}${urlCat ? ` • Kategori: ${urlCat}` : ""} • ${size}/hal • Terpilih ${selected.size}`}
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
                                    <TableHead className="w-40">Kategori / Jenis</TableHead>
                                    <TableHead className="w-24">Satuan</TableHead>
                                    <TableHead className="w-52">Konversi</TableHead>
                                    <TableHead className="w-56">Penggunaan</TableHead>
                                    <TableHead className="w-40">Media</TableHead>{/* <- baru */}
                                    <TableHead className="w-24 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((it) => (
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
                                        <TableCell>
                                            <div className="text-xs leading-tight">
                                                <div><span className="text-muted-foreground">Kategori:</span> {it.kategori || "—"}</div>
                                                <div><span className="text-muted-foreground">Jenis:</span> {it.jenisItem || "—"}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {it.nilaiSatuan ? `${it.nilaiSatuan} ${it.satuan}` : it.satuan}
                                        </TableCell>
                                        <TableCell>
                                            {it.nilaiKonversi
                                                ? `1 item = ${it.nilaiKonversi} ${it.satuanKonversi || "-"}` : "—"}
                                        </TableCell>
                                        <TableCell title={it.deskripsiPenggunaan || ""}>
                                            {it.nilaiPenggunaan
                                                ? `1 item (${it.nilaiSatuan ?? 1} ${it.satuan}) → ${it.nilaiPenggunaan} ${it.satuanPenggunaan || "?"}` : "—"}
                                        </TableCell>

                                        {/* === Media column === */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {/* Thumbnail */}
                                                {it.gambarUrl ? (
                                                    <img
                                                        src={it.gambarUrl}
                                                        alt={it.namaItem}
                                                        className="h-9 w-9 rounded-md object-cover border"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="h-9 w-9 rounded-md border flex items-center justify-center text-muted-foreground">
                                                        <ImageIcon className="h-4 w-4" />
                                                    </div>
                                                )}

                                                {/* Link web */}
                                                {it.linkWeb ? (
                                                    <Button asChild size="sm" variant="ghost" className="px-2">
                                                        <a href={it.linkWeb} target="_blank" rel="noopener noreferrer" title="Buka halaman produk">
                              <span className="inline-flex items-center gap-1">
                                <LinkIcon className="h-4 w-4" />
                                <span className="text-xs">Buka link</span>
                              </span>
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
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
                                {items.length === 0 && !loading && (
                                    <TableRow>
                                        {/* total kolom sekarang 9 */}
                                        <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
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
                            onClick={() => go(Math.max(1, page - 1))}
                            disabled={page <= 1 || loading}
                        >
                            ‹ Prev
                        </Button>
                        <div className="text-sm text-muted-foreground">Hal {page} / {totalPages}</div>
                        <Button
                            variant="outline"
                            onClick={() => go(Math.min(totalPages, page + 1))}
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
                <Button size="sm" variant="outline" disabled={busy}>
                    <Trash2 className="h-4 w-4" />
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

/** ======== BULK DIALOGS (kalkulator/penggunaan saja) ======== **/
function BulkCalcDialog({ disabled, ids, count, onDone }) {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [f, setF] = useState({
        satuan: "", nilaiSatuan: "", nilaiKonversi: "", satuanKonversi: "",
        nilaiPenggunaan: "", satuanPenggunaan: "", deskripsiPenggunaan: "",
    })
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

    async function submit(e) {
        e?.preventDefault?.()
        setBusy(true)
        try {
            const payload = { ids, ...f }
            const res = await fetch("/api/items/bulk", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const j = await res.json().catch(() => ({}))
            if (!res.ok) { alert(j.error || "Bulk kalkulator gagal"); return }
            setOpen(false)
            onDone?.()
            setF({ satuan: "", nilaiSatuan: "", nilaiKonversi: "", satuanKonversi: "", nilaiPenggunaan: "", satuanPenggunaan: "", deskripsiPenggunaan: "" })
        } finally { setBusy(false) }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
            <DialogTrigger asChild>
                <Button variant="secondary" disabled={disabled} title="Edit kalkulator/penggunaan untuk banyak item">
                    <Calculator className="h-4 w-4 mr-2" />
                    Edit Kalkulator{count ? ` • ${count}` : ""}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Bulk Edit Kalkulator / Penggunaan</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                        Menerapkan perubahan ke <b>{count}</b> item terpilih. Field kosong akan <b>diabaikan</b>.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <FieldMini label="Satuan (base)"><Input value={f.satuan} onChange={(e)=>set("satuan", e.target.value)} placeholder="cth: M3" /></FieldMini>
                        <FieldMini label="Nilai Satuan"><Input type="number" step="any" value={f.nilaiSatuan} onChange={(e)=>set("nilaiSatuan", e.target.value)} placeholder="cth: 0.75" /></FieldMini>
                        <FieldMini label="Nilai Konversi"><Input type="number" step="any" value={f.nilaiKonversi} onChange={(e)=>set("nilaiKonversi", e.target.value)} placeholder="cth: 84" /></FieldMini>
                        <FieldMini label="Satuan Konversi"><Input value={f.satuanKonversi} onChange={(e)=>set("satuanKonversi", e.target.value)} placeholder="cth: PCS" /></FieldMini>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <FieldMini label="Nilai Penggunaan"><Input type="number" step="any" value={f.nilaiPenggunaan} onChange={(e)=>set("nilaiPenggunaan", e.target.value)} placeholder="cth: 10" /></FieldMini>
                        <FieldMini label="Satuan Penggunaan"><Input value={f.satuanPenggunaan} onChange={(e)=>set("satuanPenggunaan", e.target.value)} placeholder="cth: M2" /></FieldMini>
                        <FieldMini label="Deskripsi Penggunaan"><Input value={f.deskripsiPenggunaan} onChange={(e)=>set("deskripsiPenggunaan", e.target.value)} placeholder="cth: Luas Dinding (m²)" /></FieldMini>
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

function FieldMini({ label, children }) {
    return (
        <div className="space-y-1">
            <label className="text-sm">{label}</label>
            {children}
        </div>
    )
}
