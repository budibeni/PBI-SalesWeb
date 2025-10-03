// app/api/me/password/route.js
export const runtime = "nodejs"

import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { verifyPassword, hashPassword } from "@/lib/crypto"
import { signUserJwt } from "@/lib/jwt"
import { setSessionCookie } from "@/lib/cookies"
import { NextResponse } from "next/server"

function isFormContentType(ct = "") {
    return ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")
}

export async function POST(req) {
    try {
        const me = await getCurrentUser()
        if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const ct = req.headers.get("content-type") || ""
        let currentPassword, newPassword, confirm

        if (isFormContentType(ct)) {
            const form = await req.formData()
            currentPassword = form.get("currentPassword")?.toString()
            newPassword     = form.get("newPassword")?.toString()
            confirm         = form.get("confirm")?.toString()
        } else {
            const body = await req.json().catch(() => ({}))
            currentPassword = body.currentPassword
            newPassword     = body.newPassword
            confirm         = body.confirm
        }

        // ⬇️ WAJIB isi current password
        if (!currentPassword) {
            return NextResponse.json({ error: "Kata sandi saat ini wajib diisi" }, { status: 400 })
        }
        if (!newPassword) {
            return NextResponse.json({ error: "Kata sandi baru wajib diisi" }, { status: 400 })
        }
        if (newPassword.length < 8) {
            return NextResponse.json({ error: "Kata sandi baru minimal 8 karakter" }, { status: 422 })
        }
        if (confirm && confirm !== newPassword) {
            return NextResponse.json({ error: "Konfirmasi kata sandi tidak cocok" }, { status: 422 })
        }

        const user = await prisma.tbUser.findUnique({ where: { id: Number(me.sub) } })
        if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

        // ⬇️ Verifikasi kata sandi saat ini
        const ok = await verifyPassword(currentPassword, user.passwordHash)
        if (!ok) return NextResponse.json({ error: "Kata sandi saat ini salah" }, { status: 401 })

        // Cegah pakai kata sandi yang sama
        const sameAsOld = await verifyPassword(newPassword, user.passwordHash)
        if (sameAsOld) {
            return NextResponse.json({ error: "Kata sandi baru tidak boleh sama dengan yang lama" }, { status: 422 })
        }

        // Update hash
        const newHash = await hashPassword(newPassword)
        await prisma.tbUser.update({
            where: { id: user.id },
            data: {
                passwordHash: newHash,
                diubahOleh: me.email || me.akun || "system",
            },
        })

        // Rotate session agar user tetap login
        const token = await signUserJwt({
            sub: String(user.id),
            email: user.email,
            akun: user.akun,
            role: user.role,
            nama: user.nama || null,
        })
        await setSessionCookie(token)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}


// abc123456