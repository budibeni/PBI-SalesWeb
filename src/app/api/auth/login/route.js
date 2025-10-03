// app/api/auth/login/route.js
export const runtime = "nodejs"

import prisma from "@/lib/db"
import { verifyPassword } from "@/lib/crypto"
import { signUserJwt } from "@/lib/jwt"
import { setSessionCookie } from "@/lib/cookies"

export async function POST(req) {
    try {
        const ct = req.headers.get("content-type") || ""
        if (!ct.includes("application/json")) {
            return Response.json({ error: "Content-Type harus application/json" }, { status: 415 })
        }

        let body = {}
        try {
            body = await req.json()
        } catch {
            return Response.json({ error: "Body JSON tidak valid / kosong" }, { status: 400 })
        }

        const { identifier, password } = body
        if (!identifier || !password) {
            return Response.json({ error: "identifier & password wajib" }, { status: 400 })
        }

        const user = await prisma.tbUser.findFirst({
            where: { OR: [{ email: identifier }, { akun: identifier }] },
        })
        if (!user) return Response.json({ error: "User tidak ditemukan" }, { status: 404 })

        const ok = await verifyPassword(password, user.passwordHash)
        if (!ok) return Response.json({ error: "Password salah" }, { status: 401 })

        const token = await signUserJwt({
            sub: String(user.id),
            email: user.email,
            akun: user.akun,
            role: user.role,
            nama: user.nama || null,
        })

        await setSessionCookie(token) // ⬅️ WAJIB await

        return Response.json({ success: true })
    } catch (err) {
        console.error("LOGIN ERROR:", err)
        return Response.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
