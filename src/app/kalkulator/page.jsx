"use client"

import React from "react"
import useItems from "@/hooks/useItems"
import MasterInputSearchTitleDesc from "@/components/master-input-search/MasterInputSearchTitleDesc"
import CopyButton from "@/components/ui/copy-button"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"

const MODE = {
    JUMLAH_ITEM: "JUMLAH_ITEM",
    LUAS_AREA: "LUAS_AREA",
}

const toNum = (v) => {
    const n = Number(String(v ?? "").replace(",", "."))
    return Number.isFinite(n) ? n : 0
}
const fmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })

export default function KalkulatorPage() {
    const { ready, loading, items, refresh } = useItems()

    const [picked, setPicked] = React.useState([])
    const [rows, setRows] = React.useState([])

    React.useEffect(() => {
        setRows((prev) => {
            const mp = new Map(prev.map((r) => [r.id, r]))
            return picked.map((it) => mp.get(it.id) ?? { id: it.id, mode: MODE.JUMLAH_ITEM, jumlah: "" })
        })
    }, [picked])

    const itemById = React.useMemo(() => {
        const m = new Map(items.map((it) => [it.id, it]))
        return (id) => m.get(id)
    }, [items])

    const onPick = (row) => {
        if (!row) return
        setPicked((prev) => (prev.some((p) => p.id === row.id) ? prev : [...prev, row]))
    }

    const removeRow = (id) => setPicked((prev) => prev.filter((x) => x.id !== id))
    const onChangeRow = (id, patch) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

    const computedRows = React.useMemo(() => {
        return rows.map((r) => {
            const it = itemById(r.id) || {}
            const jumlah = Math.max(0, toNum(r.jumlah))
            const nilaiPenggunaan = toNum(it.nilaiPenggunaan)

            let hasilNum = 0
            if (r.mode === MODE.JUMLAH_ITEM) {
                hasilNum = jumlah * (nilaiPenggunaan || 0)
            } else {
                hasilNum = jumlah > 0 ? (nilaiPenggunaan || 0) / jumlah : 0
            }

            const unit = r.mode === MODE.JUMLAH_ITEM ? (it.satuanPenggunaan || "") : (it.satuan || "")
            const hasilLabel = `${fmt(hasilNum)} ${unit}`.trim()

            return { ...r, _it: it, _hasilNum: hasilNum, _hasilLabel: hasilLabel }
        })
    }, [rows, itemById])

    const fetchPicker = React.useCallback(
        async (q) => {
            const qq = (q || "").trim().toLowerCase()
            if (!qq) return items || []
            return (items || []).filter((it) => {
                const hay = `${it.kodeItem || ""} ${it.namaItem || ""}`.toLowerCase()
                return hay.includes(qq)
            })
        },
        [items],
    )

    // ✨ Fungsi hasil salin baru
    const buildCopyAll = React.useCallback(() => {
        if (!computedRows.length) return ""
        const parts = []

        computedRows.forEach((r) => {
            const it = r._it || {}
            const kode = it.kodeItem || "-"
            const nama = it.namaItem ? ` (${it.namaItem})` : ""
            const satuan = it.satuan || ""
            const satuanPenggunaan = it.satuanPenggunaan || ""

            let qtyVal, qtyUnit, covVal, covUnit

            if (r.mode === MODE.JUMLAH_ITEM) {
                // mode jumlah item → hasil = coverage
                qtyVal = r.jumlah || 0
                qtyUnit = satuan
                covVal = fmt(r._hasilNum)
                covUnit = satuanPenggunaan
            } else {
                // mode luas area → hasil = qty
                qtyVal = fmt(r._hasilNum)
                qtyUnit = satuan
                covVal = r.jumlah || 0
                covUnit = satuanPenggunaan
            }

            parts.push(
                `PRODUK :\n===============\n${kode}\nQty = ${qtyVal} ${qtyUnit}\nCoverage = ${covVal} ${covUnit}\n`
            )
        })

        return parts.join("\n").trim()
    }, [computedRows])

    return (
        <div className="p-4">
            <Card className="mx-auto max-w-6xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Kalkulator Produk</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                            {loading ? "Memuat…" : ready ? `Dipilih ${picked.length} item` : "Siapkan data…"}
                        </div>
                        <CopyButton
                            getText={buildCopyAll}
                            size="sm"
                            label="Salin Semua"
                            successLabel="Tersalin!"
                            title="Salin hasil kalkulasi semua produk"
                            disabled={computedRows.length === 0}
                        />
                        <Button variant="outline" onClick={() => refresh()}>
                            Refresh data
                        </Button>
                        <Button variant="ghost" onClick={() => setPicked([])} disabled={picked.length === 0}>
                            Bersihkan pilihan
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <MasterInputSearchTitleDesc
                        value={null}
                        onChange={onPick}
                        fetchData={fetchPicker}
                        placeholder="Cari produk (kode/nama)…"
                        groupLabel="Pilih produk untuk ditambahkan"
                        titleKey="kodeItem"
                        descriptionKey="namaItem"
                        buttonClassName="w-full justify-between"
                        popoverClassName="min-w-[28rem]"
                        allowClear={false}
                    />

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-72">Produk</TableHead>
                                    <TableHead className="w-40">Mode</TableHead>
                                    <TableHead className="w-40 text-right">Jumlah</TableHead>
                                    <TableHead className="w-48 text-right">Hasil</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {computedRows.map((r) => {
                                    const it = r._it || {}
                                    return (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div className="font-medium leading-tight">{it.kodeItem}</div>
                                                <div className="text-xs text-muted-foreground leading-tight">{it.namaItem}</div>
                                            </TableCell>

                                            <TableCell>
                                                <Select value={r.mode} onValueChange={(v) => onChangeRow(r.id, { mode: v })}>
                                                    <SelectTrigger className="w-[10rem]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={MODE.JUMLAH_ITEM}>Jumlah Item</SelectItem>
                                                        <SelectItem value={MODE.LUAS_AREA}>Luas Area</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <Input
                                                    inputMode="decimal"
                                                    className="text-right"
                                                    value={r.jumlah}
                                                    onChange={(e) => onChangeRow(r.id, { jumlah: e.target.value })}
                                                    placeholder="0"
                                                />
                                            </TableCell>

                                            <TableCell className="text-right">{r._hasilLabel}</TableCell>

                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => removeRow(r.id)}
                                                    title="Hapus baris"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {picked.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                            Belum ada item dipilih
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Rumus: <b>Jumlah Item</b> = jumlah × nilaiPenggunaan (hasil → satuanPenggunaan) •{" "}
                        <b>Luas Area</b> = nilaiPenggunaan ÷ jumlah (hasil → satuan dasar)
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
