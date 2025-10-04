// app/api/auth/login/route.js
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { verifyPassword } from "@/lib/crypto"
import { signUserJwt } from "@/lib/jwt"

const isProd = process.env.NODE_ENV === "production"
const COOKIE_NAME = "session"
const SUPER_ACCOUNT = "budibeni" // bypass non-aktif khusus akun ini

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
    return (
        ct.includes("application/x-www-form-urlencoded") ||
        ct.includes("multipart/form-data")
    )
}

// 🔑 Ambil origin yang dipakai browser (prioritaskan proxy headers / Origin)
function getOrigin(req) {
    const h = req.headers
    const xfProto = h.get("x-forwarded-proto")
    const xfHost  = h.get("x-forwarded-host")
    if (xfProto && xfHost) return `${xfProto}://${xfHost}`

    const origin = h.get("origin")
    if (origin) return origin

    // fallback terakhir: dari req.url (bisa "localhost" di sebagian setup dev)
    return new URL(req.url).origin
}

// helper buat bikin absolute URL dari path relatif + query
function absUrlFromOrigin(origin, path, query = {}) {
    const u = new URL(path, origin)
    for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) u.searchParams.set(k, String(v))
    }
    return u
}

export async function POST(req) {
    const ct = req.headers.get("content-type") || ""
    try {
        let identifier, password
        const SAFE_REDIRECT = "/"           // tujuan sukses
        const origin = getOrigin(req)       // <<— kunci anti "localhost"

        if (isFormContentType(ct)) {
            const form = await req.formData()
            identifier = form.get("identifier")?.toString().trim()
            password   = form.get("password")?.toString()
        } else {
            const body = await req.json().catch(() => ({}))
            identifier = body.identifier?.toString().trim()
            password   = body.password?.toString()
        }

        // helper error utk FORM → redirect balik ke /login (absolute via origin)
        const returnFormError = (msg) => {
            return NextResponse.redirect(
                absUrlFromOrigin(origin, "/login", {
                    error: msg,
                    identifier,
                    redirect: SAFE_REDIRECT,
                }),
                303
            )
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

        const isBypass = (user.akun || "").toLowerCase() === SUPER_ACCOUNT
        if (user.aktif === false && !isBypass) {
            if (isFormContentType(ct)) return returnFormError("Akun Anda dinonaktifkan")
            return NextResponse.json({ error: "Akun Anda dinonaktifkan" }, { status: 403 })
        }

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
            aktif: user.aktif ?? true,
        })

        // FORM submit → Redirect 303 ke "/" (absolute menggunakan origin dari header)
        if (isFormContentType(ct)) {
            const res = NextResponse.redirect(absUrlFromOrigin(origin, SAFE_REDIRECT), 303)
            res.cookies.set(makeSessionCookie(token))
            return res
        }

        // JSON submit → balikan path saja; klien yang navigate (origin tetap milik klien)
        const res = NextResponse.json({ success: true, redirect: SAFE_REDIRECT })
        res.cookies.set(makeSessionCookie(token))
        return res
    } catch (err) {
        console.error("LOGIN ERROR:", err)
        const origin = getOrigin(req)
        if (isFormContentType(ct)) {
            return NextResponse.redirect(
                absUrlFromOrigin(origin, "/login", { error: "Terjadi kesalahan" }),
                303
            )
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
