// komisi/TableProduk.jsx
"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { fmt, toNum, pctToLabel } from "./utils"

/**
 * rows: Array<{
 *   id: string,
 *   msrp: number,   // label
 *   harga: string|number, // input
 *   qty: string|number,   // input
 *   persen: number, // 0.1 = 10%
 * }>
 * items: master items (buat render label produk dari id)
 * onChangeRow(id, patch)
 * onRemoveRow(id)
 */
export default function TableProduk({ rows, items, onChangeRow, onRemoveRow }) {
    const itemById = React.useMemo(() => {
        const m = new Map(items.map((it) => [it.id, it]))
        return (id) => m.get(id)
    }, [items])

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-72">Produk</TableHead>
                        <TableHead className="w-28 text-right">MSRP</TableHead>
                        <TableHead className="w-36 text-right">Harga</TableHead>
                        <TableHead className="w-28 text-right">Qty</TableHead>
                        <TableHead className="w-28 text-right">Persen</TableHead>
                        <TableHead className="w-40 text-right">Subtotal</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((r) => {
                        const it = itemById(r.id) || {}
                        const harga = toNum(r.harga)
                        const qty = toNum(r.qty)
                        const persen = Number(r.persen || 0)
                        const subtotal = (harga * qty) * persen

                        return (
                            <TableRow key={r.id}>
                                <TableCell>
                                    <div className="font-medium leading-tight">{it.kodeItem || "-"}</div>
                                    <div className="text-xs text-muted-foreground leading-tight">{it.namaItem || ""}</div>
                                </TableCell>

                                <TableCell className="text-right">{fmt(r.msrp || 0)}</TableCell>

                                <TableCell className="text-right">
                                    <Input
                                        inputMode="decimal"
                                        className="text-right"
                                        value={r.harga}
                                        onChange={(e) => onChangeRow?.(r.id, { harga: e.target.value })}
                                        placeholder="0"
                                    />
                                </TableCell>

                                <TableCell className="text-right">
                                    <Input
                                        inputMode="decimal"
                                        className="text-right"
                                        value={r.qty}
                                        onChange={(e) => onChangeRow?.(r.id, { qty: e.target.value })}
                                        placeholder="0"
                                    />
                                </TableCell>

                                <TableCell className="text-right">
                                    {/* tampilkan label persen hasil mapping kategori */}
                                    <span className="text-sm">{pctToLabel(persen)}</span>
                                </TableCell>

                                <TableCell className="text-right font-medium">{fmt(subtotal)}</TableCell>

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

                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                Belum ada item dipilih
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
