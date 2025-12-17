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

// === Utils ===
function isPublicPath(pathname) {
    if (isPublicByAccessItems(pathname)) return true
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

// Normalisasi flag aktif: dukung 1/0, "1"/"0", "true"/"false", boolean
function asBool(v) {
    if (typeof v === "boolean") return v
    if (typeof v === "number") return v === 1
    if (typeof v === "string") {
        const s = v.trim().toLowerCase()
        return s === "1" || s === "true"
    }
    return false
}

// redirect helper + clear cookie bila perlu
function redirectToLogin(req, pathname, search, message) {
    const url = new URL(LOGIN, req.url)
    url.searchParams.set("redirect", pathname + search)
    if (message) url.searchParams.set("error", message) // biar URLSearchParams yang encode
    const res = NextResponse.redirect(url)
    // hapus session cookie
    res.cookies.set("session", "", { path: "/", expires: new Date(0) })
    return res
}

// fetch profil terkini (dipakai cek aktif real-time) — soft, ada timeout
async function resolveMeSafe(req, timeoutMs = 1000) {
    try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), timeoutMs)
        const res = await fetch(new URL("/api/me", req.url), {
            headers: { cookie: req.headers.get("cookie") || "", "cache-control": "no-store" },
            signal: ctrl.signal,
        }).catch(() => null)
        clearTimeout(t)
        if (!res || !res.ok) return undefined // UNKNOWN → jangan dianggap non-aktif
        const data = await res.json().catch(() => undefined)
        return data // { akun, aktif, akses?, ... } | undefined
    } catch {
        return undefined // UNKNOWN
    }
}

// ambil akses dari me/payload bila ada
async function resolveAkses(req, payload, me) {
    if (me && typeof me.akses === "object") return me.akses
    if (payload?.akses && typeof payload.akses === "object") return payload.akses
    // fallback coba panggil /api/me lagi (boleh gagal; ini tidak memblokir)
    try {
        const res = await fetch(new URL("/api/me", req.url), {
            headers: { cookie: req.headers.get("cookie") || "", "cache-control": "no-store" },
        }).catch(() => null)
        if (res && res.ok) {
            const data = await res.json().catch(() => ({}))
            if (data && typeof data.akses === "object") return data.akses
        }
    } catch {}
    return {}
}

const rawSecret = process.env.JWT_SECRET || ""
const secret = rawSecret ? new TextEncoder().encode(rawSecret) : null

export async function middleware(req) {
    const { pathname, search } = req.nextUrl
    const token = req.cookies.get("session")?.value

    // 0) Public path → bebas
    if (isPublicPath(pathname)) {
        // khusus /login: bila ada token valid & bukan non-aktif → langsung ke home
        if (pathname.startsWith("/login") && token && secret) {
            try {
                const { payload: p } = await jwtVerify(token, secret)
                const akun = (p?.akun || "").toLowerCase()
                const isBypass = akun === SUPER_ACCOUNT
                const aktifFromToken = asBool(p?.aktif)
                if (!aktifFromToken && !isBypass) {
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

    // Jika secret tidak ada di env (kasus salah konfigurasi production)
    if (!secret) {
        // anggap tidak login supaya jelas
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

    // 3) Blokir akun non-aktif (kecuali SUPER_ACCOUNT) — berdasarkan TOKEN
    const akun = (payload?.akun || "").toLowerCase()
    const isBypass = akun === SUPER_ACCOUNT
    const aktifFromToken = asBool(payload?.aktif)
    if (!isBypass && !aktifFromToken) {
        return redirectToLogin(req, pathname, search, "Akun dinonaktifkan")
    }

    // 3b) Cek status real-time (soft check)
    // Jika panggilan /api/me berhasil dan PASTI non-aktif → blokir.
    // Jika gagal/timeout (undefined), jangan blokir.
    const me = await resolveMeSafe(req)
    const isBypassRt = isBypass || ((me?.akun || "").toLowerCase() === SUPER_ACCOUNT)
    const aktifFromMe = me?.aktif !== undefined ? asBool(me.aktif) : undefined
    if (!isBypassRt && aktifFromMe === false) {
        return redirectToLogin(req, pathname, search, "Akun dinonaktifkan")
    }

    // 4) Cek akses untuk route protected
    const accessId = getAccessIdByPath(pathname)
    if (!accessId) return NextResponse.next()                  // route tidak dipetakan → cukup login
    if ((payload?.role || "").toLowerCase() === "admin") {
        return NextResponse.next()                               // admin bebas
    }

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
