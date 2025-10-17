// komisi/TableProduk.jsx
"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { fmt, toNum, pctToLabel } from "./utils"
import { Lock, Unlock, RotateCcw } from "lucide-react"

const CAT_ALL = "__ALL__"

/**
 * props:
 *  - rows: [{ id, msrp:number, harga:string|number, qty:string|number, persen:number }]
 *  - items: master items (untuk ambil label/kategori dari id)
 *  - onChangeRow(id, patch)
 *  - onRemoveRow(id)
 *  - filterKategori?: string  -> "__ALL__" | nama kategori; hanya SEMBUNYIKAN baris yang tidak cocok
 */
export default function TableProduk({
                                        rows,
                                        items,
                                        onChangeRow,
                                        onRemoveRow,
                                        filterKategori = CAT_ALL,
                                    }) {
    const itemById = React.useMemo(() => {
        const m = new Map(items.map((it) => [it.id, it]))
        return (id) => m.get(id)
    }, [items])

    // Perbaikan: samakan casing untuk pembanding "__ALL__"
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

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-72">Produk</TableHead>
                        <TableHead className="w-28 text-right">MSRP</TableHead>
                        <TableHead className="w-36 text-right">Harga</TableHead>
                        <TableHead className="w-28 text-right">Qty</TableHead>
                        {/*<TableHead className="w-28 text-right">Satuan</TableHead>*/}
                        {/*<TableHead className="w-28 text-right">Persen</TableHead>*/}
                        <TableHead className="w-40 text-right">Subtotal</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {visibleRows.map((r) => {
                        const it = itemById(r.id) || {}
                        const harga = toNum(r.harga)
                        const qty = toNum(r.qty)
                        const persen = Number(r.persen || 0) // desimal, mis 0.1 = 10%
                        const subtotal = (harga * qty) * persen

                        return (
                            <TableRow key={r.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium leading-tight">
                                            {it.kodeItem || "-"}
                                        </div>
                                        {/* tampilkan kategori hanya jika filter = semua */}
                                        {filterKategori === CAT_ALL && it.kategori && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                                                {it.kategori}
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-xs text-muted-foreground leading-tight">
                                        {it.namaItem || ""}
                                    </div>
                                </TableCell>



                                <TableCell className="text-right">{fmt(r.msrp || 0)}</TableCell>

                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Kembalikan ke harga default (MSRP)"
                                            onClick={() => onChangeRow?.(r.id, { harga: r.msrp || 0 })}
                                            className="h-5 w-5"
                                        >
                                            <RotateCcw className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Input
                                            inputMode="decimal"
                                            className="text-right w-24"
                                            value={r.harga}
                                            onChange={(e) => onChangeRow?.(r.id, { harga: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </TableCell>



                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                onChangeRow?.(r.id, { qtyLocked: !r.qtyLocked })
                                            }
                                            title={r.qtyLocked ? "Buka kunci Qty" : "Kunci Qty"}
                                            className="h-5 w-5"
                                        >
                                            {r.qtyLocked ? (
                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Unlock className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                        <Input
                                            inputMode="decimal"
                                            className="text-right w-24"
                                            value={r.qty}
                                            disabled={r.qtyLocked} // disable saat dikunci
                                            onChange={(e) => onChangeRow?.(r.id, { qty: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </TableCell>

                                {/*<TableCell className="text-center">*/}
                                {/*    <span className="text-sm">{r.satuan}</span>*/}
                                {/*</TableCell>*/}

                                {/*<TableCell className="text-right">*/}
                                {/*    <span className="text-sm">{pctToLabel(persen)}</span>*/}
                                {/*</TableCell>*/}

                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="font-medium leading-tight">{fmt(subtotal)}</div>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase mt-0.5 inline-block">
                                          (Rp. {fmt(subtotal / (r.qty || 1))} / {r.satuan || "-"})
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
                                {rows.length === 0
                                    ? "Belum ada item dipilih"
                                    : "Tidak ada item pada kategori ini"}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
