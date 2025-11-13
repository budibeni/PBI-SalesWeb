import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

function pickUserId(user) {
    return user?.sub || user?.email || user?.akun || "unknown"
}

function normalizeId(idRaw) {
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw
    return typeof id === "string" ? id.trim() : String(id ?? "").trim()
}

/**
 * GET /api/simulasi-komisi/[id]
 * Ambil detail milik user login
 */
export async function GET(_req, { params }) {
    try {
        const user = await getCurrentUser()
        if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
        const uid = pickUserId(user)

        const { id: idRaw } = await params
        const id = normalizeId(idRaw)
        if (!id) return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 })

        const data = await prisma.tbSimulasiKomisi.findUnique({ where: { id } })
        if (!data) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 })
        if (data.dibuatOleh !== uid)
            return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })

        return NextResponse.json({ ok: true, data })
    } catch (err) {
        console.error("ERR_GET_ONE:", err)
        return NextResponse.json({ ok: false, error: err.message || "Gagal memuat data" }, { status: 500 })
    }
}

/**
 * PATCH /api/simulasi-komisi/[id]
 * Update sebagian kolom (payload apapun yang dikirim akan ditimpa)
 * Tidak ada perhitungan di server.
 */
export async function PATCH(req, { params }) {
    try {
        const user = await getCurrentUser()
        if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
        const uid = pickUserId(user)

        const { id: idRaw } = await params
        const id = normalizeId(idRaw)
        if (!id) return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 })

        const existing = await prisma.tbSimulasiKomisi.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 })
        if (existing.dibuatOleh !== uid)
            return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })

        const body = await req.json()

        const updated = await prisma.tbSimulasiKomisi.update({
            where: { id },
            data: {
                // meta
                judul: body.judul ?? existing.judul,
                catatan: body.catatan ?? existing.catatan,

                // target & achievement
                targetGlobal: body.targetGlobal ?? existing.targetGlobal,
                targetKategori: body.targetKategori ?? existing.targetKategori,
                achievementKategori: body.achievementKategori ?? existing.achievementKategori,

                // komponen hasil (langsung pakai dari client)
                komisiDasarTotal: body.komisiDasarTotal ?? existing.komisiDasarTotal,
                komisiDasarKategori: body.komisiDasarKategori ?? existing.komisiDasarKategori,

                bonusUtamaTotal: body.bonusUtamaTotal ?? existing.bonusUtamaTotal,
                bonusUtamaKategori: body.bonusUtamaKategori ?? existing.bonusUtamaKategori,

                bonusExtraTotal: body.bonusExtraTotal ?? existing.bonusExtraTotal,
                bonusExtraKategori: body.bonusExtraKategori ?? existing.bonusExtraKategori,

                subtotalTotal: body.subtotalTotal ?? existing.subtotalTotal,

                // snapshot rows
                rowsItem: Array.isArray(body.rowsItem) ? body.rowsItem : (existing.rowsItem || []),

                diubahOleh: uid,
            },
        })

        return NextResponse.json({ ok: true, data: updated })
    } catch (err) {
        console.error("ERR_PATCH:", err)
        return NextResponse.json({ ok: false, error: err.message || "Gagal update" }, { status: 500 })
    }
}

/**
 * DELETE /api/simulasi-komisi/[id]
 * Hapus satu data milik user login
 */
export async function DELETE(_req, { params }) {
    try {
        const user = await getCurrentUser()
        if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
        const uid = pickUserId(user)

        const { id: idRaw } = await params
        const id = normalizeId(idRaw)
        if (!id) return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 })

        const existing = await prisma.tbSimulasiKomisi.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 })
        if (existing.dibuatOleh !== uid)
            return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })

        await prisma.tbSimulasiKomisi.delete({ where: { id } })
        return NextResponse.json({ ok: true, message: "Deleted" })
    } catch (err) {
        console.error("ERR_DELETE_ONE:", err)
        return NextResponse.json({ ok: false, error: err.message || "Gagal menghapus" }, { status: 500 })
    }
}
