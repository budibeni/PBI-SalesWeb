// middleware.js
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
// ⬇️ ganti: ambil helper dari file gabunganmu
import { getAccessIdByPath } from "@/lib/access-map"

const LOGIN = "/login"

// Path publik (tanpa login)
const PUBLIC_PATHS = [
    "/login",
    "/forbidden",        // ⬅️ tambahkan agar tidak redirect loop saat diblok
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/me",           // penting agar middleware bisa fetch tanpa loop
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/_next",
    "/assets",
    "/images",
]

// helper: apakah path ini public?
function isPublicPath(pathname) {
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

// Ambil akses dari JWT kalau ada; kalau tidak, fetch /api/me (bawa cookie)
async function resolveAkses(req, payload) {
    if (payload?.akses && typeof payload.akses === "object") {
        return payload.akses
    }
    const meUrl = new URL("/api/me", req.url)
    const res = await fetch(meUrl, {
        headers: {
            cookie: req.headers.get("cookie") || "",
            "cache-control": "no-store",
        },
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

    // 1) Public path → bebas (kecuali /login saat sudah login → redirect /dashboard)
    if (isPublicPath(pathname)) {
        if (pathname.startsWith("/login") && token) {
            try {
                await jwtVerify(token, secret)
                return NextResponse.redirect(new URL("/dashboard", req.url))
            } catch { /* token invalid → biarkan ke /login */ }
        }
        return NextResponse.next()
    }

    // 2) Wajib login untuk sisanya
    if (!token) {
        const url = new URL(LOGIN, req.url)
        url.searchParams.set("redirect", pathname + search)
        return NextResponse.redirect(url)
    }

    // Verifikasi token
    let payload = null
    try {
        const { payload: p } = await jwtVerify(token, secret)
        payload = p
    } catch {
        const url = new URL(LOGIN, req.url)
        url.searchParams.set("redirect", pathname + search)
        return NextResponse.redirect(url)
    }

    // 3) Tentukan id akses untuk path ini
    const accessId = getAccessIdByPath(pathname)
    if (!accessId) {
        // route tidak dipetakan → cukup butuh login
        return NextResponse.next()
    }

    // Admin selalu boleh
    if (payload?.role === "admin") {
        return NextResponse.next()
    }

    // 4) Resolve akses user
    const akses = await resolveAkses(req, payload)

    // 5) Blok jika tidak punya akses
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

export const config = {
    matcher: ["/:path*"],
}
