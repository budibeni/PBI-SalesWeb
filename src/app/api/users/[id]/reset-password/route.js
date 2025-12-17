// app/api/users/[id]/reset-password/route.js
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { hashPassword } from "@/lib/crypto"

function requireAdmin(me) {
    if (!me || me.role !== "admin") {
        throw NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
}

export async function POST(req, ctx) {
    try {
        const me = await getCurrentUser()
        requireAdmin(me)

        // 🔑 WAJIB await params (Next.js terbaru)
        const { id } = await ctx.params
        const userId = Number(id)

        if (!userId || Number.isNaN(userId)) {
            return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
        }

        const user = await prisma.tbUser.findUnique({
            where: { id: userId },
            select: { id: true, akun: true, email: true },
        })

        if (!user) {
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
        }

        const passwordPlain = String(user.akun || "")
        if (!passwordPlain) {
            return NextResponse.json({ error: "Akun kosong, tidak bisa reset password" }, { status: 422 })
        }

        const passwordHash = await hashPassword(passwordPlain)

        const updated = await prisma.tbUser.update({
            where: { id: userId },
            data: {
                passwordHash,
                diubahOleh: me.email || me.akun || "system",
            },
            select: {
                id: true,
                akun: true,
                email: true,
                diubahOleh: true,
                diubahTanggal: true,
            },
        })

        return NextResponse.json({
            success: true,
            message: "Password berhasil di-reset (password = akun).",
            user: updated,
        })
    } catch (e) {
        if (e instanceof NextResponse) return e
        console.error("POST /api/users/[id]/reset-password ERROR:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
