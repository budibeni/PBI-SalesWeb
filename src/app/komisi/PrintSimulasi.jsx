"use client"

import React, { forwardRef } from "react"
import {calcPotensiKomisi} from "@/app/komisi/logic/TableProduk/subtotal";

const nf = (n) =>
    Number(n || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

const nf0 = (n) =>
    Number(n || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })

// Deteksi tipe target kategori.
// - Jika ada sufiks "%" → PERCENT
// - Jika tidak ada tetapi targetGlobal ada → asumsikan persen (komponen TargetKomisi memakai mode persen saat global terisi)
// - Jika angka murni dan targetGlobal kosong → NOMINAL
function detectTargetType(val, hasGlobal) {
    const s = String(val ?? "").trim()
    if (!s) return hasGlobal ? "PERCENT" : "NOMINAL"
    if (s.endsWith("%")) return "PERCENT"
    const num = Number(s)
    if (!Number.isNaN(num)) {
        // Jika global terisi (mode persen), dan nilai <= 100 → persen.
        if (hasGlobal && num <= 100) return "PERCENT"
        return "NOMINAL"
    }
    return hasGlobal ? "PERCENT" : "NOMINAL"
}

// Format tampilan nilai target kategori berdasarkan tipe
function formatTargetValue(val, type) {
    if (type === "PERCENT") {
        const s = String(val ?? "").replace(/%/g, "")
        const num = Number(s) || 0
        return `${num.toFixed(2)}%`
    }
    // NOMINAL
    const num = Number(val || 0)
    return `Rp ${nf(num)}`
}

// Normalisasi achievementKategori → [{ kategori, achievementPct }]
function normalizeAchievement(achievementKategori) {
    const rows = []

    // Bentuk 1: Array of objects: [{ kategori, achievement, ... }]
    if (Array.isArray(achievementKategori)) {
        for (const r of achievementKategori) {
            if (!r || !r.kategori) continue
            const ach = Number(r.achievement || 0)
            rows.push({ kategori: r.kategori, achievementPct: ach * 100 })
        }
        return rows
    }

    // Bentuk 2: Object map: { [kategori]: achievement }
    if (achievementKategori && typeof achievementKategori === "object") {
        for (const [kat, v] of Object.entries(achievementKategori)) {
            const ach = Number(v || 0)
            rows.push({ kategori: kat, achievementPct: ach * 100 })
        }
    }

    return rows
}

