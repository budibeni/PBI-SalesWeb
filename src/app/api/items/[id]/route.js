// app/api/items/[id]/route.js
export const runtime = "nodejs"

import prisma from "@/lib/db"
import { NextResponse } from "next/server"

// utils
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

// OPTIONAL: whitelist kategori
// const ALLOWED_KATEGORI = new Set(["BLOCK","SLAB","BOND","SHIELD"])

export async function GET(_req, { params }) {
    try {
        const item = await prisma.tbMasterItem.findUnique({ where: { id: params.id } })
        if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json(item)
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(req, { params }) {
    try {
        const body = await req.json()
        const data = {}

        // — umum —
        if (body.kodeItem !== undefined) {
            const v = String(body.kodeItem).trim()
            if (!v) return NextResponse.json({ error: "kodeItem tidak boleh kosong." }, { status: 400 })
            data.kodeItem = v
        }
        if (body.namaItem !== undefined) {
            const v = String(body.namaItem).trim()
            if (!v) return NextResponse.json({ error: "namaItem tidak boleh kosong." }, { status: 400 })
            data.namaItem = v
        }
        if (body.deskripsi !== undefined) data.deskripsi = strOrNull(body.deskripsi)
        if (body.kategori !== undefined) {
            const v = strOrNull(body.kategori)
            // (opsional) if (v && !ALLOWED_KATEGORI.has(v)) return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 })
            data.kategori = v
        }
        if (body.jenisItem !== undefined) data.jenisItem = strOrNull(body.jenisItem)
        if (body.hpp !== undefined) data.hpp = intOrNull(body.hpp)
        if (body.harga !== undefined) data.harga = intOrNull(body.harga)

        // — kalkulator/konversi —
        if (body.satuan !== undefined) {
            const v = String(body.satuan).trim()
            if (!v) return NextResponse.json({ error: "satuan tidak boleh kosong." }, { status: 400 })
            data.satuan = v
        }
        if (body.nilaiSatuan !== undefined) data.nilaiSatuan = numOrNull(body.nilaiSatuan)
        if (body.nilaiKonversi !== undefined) data.nilaiKonversi = numOrNull(body.nilaiKonversi)
        if (body.satuanKonversi !== undefined) data.satuanKonversi = strOrNull(body.satuanKonversi)

        // — penggunaan —
        if (body.nilaiPenggunaan !== undefined) data.nilaiPenggunaan = numOrNull(body.nilaiPenggunaan)
        if (body.satuanPenggunaan !== undefined) data.satuanPenggunaan = strOrNull(body.satuanPenggunaan)
        if (body.deskripsiPenggunaan !== undefined) data.deskripsiPenggunaan = strOrNull(body.deskripsiPenggunaan)

        // — media —
        if (body.gambarUrl !== undefined) data.gambarUrl = strOrNull(body.gambarUrl)
        if (body.linkWeb !== undefined) data.linkWeb = strOrNull(body.linkWeb)

        // — audit —
        if (body.diubahOleh !== undefined) data.diubahOleh = strOrNull(body.diubahOleh) ?? "system"

        const updated = await prisma.tbMasterItem.update({
            where: { id: params.id },
            data,
        })
        return NextResponse.json(updated)
    } catch (e) {
        // lebih ramah: P2002 (unique violation), P2025 (record not found)
        let status = 500
        let msg = e?.message || "Gagal update item"
        if (e?.code === "P2002") {
            msg = "Gagal update: kodeItem sudah digunakan."
        } else if (e?.code === "P2025") {
            status = 404
            msg = "Item tidak ditemukan."
        }
        console.error(e)
        return NextResponse.json({ error: msg }, { status })
    }
}

export async function DELETE(_req, { params }) {
    try {
        await prisma.tbMasterItem.delete({ where: { id: params.id } })
        // return 204 No Content (opsional)
        return new NextResponse(null, { status: 204 })
    } catch (e) {
        let status = 500
        let msg = "Gagal hapus item"
        if (e?.code === "P2025") {
            status = 404
            msg = "Item tidak ditemukan."
        }
        console.error(e)
        return NextResponse.json({ error: msg }, { status })
    }
}
