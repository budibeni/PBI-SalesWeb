// app/komisi/page.jsx
"use client"

import React from "react"
import useItems from "@/hooks/useItems"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Trash2 } from "lucide-react"
import { fmt, toNum } from "./utils"
import TargetKomisi from "./TargetKomisi"
import SearchItem from "./SearchItem"
import TableProduk from "./TableProduk"

export default function SimulasiPage() {
    const { ready, loading, items, refresh } = useItems()

    // ===== TARGET (disiapkan, bila nanti mau dipakai lanjut hitungan) =====
    const [targetGlobalRaw, setTargetGlobalRaw] = React.useState("")
    const [targetPerKategoriRaw, setTargetPerKategoriRaw] = React.useState({})
    const [targetComputed, setTargetComputed] = React.useState(null)

    // ===== BARIS PRODUK (SESUAI TABEL BARU) =====
    // Struktur row: { id, msrp, harga, qty, persen }
    const [rows, setRows] = React.useState([])

    // handler saat pilih item dari SearchItem: tambahkan baris jika belum ada
    const onPick = (rowBaru) => {
        if (!rowBaru) return
        setRows((prev) =>
            prev.some((r) => r.id === rowBaru.id) ? prev : [...prev, rowBaru]
        )
    }

    const onRemoveRow = (id) => {
        setRows((prev) => prev.filter((x) => x.id !== id))
    }

    const onChangeRow = (id, patch) => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    }

    // tombol "Salin Semua" — ringkasan berbasis harga/qty/persen/subtotal
    const buildCopyAll = React.useCallback(() => {
        if (!rows.length) return ""
        const itemById = new Map(items.map((it) => [it.id, it]))

        let grandTotal = 0
        const parts = rows.map((r) => {
            const it = itemById.get(r.id) || {}
            const kode = it.kodeItem || "-"
            const nama = it.namaItem || ""
            const msrp = Number(r.msrp || 0)
            const harga = toNum(r.harga)
            const qty = toNum(r.qty)
            const persen = Number(r.persen || 0)
            const subtotal = (harga * qty) * persen
            grandTotal += subtotal

            return [
                `PRODUK :`,
                `===============`,
                `${kode}${nama ? ` (${nama})` : ""}`,
                `MSRP = ${fmt(msrp)}`,
                `Harga = ${fmt(harga)}`,
                `Qty = ${fmt(qty, 4)}`,
                `Komisi = ${fmt(persen * 100, 2)}%`,
                `Subtotal = ${fmt(subtotal)}`,
                ``,
            ].join("\n")
        })

        parts.push(`GRAND TOTAL = ${fmt(grandTotal)}`)
        return parts.join("\n").trim()
    }, [rows, items])

    return (
        <div className="p-4">
            <Card className="mx-auto max-w-6xl">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                    <CardTitle className="text-base sm:text-lg">Target Komisi</CardTitle>

                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        <div className="flex-1 text-xs text-muted-foreground sm:whitespace-nowrap">
                            {loading ? "Memuat…" : ready ? `Item : ${rows.length}` : "Siapkan data…"}
                        </div>

                        {/* Tombol Refresh */}
                        <Button
                            variant="outline"
                            onClick={() => refresh()}
                            className="sm:w-auto flex items-center justify-center gap-1"
                            title="Refresh data"
                        >
                            <RefreshCcw className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        {/* Tombol Bersihkan */}
                        <Button
                            variant="outline"
                            onClick={() => setRows([])}
                            disabled={rows.length === 0}
                            className="sm:w-auto flex items-center justify-center gap-1"
                            title="Bersihkan"
                        >
                            <Trash2 className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Bersihkan</span>
                        </Button>
                    </div>
                </CardHeader>

                <div className="px-2">
                    {/* ===== Target (global & per-kategori) — perhitungan diserahkan ke komponen ===== */}
                    <TargetKomisi
                        valueGlobal={targetGlobalRaw}
                        onChangeGlobal={setTargetGlobalRaw}
                        valuePerKategori={targetPerKategoriRaw}
                        onChangePerKategori={setTargetPerKategoriRaw}
                        onComputed={setTargetComputed}
                    />
                </div>


            </Card>
            <Card className="mx-auto max-w-6xl mt-4">
                <CardContent className="space-y-6">
                    <SearchItem
                        onPick={onPick}
                    />
                    <TableProduk
                        rows={rows}
                        items={items}
                        onChangeRow={onChangeRow}
                        onRemoveRow={onRemoveRow}
                    />

                    <div className="text-xs text-muted-foreground">
                        Subtotal dihitung: <b>(Harga × Qty) × Persen</b> • MSRP adalah harga dari master item (read-only).
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
