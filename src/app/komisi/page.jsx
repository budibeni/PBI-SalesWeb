// app/komisi/page.jsx
"use client"

import React from "react"
import useItems from "@/hooks/useItems"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import CopyButton from "@/components/ui/copy-button"

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
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Simulasi Komisi</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                            {loading ? "Memuat…" : ready ? `Baris ${rows.length}` : "Siapkan data…"}
                        </div>
                        <CopyButton
                            getText={buildCopyAll}
                            size="sm"
                            label="Salin Semua"
                            successLabel="Tersalin!"
                            title="Salin ringkasan komisi semua baris"
                            disabled={rows.length === 0}
                        />
                        <Button variant="outline" onClick={() => refresh()}>
                            Refresh data
                        </Button>
                        <Button variant="ghost" onClick={() => setRows([])} disabled={rows.length === 0}>
                            Bersihkan pilihan
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* ===== Search Item (tambah baris dengan msrp/harga/qty/persen) ===== */}
                    <SearchItem onPick={onPick} />

                    {/* ===== Target (global & per-kategori) — perhitungan diserahkan ke komponen ===== */}
                    <TargetKomisi
                        valueGlobal={targetGlobalRaw}
                        onChangeGlobal={setTargetGlobalRaw}
                        valuePerKategori={targetPerKategoriRaw}
                        onChangePerKategori={setTargetPerKategoriRaw}
                        onComputed={setTargetComputed}
                    />

                    {/* ===== Tabel Produk (Produk, MSRP, Harga, Qty, Persen, Subtotal) ===== */}
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
