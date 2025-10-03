// app/api/me/route.js
export const runtime = "nodejs"

import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

export async function GET() {
    const me = await getCurrentUser()
    if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.tbUser.findUnique({
        where: { id: Number(me.sub) },
        select: {
            id: true,
            akun: true,        // ditampilkan, tapi tidak boleh diubah
            email: true,
            noHp: true,
            nama: true,
            bagian: true,
            role: true,
            dibuatTanggal: true,
            diubahTanggal: true,
        },
    })

    return Response.json(user)
}

export async function PATCH(req) {
    try {
        const me = await getCurrentUser()
        if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json().catch(() => ({}))

        // 🔒 akun TIDAK BOLEH DIUBAH → JANGAN masukkan ke payload
        const payload = {
            email: body.email?.trim(),
            noHp: body.noHp?.trim(),
            nama: body.nama?.trim(),
            bagian: body.bagian?.trim(),
        }

        // buang undefined agar tidak overwrite
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

        if (Object.keys(payload).length === 0) {
            return Response.json({ error: "Tidak ada perubahan" }, { status: 400 })
        }

        // validasi sederhana
        if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            return Response.json({ error: "Format email tidak valid" }, { status: 422 })
        }

        const updated = await prisma.tbUser.update({
            where: { id: Number(me.sub) },
            data: {
                ...payload,
                diubahOleh: me.email || me.akun || "system",
            },
            select: {
                id: true,
                akun: true,
                email: true,
                noHp: true,
                nama: true,
                bagian: true,
                role: true,
                dibuatTanggal: true,
                diubahTanggal: true,
            },
        })

        return Response.json(updated)
    } catch (err) {
        if (err?.code === "P2002") {
            const target = (err.meta?.target || []).join(", ")
            return Response.json({ error: `Field harus unik: ${target}` }, { status: 409 })
        }
        console.error("ME PATCH ERROR:", err)
        return Response.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
