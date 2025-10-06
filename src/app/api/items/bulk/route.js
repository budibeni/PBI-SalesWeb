export const runtime = "nodejs"

import prisma from "@/lib/db"
import { NextResponse } from "next/server"

function numOrNull(v) {
    if (v === undefined || v === null || v === "") return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}

export async function PATCH(req) {
    try {
        const body = await req.json()
        const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []
        if (ids.length === 0) {
            return NextResponse.json({ error: "ids wajib diisi" }, { status: 400 })
        }

        const data = {}
        const maybeSet = (key, val, isNumber = false) => {
            if (val === undefined) return
            if (val === "") return
            data[key] = isNumber ? numOrNull(val) : val
        }

        // kalkulator/konversi
        maybeSet("satuan", body.satuan)
        maybeSet("nilaiSatuan", body.nilaiSatuan, true)
        maybeSet("nilaiKonversi", body.nilaiKonversi, true)
        maybeSet("satuanKonversi", body.satuanKonversi)

        // penggunaan
        maybeSet("nilaiPenggunaan", body.nilaiPenggunaan, true)
        maybeSet("satuanPenggunaan", body.satuanPenggunaan)
        maybeSet("deskripsiPenggunaan", body.deskripsiPenggunaan)

        // komisi
        maybeSet("persentaseKomisi", body.persentaseKomisi, true)

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Tidak ada field yang diubah" }, { status: 400 })
        }

        const updated = await prisma.tbMasterItem.updateMany({
            where: { id: { in: ids } },
            data,
        })

        return NextResponse.json({ count: updated.count })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Bulk update gagal" }, { status: 500 })
    }
}
