export const runtime = "nodejs"

import prisma from "@/lib/db"
import { NextResponse } from "next/server"

function numOrNull(v) {
    if (v === undefined || v === null || v === "") return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}

export async function GET(req) {
    try {
        const url = new URL(req.url)
        const q = (url.searchParams.get("q") || "").trim()
        const cat = (url.searchParams.get("cat") || "").trim()
        const page = Math.max(1, Number(url.searchParams.get("page") || 1))
        const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") || 10)))
        const skip = (page - 1) * pageSize

        const where = {
            ...(q
                ? {
                    OR: [
                        { kodeItem: { contains: q } },
                        { namaItem: { contains: q } },
                        { kategori: { contains: q } },
                        { merek: { contains: q } },
                    ],
                }
                : {}),
            ...(cat ? { kategori: { equals: cat } } : {}),
        }

        const [rows, total] = await Promise.all([
            prisma.tbMasterItem.findMany({
                where,
                orderBy: { dibuatTanggal: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.tbMasterItem.count({ where }),
        ])

        return NextResponse.json({
            items: rows,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const body = await req.json()
        const data = {
            // umum
            kodeItem: String(body.kodeItem || "").trim(),
            namaItem: String(body.namaItem || "").trim(),
            deskripsi: body.deskripsi ?? null,
            kategori: body.kategori ?? null,
            merek: body.merek ?? null,
            harga: Number(body.harga ?? 0),

            // konversi/kalkulator
            satuan: String(body.satuan || "").trim(),
            nilaiSatuan: numOrNull(body.nilaiSatuan),
            nilaiKonversi: numOrNull(body.nilaiKonversi),
            satuanKonversi: body.satuanKonversi ?? null,

            // penggunaan
            nilaiPenggunaan: numOrNull(body.nilaiPenggunaan),
            satuanPenggunaan: body.satuanPenggunaan ?? null,
            deskripsiPenggunaan: body.deskripsiPenggunaan ?? null,

            // komisi
            persentaseKomisi: numOrNull(body.persentaseKomisi),

            dibuatOleh: body.dibuatOleh ?? "system",
        }

        if (!data.kodeItem || !data.namaItem || !data.satuan) {
            return NextResponse.json({ error: "kodeItem, namaItem, satuan wajib." }, { status: 400 })
        }

        const created = await prisma.tbMasterItem.create({ data })
        return NextResponse.json(created, { status: 201 })
    } catch (e) {
        console.error("POST /api/items failed:", e)
        return NextResponse.json({ error: e?.message || "Gagal membuat item" }, { status: 500 })
    }
}
