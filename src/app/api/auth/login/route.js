// app/api/auth/login/route.js
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { verifyPassword } from "@/lib/crypto"
import { signUserJwt } from "@/lib/jwt"

const isProd = process.env.NODE_ENV === "production"
const COOKIE_NAME = "session"
const SUPER_ACCOUNT = "budibeni" // ⬅️ bypass non-aktif khusus akun ini

function makeSessionCookie(token) {
    return {
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
    }
}
function isFormContentType(ct = "") {
    ct = ct.toLowerCase()
    return ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")
}

export async function POST(req) {
    const ct = req.headers.get("content-type") || ""
    try {
        let identifier, password, redirect

        if (isFormContentType(ct)) {
            const form = await req.formData()
            identifier = form.get("identifier")?.toString().trim()
            password   = form.get("password")?.toString()
            redirect   = form.get("redirect")?.toString() || "/dashboard"
        } else {
            const body = await req.json().catch(() => ({}))
            identifier = body.identifier?.toString().trim()
            password   = body.password?.toString()
            const url  = new URL(req.url)
            redirect   = body.redirect || url.searchParams.get("redirect") || "/dashboard"
        }

        const returnFormError = (msg) => {
            const url = new URL("/login", req.url)
            url.searchParams.set("error", msg)
            if (identifier) url.searchParams.set("identifier", identifier)
            if (redirect)   url.searchParams.set("redirect", redirect)
            return NextResponse.redirect(url, 303)
        }

        if (!identifier || !password) {
            if (isFormContentType(ct)) return returnFormError("Identifier & password wajib")
            return NextResponse.json({ error: "Identifier & password wajib" }, { status: 400 })
        }

        const user = await prisma.tbUser.findFirst({
            where: { OR: [{ email: identifier }, { akun: identifier }] },
            select: {
                id: true, akun: true, email: true, nama: true, role: true,
                passwordHash: true, aktif: true,
            },
        })
        if (!user) {
            if (isFormContentType(ct)) return returnFormError("User tidak ditemukan")
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
        }

        // ⬇️ BYPASS: jika akun adalah SUPER_ACCOUNT, abaikan status non-aktif
        const isBypass = user.akun?.toLowerCase() === SUPER_ACCOUNT
        if (user.aktif === false && !isBypass) {
            if (isFormContentType(ct)) return returnFormError("Akun Anda dinonaktifkan")
            return NextResponse.json({ error: "Akun Anda dinonaktifkan" }, { status: 403 })
        }

        // Guard untuk hash
        if (!user.passwordHash || user.passwordHash.length < 20) {
            const msgDev = "Akun belum memiliki password yang valid. Pastikan kolom `passwordHash` terisi."
            if (isFormContentType(ct)) return returnFormError(isProd ? "Kredensial tidak valid" : msgDev)
            return NextResponse.json({ error: isProd ? "Kredensial tidak valid" : msgDev }, { status: 400 })
        }

        let ok = false
        try {
            ok = await verifyPassword(password, user.passwordHash)
        } catch (e) {
            console.error("verifyPassword error:", e)
            if (isFormContentType(ct)) return returnFormError(isProd ? "Kredensial tidak valid" : "Hash password tidak valid")
            return NextResponse.json({ error: isProd ? "Kredensial tidak valid" : "Hash password tidak valid" }, { status: 400 })
        }
        if (!ok) {
            if (isFormContentType(ct)) return returnFormError("Password salah")
            return NextResponse.json({ error: "Password salah" }, { status: 401 })
        }

        const token = await signUserJwt({
            sub: String(user.id),
            email: user.email,
            akun: user.akun,
            role: user.role,
            nama: user.nama || null,
            aktif: user.aktif ?? true, // tetap encode status asli (false utk non-aktif)
        })

        if (isFormContentType(ct)) {
            const res = NextResponse.redirect(new URL(redirect, req.url), 303)
            res.cookies.set(makeSessionCookie(token))
            return res
        }
        const res = NextResponse.json({ success: true, redirect })
        res.cookies.set(makeSessionCookie(token))
        return res
    } catch (err) {
        console.error("LOGIN ERROR:", err)
        if (isFormContentType(ct)) {
            const url = new URL("/login", req.url)
            url.searchParams.set("error", "Terjadi kesalahan")
            return NextResponse.redirect(url, 303)
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
