// komisi/TableProduk.jsx
"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
import NumericInput from "@/components/ui/NumericInput";

const CAT_ALL = "__ALL__"

// konversi number -> numeric string "dot-decimal" untuk disimpan di state
const toNumericString = (n) => String(ROUND2(n))

export default function TableProduk({
                                        rows,
                                        items,
                                        onChangeRow,
                                        onRemoveRow,
                                        filterKategori = CAT_ALL,
                                        expand = false,
                                        onExpandChange = () => {},
                                        targetKomisi = null, // { global, perKategori }
                                    }) {
    const itemById = React.useMemo(() => {
        const m = new Map(items.map((it) => [it.id, it]))
        return (id) => m.get(id)
    }, [items])

    const visibleRows = React.useMemo(() => {
        const selLower = String(filterKategori || CAT_ALL).toLowerCase()
        const isAll = selLower === CAT_ALL.toLowerCase()
        return rows.filter((r) => {
            if (isAll) return true
            const it = itemById(r.id) || {}
            const kat = String(it.kategori || "").toLowerCase()
            return kat === selLower
        })
    }, [rows, filterKategori, itemById])

    const totalKomisiDasar = React.useMemo(
        () => visibleRows.reduce((sum, r) => sum + subOf(r), 0),
        [visibleRows]
    )

    const applyPatch = React.useCallback((patchMap) => {
        // patchMap: { id: { harga?: number, qty?: number } }
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
            // 1) per kategori
            cfg.perCat.forEach((targetVal, katKey) => {
                const scope = rows.filter((r) => categoryOf(r) === String(katKey).toLowerCase())
                if (scope.length === 0) return
                Object.assign(allPatch, recommendScope(scope, targetVal))
            })
            // 2) cap global (jika diisi)
            if (cfg.global) {
                // snapshot numeric untuk global cap
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

    return (
        <div>
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
                            const msrp = Number(it?.msrp || r.msrp || 0)
                            const minHarga = ROUND2(msrp * MIN_RATIO)
                            const maxHarga = ROUND2(msrp * MAX_RATIO)

                            const harga = asNum(r.harga)
                            const qty = asNum(r.qty)
                            const subtotal = harga * qty * normPct(r.persen)

                            return (
                                <TableRow key={r.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium leading-tight">{it.kodeItem || "-"}</div>
                                            {String(filterKategori).toLowerCase() === CAT_ALL.toLowerCase() && it.kategori && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {it.kategori}
                        </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground leading-tight mt-1">
                                            {it.namaItem || ""}
                                        </div>
                                    </TableCell>

                                    <TableCell
                                        className="text-right cursor-pointer"
                                        onClick={() => onChangeRow?.(r.id, { harga: toNumericString(msrp) })}
                                        title="Klik untuk set ke MSRP"
                                    >
                                        {fmt(msrp)}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <NumericInput
                                                value={r.harga}
                                                min={minHarga}
                                                max={maxHarga}
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
                                                {r.hargaLocked ? (
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Unlock className="h-4 w-4 text-muted-foreground" />
                                                )}
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
                                                {r.qtyLocked ? (
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Unlock className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>

                                            <NumericInput
                                                value={r.qty}
                                                min={MIN_QTY}
                                                fixedDecimalScale={false}
                                                onValue={(strNumeric) => onChangeRow?.(r.id, { qty: strNumeric })}
                                                disabled={r.qtyLocked}
                                                className="text-right w-24"
                                            />
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="font-medium leading-tight">{fmt(subtotal)}</div>
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

            {/* Footer aksi dan total */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                    Komisi Dasar (tampilan): <b>Rp. {fmt(totalKomisiDasar)}</b>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="sm:w-auto flex items-center justify-center gap-1"
                        title="Minta Rekomendasi"
                        onClick={recommend}
                    >
                        <Grid2X2Check className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Minta Rekomendasi</span>
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        className="sm:w-auto flex items-center justify-center gap-1"
                        title="Achievement"
                        onClick={() => onExpandChange(!expand)}
                    >
                        <span>Achievement</span>
                        {expand ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
