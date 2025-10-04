// middleware.js
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getAccessIdByPath, isPublicByAccessItems } from "@/lib/access-map"

const LOGIN = "/login"
const SUPER_ACCOUNT = "budibeni" // bypass non-aktif khusus akun ini

const PUBLIC_PATHS = [
    "/login",
    "/forbidden",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/me",          // penting agar resolveMe tidak loop
    "/api/public",      // namespace API publik
    "/artikel/terbit",  // halaman search artikel publik
    "/baca",            // detail artikel publik
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/_next",
    "/assets",
    "/images",
]

// gabungkan public dinamis (ACCESS_ITEMS.public) + daftar statis
function isPublicPath(pathname) {
    if (isPublicByAccessItems(pathname)) return true
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

// redirect helper + clear cookie bila perlu
function redirectToLogin(req, pathname, search, message) {
    const url = new URL(LOGIN, req.url)
    url.searchParams.set("redirect", pathname + search)
    if (message) url.searchParams.set("error", message) // JANGAN pre-encode; biar URLSearchParams yang encode
    const res = NextResponse.redirect(url)
    // hapus session cookie
    res.cookies.set("session", "", { path: "/", expires: new Date(0) })
    return res
}

// fetch profil terkini (dipakai cek aktif real-time)
async function resolveMe(req) {
    const res = await fetch(new URL("/api/me", req.url), {
        headers: { cookie: req.headers.get("cookie") || "", "cache-control": "no-store" },
    }).catch(() => null)
    if (!res || !res.ok) return null
    return await res.json().catch(() => null)
}

// ambil akses dari me/payload bila ada
async function resolveAkses(req, payload, me) {
    if (me && typeof me.akses === "object") return me.akses
    if (payload?.akses && typeof payload.akses === "object") return payload.akses
    const res = await fetch(new URL("/api/me", req.url), {
        headers: { cookie: req.headers.get("cookie") || "", "cache-control": "no-store" },
    }).catch(() => null)
    if (res && res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data && typeof data.akses === "object") return data.akses
    }
    return {}
}

export async function middleware(req) {
    const { pathname, search } = req.nextUrl
    const token = req.cookies.get("session")?.value

    // 0) Public path → bebas
    if (isPublicPath(pathname)) {
        // khusus /login: bila ada token valid & bukan non-aktif → langsung ke home
        if (pathname.startsWith("/login") && token) {
            try {
                const { payload: p } = await jwtVerify(token, secret)
                const isBypass = p?.akun?.toLowerCase() === SUPER_ACCOUNT
                if (p?.aktif === false && !isBypass) {
                    // token valid tapi non-aktif → jangan redirect; clear cookie & biarkan tetap di /login
                    const res = NextResponse.next()
                    res.cookies.set("session", "", { path: "/", expires: new Date(0) })
                    return res
                }
                return NextResponse.redirect(new URL("/", req.url))
            } catch {
                // token invalid → lanjut ke /login
            }
        }
        return NextResponse.next()
    }

    // 1) Non-public → wajib token
    if (!token) {
        return redirectToLogin(req, pathname, search)
    }

    // 2) Verifikasi JWT
    let payload = null
    try {
        const { payload: p } = await jwtVerify(token, secret)
        payload = p
    } catch {
        return redirectToLogin(req, pathname, search)
    }

    // 3) Blokir akun non-aktif (kecuali SUPER_ACCOUNT)
    const isBypass = payload?.akun?.toLowerCase() === SUPER_ACCOUNT
    if (!isBypass && payload?.aktif === false) {
        return redirectToLogin(req, pathname, search, "Akun dinonaktifkan")
    }

    // cek status real-time (jika dinonaktifkan setelah login)
    const me = await resolveMe(req)
    const isBypassRt = isBypass || (me?.akun?.toLowerCase() === SUPER_ACCOUNT)
    if (!isBypassRt && (!me || me.aktif === false)) {
        return redirectToLogin(req, pathname, search, "Akun dinonaktifkan")
    }

    // 4) Cek akses untuk route protected
    const accessId = getAccessIdByPath(pathname)
    if (!accessId) return NextResponse.next()       // route tidak dipetakan → cukup login
    if (payload?.role === "admin") return NextResponse.next() // admin bebas

    const akses = await resolveAkses(req, payload, me)
    if (!akses?.[accessId]) {
        if (pathname.startsWith("/api/")) {
            return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { "content-type": "application/json" },
            })
        }
        const url = new URL("/forbidden", req.url)
        url.searchParams.set("m", accessId)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = { matcher: ["/:path*"] }
