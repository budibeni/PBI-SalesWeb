// app/api/me/route.js
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

function safeAkses(a) {
    return a && typeof a === "object" ? a : {}
}

export async function GET() {
    const me = await getCurrentUser()
    if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.tbUser.findUnique({
        where: { id: Number(me.sub) },
        select: {
            id: true,
            akun: true,
            email: true,
            noHp: true,
            nama: true,
            bagian: true,
            role: true,
            akses: true,
            dibuatTanggal: true,
            diubahTanggal: true,
        },
    })

    if (!user) return Response.json({ error: "User tidak ditemukan" }, { status: 404 })
    return Response.json({ ...user, akses: safeAkses(user.akses) })
}

export async function PATCH(req) {
    try {
        const me = await getCurrentUser()
        if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json().catch(() => ({}))
        const payload = {
            email: body.email?.trim(),
            noHp: body.noHp?.trim(),
            nama: body.nama?.trim(),
            bagian: body.bagian?.trim(),
        }
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
        if (Object.keys(payload).length === 0) {
            return Response.json({ error: "Tidak ada perubahan" }, { status: 400 })
        }
        if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            return Response.json({ error: "Format email tidak valid" }, { status: 422 })
        }

        const updated = await prisma.tbUser.update({
            where: { id: Number(me.sub) },
            data: { ...payload, diubahOleh: me.email || me.akun || "system" },
            select: {
                id: true,
                akun: true,
                email: true,
                noHp: true,
                nama: true,
                bagian: true,
                role: true,
                akses: true,
                dibuatTanggal: true,
                diubahTanggal: true,
            },
        })
        return Response.json({ ...updated, akses: safeAkses(updated.akses) })
    } catch (err) {
        if (err?.code === "P2002") {
            const target = (err.meta?.target || []).join(", ")
            return Response.json({ error: `Field harus unik: ${target}` }, { status: 409 })
        }
        console.error("ME PATCH ERROR:", err)
        return Response.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