const PrintSimulasi = forwardRef(function PrintSimulasi({ data }, ref) {
    if (!data) return null
    const rows = Array.isArray(data.rowsItem) ? data.rowsItem : []
    const hasGlobal = Number(data.targetGlobal || 0) > 0

    // Normalisasi achievement
    const achRows = normalizeAchievement(data.achievementKategori)

    return (
        <div
            ref={ref}
            className="p-8 font-sans text-[13px] leading-relaxed text-gray-900 print:text-black"
            style={{ width: "210mm", background: "white" }}
        >
            {/* HEADER */}
            <div className="text-center mb-6 border-b pb-4">
                <h1 className="text-xl font-bold uppercase tracking-wide">Simulasi Komisi</h1>
                <div className="text-sm text-gray-600">
                    {data.judul || "Simulasi Komisi"}
                </div>
                <div className="text-sm text-gray-600">
                    {data.customer ||""} •{" "}
                    {data.dibuatTanggal ? new Date(data.dibuatTanggal).toLocaleString("id-ID") : "-"}
                </div>
            </div>

            {/* TARGET*/}
            <div className="mb-4">
                <h2 className="font-semibold mb-1"># Target Komisi</h2>
                <table className="w-full border text-sm">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="border px-2 py-1 text-left">Kategori</th>
                        <th className="border px-2 py-1 text-right">Nilai (Rp.)</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.targetGlobal > 0 && (
                        <tr className="border-b">
                            <td className="px-2 py-1 font-medium">Total Target</td>
                            <td className="px-2 py-1 text-right">
                                {data.targetGlobal ? `Rp ${nf(data.targetGlobal)}` : "-"}
                            </td>
                        </tr>
                    )}

                    {Object.entries(data.targetKategori || {}).map(([kat, raw]) => {
                        const type = detectTargetType(raw, hasGlobal)
                        const shown = formatTargetValue(raw, type)
                        return (
                            <tr key={kat} className="border-b">
                                <td className="px-2 py-1">{kat}</td>
                                <td className="px-2 py-1 text-right">{shown}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>

            {/* TABEL PRODUK */}
            <h2 className="font-semibold mb-1"># Detail Produk</h2>
            <table className="w-full border-collapse border text-sm mb-6">
                <thead className="bg-gray-100">
                <tr>
                    <th className="border px-2 py-1 text-left">#</th>
                    <th className="border px-2 py-1 text-left">Kode Item</th>
                    <th className="border px-2 py-1 text-left">Kategori</th>
                    <th className="border px-2 py-1 text-right">Harga</th>
                    <th className="border px-2 py-1 text-right">Qty</th>
                    <th className="border px-2 py-1 text-right">Satuan</th>
                    <th className="border px-2 py-1 text-right">Potensi Komisi</th>
                </tr>
                </thead>
                <tbody>
                {rows.map((r, i) => {
                    const kodeItem = r.kodeItem ?? "-"
                    const namaItem = r.namaItem ?? "-"
                    const satuan = r.satuan ?? "-"
                    const kategori = r.kategori ?? "-"
                    const harga = Number(r.harga || 0)
                    const qty = Number(r.qty || 0)
                    const subtotal = calcPotensiKomisi(r)
                    return (
                        <tr key={r.id || i}>
                            <td className="border px-2 py-1 text-center">{i + 1}</td>
                            <td className="border px-2 py-1">{kodeItem}</td>
                            <td className="border px-2 py-1">{kategori}</td>
                            <td className="border px-2 py-1 text-right">Rp {nf(harga)}</td>
                            <td className="border px-2 py-1 text-right">{nf(qty)}</td>
                            <td className="border px-2 py-1">{satuan}</td>
                            <td className="border px-2 py-1 text-right">Rp {nf(subtotal)}</td>
                        </tr>
                    )
                })}

                {rows.length === 0 && (
                    <tr>
                        <td colSpan={8} className="border px-2 py-2 text-center text-gray-500">
                            Tidak ada item.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            <h2 className="font-semibold mb-1"># Achievement & Komisi</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    {/* Achievement */}
                    {/*<h2 className="font-semibold mb-1">Achievement (%)</h2>*/}
                    <table className="w-full border text-sm">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="border px-2 py-1 text-left">Kategori</th>
                            <th className="border px-2 py-1 text-right">Achievement (%)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {achRows.map((r) => (
                            <tr key={r.kategori} className="border-b">
                                <td className="px-2 py-1">{r.kategori}</td>
                                <td className="px-2 py-1 text-right">{r.achievementPct.toFixed(2)}%</td>
                            </tr>
                        ))}

                        {achRows.length === 0 && (
                            <tr>
                                <td colSpan={2} className="border px-2 py-2 text-center text-gray-500">
                                    Tidak ada data achievement.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
                <div>
                    {/* RINGKASAN KOMISI */}
                    {/*<h2 className="font-semibold mb-1">Rincian Komisi</h2>*/}
                    <table className="w-full border text-sm">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="border px-2 py-1 text-left" colSpan={2}>Keterangan</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td className="border px-2 py-1">Komisi Dasar Total</td>
                            <td className="border px-2 py-1 text-right">Rp {nf(data.komisiDasarTotal)}</td>
                        </tr>
                        <tr>
                            <td className="border px-2 py-1">Bonus Utama</td>
                            <td className="border px-2 py-1 text-right">Rp {nf(data.bonusUtamaTotal)}</td>
                        </tr>
                        <tr>
                            <td className="border px-2 py-1">Bonus Extra</td>
                            <td className="border px-2 py-1 text-right">Rp {nf(data.bonusExtraTotal)}</td>
                        </tr>
                        <tr className="bg-gray-100 font-semibold">
                            <td className="border px-2 py-1">Total </td>
                            <td className="border px-2 py-1 text-right text-blue-600">
                                Rp {nf(data.subtotalTotal)}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>



            {/* FOOTER */}
            <div className="mt-8 text-xs text-gray-500 text-center">
                Dicetak pada {new Date().toLocaleString("id-ID")}
            </div>
        </div>
    )
})

export default PrintSimulasi
