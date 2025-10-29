import {getCurrentUser} from "@/lib/auth-server";

export const runtime = "nodejs"

import prisma from "@/lib/db"
import { NextResponse } from "next/server"

function numOrNull(v) { if (v==null || v==="") return null; const n=Number(v); return Number.isFinite(n)?n:null }
function strOrNull(v) { if (v==null) return null; const s=String(v).trim(); return s.length?s:null }

export async function GET(_req, { params }) {
    try {
        const row = await prisma.tbMasterKomisi.findUnique({ where: { id: params.id } })
        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json(row)
    } catch (e) {
        console.error("GET /api/komisi/[id] error:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(req, { params }) {
    try {
        const body = await req.json()
        const data = {}

        if (body.kategori !== undefined) {
            const v = strOrNull(body.kategori)
            if (!v) return NextResponse.json({ error: "kategori tidak boleh kosong" }, { status: 400 })
            data.kategori = v
        }

        const user = await getCurrentUser()
        const namaUser = user?.akun || user?.nama || user?.email || "system"

        if (body.persentase !== undefined) data.persentase = numOrNull(body.persentase)
        if (body.minAchBonusUtama !== undefined) data.minAchBonusUtama = numOrNull(body.minAchBonusUtama)
        if (body.minAchBonusExtra !== undefined) data.minAchBonusExtra = numOrNull(body.minAchBonusExtra)
        data.diubahOleh = namaUser

        const updated = await prisma.tbMasterKomisi.update({ where: { id: params.id }, data })
        return NextResponse.json(updated)
    } catch (e) {
        const msg = e?.code === "P2002"
            ? "Gagal update: kategori bentrok (unik)."
            : e?.message || "Gagal update"
        console.error("PATCH /api/komisi/[id] error:", e)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

export async function DELETE(_req, { params }) {
    try {
        await prisma.tbMasterKomisi.delete({ where: { id: params.id } })
        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error("DELETE /api/komisi/[id] error:", e)
        return NextResponse.json({ error: "Gagal hapus" }, { status: 500 })
    }
}
