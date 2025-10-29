// app/api/items/bulk/route.js
import {getCurrentUser} from "@/lib/auth-server";

export const runtime = "nodejs"

import prisma from "@/lib/db"
import { NextResponse } from "next/server"

// === Helpers ===
function numOrNull(v) {
    if (v === undefined || v === null || v === "") return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}
function intOrNull(v) {
    const n = numOrNull(v)
    return n === null ? null : Math.round(n)
}
function strOrNull(v) {
    if (v === undefined || v === null) return null
    const s = String(v).trim()
    return s.length ? s : null
}

// === PATCH bulk update ===
export async function PATCH(req) {
    try {
        const body = await req.json()
        const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []

        if (ids.length === 0) {
            return NextResponse.json({ error: "ids wajib diisi" }, { status: 400 })
        }

        const data = {}
        const maybeSet = (key, val, transform = (x) => x) => {
            if (val === undefined || val === null || val === "") return
            const v = transform(val)
            if (v === undefined || v === null || v === "") return
            data[key] = v
        }

        const user = await getCurrentUser()
        const namaUser = user?.akun || user?.nama || user?.email || "system"

        // === Kolom umum ===
        maybeSet("kategori", body.kategori, strOrNull)
        maybeSet("jenisItem", body.jenisItem, strOrNull)
        maybeSet("hpp", body.hpp, intOrNull)
        maybeSet("harga", body.harga, intOrNull)

        // === Kalkulator / konversi ===
        maybeSet("satuan", body.satuan, strOrNull)
        maybeSet("nilaiSatuan", body.nilaiSatuan, numOrNull)
        maybeSet("nilaiKonversi", body.nilaiKonversi, numOrNull)
        maybeSet("satuanKonversi", body.satuanKonversi, strOrNull)

        // === Penggunaan ===
        maybeSet("nilaiPenggunaan", body.nilaiPenggunaan, numOrNull)
        maybeSet("satuanPenggunaan", body.satuanPenggunaan, strOrNull)
        maybeSet("deskripsiPenggunaan", body.deskripsiPenggunaan, strOrNull)

        // === Media ===
        maybeSet("gambarUrl", body.gambarUrl, strOrNull)
        maybeSet("linkWeb", body.linkWeb, strOrNull)

        // === Audit ===
        maybeSet("diubahOleh", namaUser)

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Tidak ada field yang diubah" }, { status: 400 })
        }

        const updated = await prisma.tbMasterItem.updateMany({
            where: { id: { in: ids } },
            data,
        })

        return NextResponse.json({ ok: true, count: updated.count })
    } catch (e) {
        console.error("PATCH /api/items/bulk error:", e)
        return NextResponse.json({ error: "Bulk update gagal" }, { status: 500 })
    }
}
