import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

/**
 * 🔒 Helper untuk ambil ID unik user login
 */
function pickUserId(user) {
    return user?.sub || user?.email || user?.akun || "unknown"
}

/**
 * 🧩 GET: ambil semua data milik user login
 */
export async function GET() {
    try {
        const user = await getCurrentUser()
        if (!user)
            return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })

        const uid = pickUserId(user)

        const data = await prisma.tbSimulasiKomisi.findMany({
            where: { dibuatOleh: uid },
            orderBy: { dibuatTanggal: "desc" },
            select: {
                id: true,
                judul: true,
                customer: true,
                subtotalTotal: true,
                komisiDasarTotal: true,
                bonusUtamaTotal: true,
                bonusExtraTotal: true,
                dibuatTanggal: true,
                diubahTanggal: true,
            },
        })

        return NextResponse.json({ ok: true, data })
    } catch (err) {
        console.error("ERR_GET_SIMULASI:", err)
        return NextResponse.json({ ok: false, error: err.message || "Gagal memuat data" }, { status: 500 })
    }
}

/**
 * 🧩 POST: simpan simulasi baru (frontend sudah hitung semua nilai)
 */
export async function POST(req) {
    try {
        const user = await getCurrentUser()
        if (!user)
            return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })

        const uid = pickUserId(user)
        const body = await req.json()

        const created = await prisma.tbSimulasiKomisi.create({
            data: {
                judul: body.judul ?? "Simulasi Komisi",
                customer: body.customer ?? null,
                catatan: body.catatan ?? null,

                targetGlobal: body.targetGlobal ?? null,
                targetKategori: body.targetKategori ?? {},
                achievementKategori: body.achievementKategori ?? {},

                komisiDasarTotal: body.komisiDasarTotal ?? 0,
                komisiDasarKategori: body.komisiDasarKategori ?? {},

                bonusUtamaTotal: body.bonusUtamaTotal ?? 0,
                bonusUtamaKategori: body.bonusUtamaKategori ?? {},

                bonusExtraTotal: body.bonusExtraTotal ?? 0,
                bonusExtraKategori: body.bonusExtraKategori ?? {},

                subtotalTotal: body.subtotalTotal ?? 0,
                rowsItem: body.rowsItem ?? [],

                dibuatOleh: uid,
                diubahOleh: uid,
            },
        })

        return NextResponse.json({ ok: true, data: created }, { status: 201 })
    } catch (err) {
        console.error("ERR_CREATE_SIMULASI:", err)
        return NextResponse.json({ ok: false, error: err.message || "Gagal menyimpan" }, { status: 500 })
    }
}

/**
 * 🧩 DELETE: hapus data berdasarkan ID milik user login
 * Request body: { id: "xxxxx" }
 */
export async function DELETE(req) {
    try {
        const user = await getCurrentUser()
        if (!user)
            return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })

        const uid = pickUserId(user)
        const { id } = await req.json()

        if (!id)
            return NextResponse.json({ ok: false, error: "ID tidak diberikan" }, { status: 400 })

        // Pastikan data milik user login
        const existing = await prisma.tbSimulasiKomisi.findUnique({ where: { id } })
        if (!existing)
            return NextResponse.json({ ok: false, error: "Data tidak ditemukan" }, { status: 404 })
        if (existing.dibuatOleh !== uid)
            return NextResponse.json({ ok: false, error: "Tidak diizinkan menghapus data orang lain" }, { status: 403 })

        await prisma.tbSimulasiKomisi.delete({ where: { id } })

        return NextResponse.json({ ok: true, message: "Data berhasil dihapus" })
    } catch (err) {
        console.error("ERR_DELETE_SIMULASI:", err)
        return NextResponse.json({ ok: false, error: err.message || "Gagal menghapus" }, { status: 500 })
    }
}
