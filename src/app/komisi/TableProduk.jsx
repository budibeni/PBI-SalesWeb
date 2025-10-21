// komisi/TableProduk.jsx
"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Lock, Unlock, Grid2X2Check, ChevronUp, ChevronDown } from "lucide-react"
import { fmt } from "./utils"

import {
    asNum, ROUND2, normPct,
    MIN_RATIO, MAX_RATIO, MIN_QTY,
    parseTargetKomisiObj,
    recommendScope,
    enforceGlobalCap,
    subOf
} from "./komisiLogic"

import NumericInput from "@/components/ui/NumericInput"
import SearchItem from "@/app/komisi/SearchItem"

const CAT_ALL = "__ALL__"
const toNumericString = (n) => String(ROUND2(n))

export default function TableProduk({
                                        rows,
                                        items,
                                        onChangeRow,
                                        onRemoveRow,
                                        onPick,
                                        selectedCat,
                                        onChangeCategory,
                                        expand = false,
                                        onExpandChange = () => {},
                                        targetKomisi = null,

                                        // 🔹 callback baru untuk kirim komisiDasar ke parent
                                        onKomisiDasarChange,
                                    }) {
    const activeFilter = (selectedCat ?? CAT_ALL)

    const itemById = React.useMemo(() => {
        const m = new Map(items.map((it) => [it.id, it]))
        return (id) => m.get(id)
    }, [items])

    const visibleRows = React.useMemo(() => {
        const selLower = String(activeFilter || CAT_ALL).toLowerCase()
        const isAll = selLower === CAT_ALL.toLowerCase()
        return rows.filter((r) => {
            if (isAll) return true
            const it = itemById(r.id) || {}
            const kat = String(it.kategori || "").toLowerCase()
            return kat === selLower
        })
    }, [rows, activeFilter, itemById])

    // Komisi dasar untuk TAMPILAN (hanya baris yang terlihat sekarang)
    const totalKomisiDasar = React.useMemo(
        () => visibleRows.reduce((sum, r) => sum + subOf(r), 0),
        [visibleRows]
    )

    // 🔹 Komisi dasar ALL ROWS (untuk dikirim ke parent)
    const komisiDasarAll = React.useMemo(
        () => rows.reduce((sum, r) => sum + subOf(r), 0),
        [rows]
    )

    // 🔹 Kirim ke parent setiap berubah
    React.useEffect(() => {
        if (typeof onKomisiDasarChange === "function") {
            onKomisiDasarChange(komisiDasarAll)
        }
    }, [komisiDasarAll, onKomisiDasarChange])

    const applyPatch = React.useCallback((patchMap) => {
        Object.entries(patchMap || {}).forEach(([id, data]) => {
            const next = {}
            if (data.harga !== undefined) next.harga = toNumericString(data.harga)
            if (data.qty !== undefined)   next.qty   = toNumericString(data.qty)
            if (Object.keys(next).length) onChangeRow?.(id, next)
        })
    }, [onChangeRow])

    const recommend = () => {
        const cfg = parseTargetKomisiObj(targetKomisi)
        if (!cfg || cfg.mode === "NONE") {
            alert("Target komisi belum ditentukan.")
            return
        }

        const categoryOf = (r) => {
            const it = itemById(r.id) || {}
            return String(it.kategori || "").toLowerCase()
        }

        let allPatch = {}

        if (cfg.mode === "GLOBAL") {
            allPatch = { ...allPatch, ...recommendScope(rows, cfg.global) }
        } else if (cfg.mode === "BY_CATEGORY") {
            cfg.perCat.forEach((targetVal, katKey) => {
                const scope = rows.filter((r) => categoryOf(r) === String(katKey).toLowerCase())
                if (scope.length === 0) return
                Object.assign(allPatch, recommendScope(scope, targetVal))
            })
            if (cfg.global) {
                const snap = rows.map((r) => {
                    const p = allPatch[r.id]
                    const hargaNum = p?.harga ?? asNum(r.harga)
                    const qtyNum   = p?.qty   ?? asNum(r.qty)
                    return { ...r, harga: hargaNum, qty: qtyNum }
                })
                Object.assign(allPatch, enforceGlobalCap(snap, cfg.global))
            }
        }

        applyPatch(allPatch)
    }

    const hasTarget = React.useMemo(() => {
        const cfg = parseTargetKomisiObj(targetKomisi)
        if (!cfg || cfg.mode === "NONE") return false
        if (cfg.mode === "GLOBAL") return (cfg.global ?? 0) > 0
        if (cfg.mode === "BY_CATEGORY") {
            const anyCat = cfg.perCat && cfg.perCat.size > 0
            const hasGlobalNominal = Number(cfg.global || 0) > 0
            return anyCat || hasGlobalNominal
        }
        return false
    }, [targetKomisi])

    /* ======================= UI ======================= */
    return (
        <div className="space-y-4 pt-4">
            {/* ===== MOBILE: Search + Card per-item ===== */}
            <div className="block sm:hidden space-y-3">
                <SearchItem
                    onPick={onPick}
                    selectedCat={activeFilter}
                    onChangeCategory={onChangeCategory}
                />

                {visibleRows.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            {rows.length === 0 ? "Belum ada item dipilih" : "Tidak ada item pada kategori ini"}
                        </CardContent>
                    </Card>
                ) : (
                    visibleRows.map((r) => {
                        const it = itemById(r.id) || {}
                        const msrp = Number(it?.msrp ?? r.msrp ?? 0)
                        const hasMsrp = Number.isFinite(msrp) && msrp > 0

                        const harga = asNum(r.harga)
                        const qty = asNum(r.qty)
                        const subtotal = harga * qty * normPct(r.persen)

                        return (
                            <Card key={r.id} className="overflow-hidden">
                                <CardContent className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="font-medium">{it.kodeItem || "-"}</div>
                                            <div className="text-xs text-muted-foreground">{it.namaItem || ""}</div>
                                        </div>
                                        {it.kategori && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        {it.kategori}
                      </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-12 items-center gap-2">
                                        <label className="col-span-4 text-sm text-muted-foreground">Harga</label>
                                        <div className="col-span-8 flex items-center justify-end gap-2">
                                            <NumericInput
                                                value={r.harga}
                                                softMin={hasMsrp ? ROUND2(msrp * MIN_RATIO) : undefined}
                                                softMax={hasMsrp ? ROUND2(msrp * MAX_RATIO) : undefined}
                                                fixedDecimalScale={false}
                                                onValue={(val) => onChangeRow?.(r.id, { harga: val })}
                                                disabled={r.hargaLocked}
                                                className="text-right w-full"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onChangeRow?.(r.id, { hargaLocked: !r.hargaLocked })}
                                                className="h-8 w-8"
                                                title={r.hargaLocked ? "Buka kunci harga" : "Kunci harga"}
                                            >
                                                {r.hargaLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center gap-2">
                                        <label className="col-span-4 text-sm text-muted-foreground">Qty</label>
                                        <div className="col-span-8 flex items-center justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onChangeRow?.(r.id, { qtyLocked: !r.qtyLocked })}
                                                className="h-8 w-8 order-2"
                                                title={r.qtyLocked ? "Buka kunci Qty" : "Kunci Qty"}
                                            >
                                                {r.qtyLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                            </Button>
                                            <NumericInput
                                                value={r.qty}
                                                softMin={MIN_QTY}
                                                fixedDecimalScale={false}
                                                onValue={(val) => onChangeRow?.(r.id, { qty: val })}
                                                disabled={r.qtyLocked}
                                                className="text-right w-full order-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="text-sm">
                                            <div className="font-semibold">Rp {fmt(subtotal)}</div>
                                            <div className="text-[10px] text-muted-foreground mt-1">
                                                (Rp. {fmt(qty > 0 ? subtotal / qty : 0)} / {r.satuan || "-"})
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => onRemoveRow?.(r.id)}
                                            title="Hapus baris"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>

            {/* ===== DESKTOP: Card membungkus SearchItem + Tabel ===== */}
            <Card className="hidden sm:block">
                <CardContent className="px-6 py-2 space-y-4">
                    <SearchItem
                        onPick={onPick}
                        selectedCat={activeFilter}
                        onChangeCategory={onChangeCategory}
                    />

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-72">Produk</TableHead>
                                    <TableHead className="w-28 text-right">MSRP</TableHead>
                                    <TableHead className="w-36 text-right">Harga</TableHead>
                                    <TableHead className="w-28 text-right">Qty</TableHead>
                                    <TableHead className="w-40 text-right">Subtotal</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {visibleRows.map((r) => {
                                    const it = itemById(r.id) || {}
                                    const msrp = Number(it?.msrp ?? r.msrp ?? 0)
                                    const hasMsrp = Number.isFinite(msrp) && msrp > 0

                                    const harga = asNum(r.harga)
                                    const qty = asNum(r.qty)
                                    const subtotal = harga * qty * normPct(r.persen)

                                    return (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium leading-tight">{it.kodeItem || "-"}</div>
                                                    {String(activeFilter).toLowerCase() === CAT_ALL.toLowerCase() && it.kategori && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                              {it.kategori}
                            </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground leading-tight mt-1">
                                                    {it.namaItem || ""}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-right text-muted-foreground">
                                                Rp {fmt(msrp)}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <NumericInput
                                                        value={r.harga}
                                                        softMin={hasMsrp ? ROUND2(msrp * MIN_RATIO) : undefined}
                                                        softMax={hasMsrp ? ROUND2(msrp * MAX_RATIO) : undefined}
                                                        fixedDecimalScale={false}
                                                        onValue={(strNumeric) => onChangeRow?.(r.id, { harga: strNumeric })}
                                                        disabled={r.hargaLocked}
                                                        className="text-right w-24"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onChangeRow?.(r.id, { hargaLocked: !r.hargaLocked })}
                                                        title={r.hargaLocked ? "Buka kunci harga" : "Kunci harga"}
                                                        className="h-5 w-5"
                                                    >
                                                        {r.hargaLocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                                                    </Button>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onChangeRow?.(r.id, { qtyLocked: !r.qtyLocked })}
                                                        title={r.qtyLocked ? "Buka kunci Qty" : "Kunci Qty"}
                                                        className="h-5 w-5"
                                                    >
                                                        {r.qtyLocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                                                    </Button>

                                                    <NumericInput
                                                        value={r.qty}
                                                        softMin={MIN_QTY}
                                                        fixedDecimalScale={false}
                                                        onValue={(strNumeric) => onChangeRow?.(r.id, { qty: strNumeric })}
                                                        disabled={r.qtyLocked}
                                                        className="text-right w-24"
                                                    />
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="font-medium leading-tight">Rp {fmt(subtotal)}</div>
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase mt-0.5 inline-block">
                            (Rp. {fmt(qty > 0 ? subtotal / qty : 0)} / {r.satuan || "-"})
                          </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => onRemoveRow?.(r.id)}
                                                    title="Hapus baris"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}

                                {visibleRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                            {rows.length === 0 ? "Belum ada item dipilih" : "Tidak ada item pada kategori ini"}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>


                </CardContent>
            </Card>

            {/* Footer buttons */}
            <div className="flex flex-col sm:flex-row w-full items-center gap-2">
                {/* 🔹 Komisi Dasar: di atas (mobile), di tengah (desktop) */}
                <div className="block sm:hidden text-xs text-muted-foreground w-full text-center">
                    Komisi Dasar : <b>Rp. {fmt(totalKomisiDasar)}</b>
                </div>

                <div className="flex w-full sm:w-full items-center justify-between gap-2">
                    {/* Achievement */}
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1"
                        title="Achievement"
                        onClick={() => onExpandChange(!expand)}
                    >
                        <span>Achievement</span>
                        {expand ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {/* Komisi Dasar — hanya tampil di desktop */}
                    <div className="hidden sm:block text-xs text-muted-foreground text-center flex-1">
                        Komisi Dasar : <b>Rp. {fmt(totalKomisiDasar)}</b>
                    </div>

                    {/* Minta Rekomendasi — selalu paling kanan di desktop */}
                    {hasTarget && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:ml-auto sm:mr-0"
                            title="Minta Rekomendasi"
                            onClick={recommend}
                        >
                            <Grid2X2Check className="h-4 w-4 sm:mr-1" />
                            <span>Minta Rekomendasi</span>
                        </Button>
                    )}
                </div>
            </div>



        </div>
    )
}
