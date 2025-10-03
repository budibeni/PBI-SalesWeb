// app/api/auth/login/route.js
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { verifyPassword } from "@/lib/crypto"
import { signUserJwt } from "@/lib/jwt"

const isProd = process.env.NODE_ENV === "production"
const COOKIE_NAME = "session"

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
    return ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")
}

export async function POST(req) {
    try {
        const ct = req.headers.get("content-type") || ""
        let identifier, password, redirect

        if (isFormContentType(ct)) {
            // FORM submit
            const form = await req.formData()
            identifier = form.get("identifier")?.toString().trim()
            password   = form.get("password")?.toString()
            redirect   = form.get("redirect")?.toString() || "/dashboard"
        } else {
            // JSON fetch submit (optional)
            const body = await req.json().catch(() => ({}))
            identifier = body.identifier?.trim()
            password   = body.password
            const url  = new URL(req.url)
            redirect   = body.redirect || url.searchParams.get("redirect") || "/dashboard"
        }

        // helper utk error FORM -> redirect balik ke /login
        const returnFormError = (msg) => {
            const url = new URL("/login", req.url)
            url.searchParams.set("error", msg)
            if (identifier) url.searchParams.set("identifier", identifier)
            if (redirect)   url.searchParams.set("redirect", redirect)
            return NextResponse.redirect(url, 303)
        }

        // Validasi dasar
        if (!identifier || !password) {
            if (isFormContentType(ct)) {
                return returnFormError("Identifier & password wajib")
            }
            return NextResponse.json({ error: "Identifier & password wajib" }, { status: 400 })
        }

        const user = await prisma.tbUser.findFirst({
            where: { OR: [{ email: identifier }, { akun: identifier }] },
        })
        if (!user) {
            if (isFormContentType(ct)) {
                return returnFormError("User tidak ditemukan")
            }
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
        }

        const ok = await verifyPassword(password, user.passwordHash)
        if (!ok) {
            if (isFormContentType(ct)) {
                return returnFormError("Password salah")
            }
            return NextResponse.json({ error: "Password salah" }, { status: 401 })
        }

        // Sukses: set cookie di response dan redirect (FORM) atau JSON (fetch)
        const token = await signUserJwt({
            sub: String(user.id),
            email: user.email,
            akun: user.akun,
            role: user.role,
            nama: user.nama || null,
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
        // FORM: redirect dengan pesan generic
        const ct = req.headers.get("content-type") || ""
        if (isFormContentType(ct)) {
            const url = new URL("/login", req.url)
            url.searchParams.set("error", "Terjadi kesalahan")
            return NextResponse.redirect(url, 303)
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
