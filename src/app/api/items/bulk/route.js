export const runtime = "nodejs"

import prisma from "@/lib/db"
import { NextResponse } from "next/server"

function numOrNull(v) {
    if (v === undefined || v === null || v === "") return undefined // abaikan (tidak update)
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
}

export async function PATCH(req) {
    try {
        const body = await req.json()
        const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []
        if (!ids.length) return NextResponse.json({ error: "ids wajib (array of id)" }, { status: 400 })

        // Bangun data hanya dari field yang diisi
        const data = {}
        if (body.satuan) data.satuan = String(body.satuan).trim()
        if (body.satuanKonversi !== undefined) data.satuanKonversi = body.satuanKonversi || null
        const fk = numOrNull(body.faktorKonversi); if (fk !== undefined) data.faktorKonversi = fk
        const nc = numOrNull(body.nilaiCakupan);  if (nc !== undefined) data.nilaiCakupan  = nc
        if (body.satuanCakupan !== undefined) data.satuanCakupan = body.satuanCakupan || null
        if (body.jenisCakupan  !== undefined) data.jenisCakupan  = body.jenisCakupan  || null
        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Tidak ada field yang diubah" }, { status: 400 })
        }

        const res = await prisma.tbMasterItem.updateMany({
            where: { id: { in: ids } },
            data,
        })

        return NextResponse.json({ updatedCount: res.count })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Gagal bulk update" }, { status: 500 })
    }
}
