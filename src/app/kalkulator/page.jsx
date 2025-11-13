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
import { Component, RefreshCcw, Trash2 } from "lucide-react"

const MODE = {
    JUMLAH_ITEM: "JUMLAH_ITEM",
    LUAS_AREA: "LUAS_AREA",
}

const toNum = (v) => {
    const n = Number(String(v ?? "").replace(",", "."))
    return Number.isFinite(n) ? n : 0
}
const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })

export default function KalkulatorPage() {
    const { ready, loading, items, refresh } = useItems()

    const [picked, setPicked] = React.useState([])
    const [rows, setRows] = React.useState([])

    React.useEffect(() => {
        setRows((prev) => {
            const mp = new Map(prev.map((r) => [r.id, r]))
            return picked.map(
                (it) => mp.get(it.id) ?? { id: it.id, mode: MODE.JUMLAH_ITEM, jumlah: "" },
            )
        })
    }, [picked])

    const itemById = React.useMemo(() => {
        const m = new Map(items.map((it) => [it.id, it]))
        return (id) => m.get(id)
    }, [items])

    const onPick = (row) => {
        if (!row) return
        setPicked((prev) =>
            prev.some((p) => p.id === row.id) ? prev : [...prev, row],
        )
    }

    const removeRow = (id) =>
        setPicked((prev) => prev.filter((x) => x.id !== id))

    const onChangeRow = (id, patch) =>
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

    const computedRows = React.useMemo(() => {
        return rows.map((r) => {
            const it = itemById(r.id) || {}
            const jumlah = Math.max(0, toNum(r.jumlah))
            const nilaiPenggunaan = toNum(it.nilaiPenggunaan)

            let hasilNum = 0
            if (r.mode === MODE.JUMLAH_ITEM) {
                hasilNum = jumlah * (nilaiPenggunaan || 0)
            } else {
                hasilNum = jumlah > 0 ? jumlah / (nilaiPenggunaan || 0) : 0
            }

            const unit =
                r.mode === MODE.JUMLAH_ITEM
                    ? it.satuanPenggunaan || ""
                    : it.satuan || ""
            const hasilLabel = `${fmt(hasilNum)} ${unit}`.trim()

            return {
                ...r,
                _nilaiPenggunaan: nilaiPenggunaan,
                _it: it,
                _hasilNum: hasilNum,
                _hasilLabel: hasilLabel,
            }
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

    // ✨ Fungsi hasil salin
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
                `PRODUK :\n===============\n${kode}${nama}\nQty = ${qtyVal} ${qtyUnit}\nCoverage = ${covVal} ${covUnit}\n`,
            )
        })

        return parts.join("\n").trim()
    }, [computedRows])

    return (
        <>
            <Card className="mx-auto max-w-6xl mb-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                        <div className="flex items-center gap-1 sm:whitespace-nowrap text-xs sm:text-lg">
                            <Component className="h-5 w-5 text-yellow-500" />
                            {loading ? "Memuat…" : "Kalkulator Produk"}
                        </div>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <CopyButton
                            getText={buildCopyAll}
                            size="sm"
                            label="Salin"
                            successLabel="Tersalin!"
                            title="Salin hasil kalkulasi semua produk"
                            disabled={computedRows.length === 0}
                        />

                        {/* Tombol Refresh */}
                        <Button
                            variant="outline"
                            onClick={() => refresh()}
                            className="sm:w-auto flex items-center gap-1"
                            title="Refresh data"
                        >
                            <RefreshCcw className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        {/* Tombol Bersihkan */}
                        <Button
                            variant="outline"
                            onClick={() => setPicked([])}
                            disabled={picked.length === 0}
                            className="sm:w-auto flex items-center gap-1"
                            title="Bersihkan"
                        >
                            <Trash2 className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Bersihkan</span>
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
                </CardContent>
            </Card>

                    {/* ===== MOBILE: LIST CARD ===== */}
                    <div className="block sm:hidden space-y-3">
                        {computedRows.map((r) => {
                            const it = r._it || {}

                            return (
                                <Card key={r.id} className="overflow-hidden">
                                    <CardContent className="space-y-3">
                                        {/* Header produk */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div
                                                    className={`font-medium ${
                                                        r._nilaiPenggunaan <= 0 && "line-through"
                                                    }`}
                                                >
                                                    {it.kodeItem || "-"}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {it.namaItem || ""}
                                                </div>
                                            </div>
                                        </div>


                                        {/* Mode & jumlah */}
                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Mode
                        </span>
                                                <Select
                                                    value={r.mode}
                                                    onValueChange={(v) =>
                                                        onChangeRow(r.id, { mode: v })
                                                    }
                                                >
                                                    <SelectTrigger className="w-[11rem] h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={MODE.JUMLAH_ITEM}>
                                                            Jumlah Item
                                                        </SelectItem>
                                                        <SelectItem value={MODE.LUAS_AREA}>
                                                            Luas Area
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Jumlah
                        </span>
                                                <Input
                                                    inputMode="decimal"
                                                    className="text-right h-8 text-xs w-[11rem]"
                                                    value={r.jumlah}
                                                    onChange={(e) =>
                                                        onChangeRow(r.id, { jumlah: e.target.value })
                                                    }
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Hasil + tombol hapus */}
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="text-sm">
                                                <div className="text-[10px] text-muted-foreground mt-1">
                                                    {r.mode === MODE.JUMLAH_ITEM
                                                        ? "Luas Area : "
                                                        : "Jumlah Item : "}
                                                </div>
                                                <div className="font-semibold">{r._hasilLabel}</div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeRow(r.id)}
                                                title="Hapus baris"
                                                className="h-8 w-8"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}

                        {picked.length === 0 && (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                                    Belum ada item dipilih
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ===== DESKTOP: TABLE ===== */}
            <Card className="hidden sm:block">
                <CardContent className="px-6 py-2 space-y-4">
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
                                                <div
                                                    className={`font-medium leading-tight ${
                                                        r._nilaiPenggunaan <= 0 && "line-through"
                                                    }`}
                                                >
                                                    {it.kodeItem}
                                                </div>
                                                <div className="text-xs text-muted-foreground leading-tight">
                                                    {it.namaItem}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Select
                                                    value={r.mode}
                                                    onValueChange={(v) =>
                                                        onChangeRow(r.id, { mode: v })
                                                    }
                                                >
                                                    <SelectTrigger className="w-[10rem]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={MODE.JUMLAH_ITEM}>
                                                            Jumlah Item
                                                        </SelectItem>
                                                        <SelectItem value={MODE.LUAS_AREA}>
                                                            Luas Area
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <Input
                                                    inputMode="decimal"
                                                    className="text-right"
                                                    value={r.jumlah}
                                                    onChange={(e) =>
                                                        onChangeRow(r.id, { jumlah: e.target.value })
                                                    }
                                                    placeholder="0"
                                                />
                                            </TableCell>

                                            <TableCell className="text-right">
                                                {r._hasilLabel}
                                            </TableCell>

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
                                        <TableCell
                                            colSpan={5}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            Belum ada item dipilih
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                </CardContent>
            </Card>

                    {/* Kalau mau, rumus bisa dimunculkan lagi */}
                    {/* <div className="text-xs text-muted-foreground">
            Rumus: <b>Jumlah Item</b> = jumlah × nilaiPenggunaan (hasil → satuanPenggunaan) •{" "}
            <b>Luas Area</b> = nilaiPenggunaan ÷ jumlah (hasil → satuan dasar)
          </div> */}

        </>
    )
}
