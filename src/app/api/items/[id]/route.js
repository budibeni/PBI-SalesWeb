export const runtime = "nodejs"

import prisma from "@/lib/db"
import { NextResponse } from "next/server"

function numOrNull(v) {
    if (v === undefined || v === null || v === "") return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}

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

        // umum
        if (body.kodeItem !== undefined) data.kodeItem = String(body.kodeItem).trim()
        if (body.namaItem !== undefined) data.namaItem = String(body.namaItem).trim()
        if (body.deskripsi !== undefined) data.deskripsi = body.deskripsi ?? null
        if (body.kategori !== undefined) data.kategori = body.kategori ?? null
        if (body.merek !== undefined) data.merek = body.merek ?? null
        if (body.harga !== undefined) data.harga = Number(body.harga ?? 0)
        if (body.persentaseKomisi !== undefined) data.persentaseKomisi = numOrNull(body.persentaseKomisi)

        // kalkulator/konversi
        if (body.satuan !== undefined) data.satuan = String(body.satuan).trim()
        if (body.nilaiSatuan !== undefined) data.nilaiSatuan = numOrNull(body.nilaiSatuan)
        if (body.nilaiKonversi !== undefined) data.nilaiKonversi = numOrNull(body.nilaiKonversi)
        if (body.satuanKonversi !== undefined) data.satuanKonversi = body.satuanKonversi ?? null

        // penggunaan
        if (body.nilaiPenggunaan !== undefined) data.nilaiPenggunaan = numOrNull(body.nilaiPenggunaan)
        if (body.satuanPenggunaan !== undefined) data.satuanPenggunaan = body.satuanPenggunaan ?? null
        if (body.deskripsiPenggunaan !== undefined) data.deskripsiPenggunaan = body.deskripsiPenggunaan ?? null

        if (body.diubahOleh !== undefined) data.diubahOleh = body.diubahOleh ?? "system"

        const updated = await prisma.tbMasterItem.update({
            where: { id: params.id },
            data,
        })
        return NextResponse.json(updated)
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Gagal update item" }, { status: 500 })
    }
}

export async function DELETE(_req, { params }) {
    try {
        await prisma.tbMasterItem.delete({ where: { id: params.id } })
        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Gagal hapus item" }, { status: 500 })
    }
}
