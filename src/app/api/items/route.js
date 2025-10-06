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
        const cat = (url.searchParams.get("cat") || "").trim() // ⬅️ NEW
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
            ...(cat ? { kategori: { equals: cat } } : {}), // ⬅️ NEW
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
            kodeItem: String(body.kodeItem || "").trim(),
            namaItem: String(body.namaItem || "").trim(),
            deskripsi: body.deskripsi ?? null,
            harga: numOrNull(body.harga),
            satuan: String(body.satuan || "").trim(),
            faktorKonversi: numOrNull(body.faktorKonversi),
            satuanKonversi: body.satuanKonversi ?? null,
            nilaiCakupan: numOrNull(body.nilaiCakupan),
            satuanCakupan: body.satuanCakupan ?? null,
            jenisCakupan: body.jenisCakupan ?? null,
            kategori: body.kategori ?? null,
            merek: body.merek ?? null,
            dibuatOleh: body.dibuatOleh ?? "system",
        }

        if (!data.kodeItem || !data.namaItem || !data.satuan) {
            return NextResponse.json({ error: "kodeItem, namaItem, satuan wajib." }, { status: 400 })
        }

        const created = await prisma.tbMasterItem.create({ data })
        return NextResponse.json(created, { status: 201 })
    } catch (e) {
        console.error("POST /api/items failed:", e?.message, e)
        return NextResponse.json({ error: e?.message || "Gagal membuat item" }, { status: 500 })
    }
}
