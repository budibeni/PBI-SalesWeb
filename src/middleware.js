// middleware.js
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getAccessIdByPath } from "@/lib/access-map"

const LOGIN = "/login"
const SUPER_ACCOUNT = "budibeni" // ⬅️ bypass non-aktif khusus akun ini

const PUBLIC_PATHS = [
    "/login",
    "/forbidden",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/me",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/_next",
    "/assets",
    "/images",
]
function isPublicPath(pathname) {
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

function redirectToLogin(req, pathname, search, message) {
    const url = new URL(LOGIN, req.url)
    url.searchParams.set("redirect", pathname + search)
    if (message) url.searchParams.set("error", message)
    const res = NextResponse.redirect(url)
    res.cookies.set("session", "", { path: "/", expires: new Date(0) })
    return res
}

async function resolveMe(req) {
    const res = await fetch(new URL("/api/me", req.url), {
        headers: { cookie: req.headers.get("cookie") || "", "cache-control": "no-store" },
    }).catch(() => null)
    if (!res || !res.ok) return null
    return await res.json().catch(() => null)
}

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

    if (isPublicPath(pathname)) {
        if (pathname.startsWith("/login") && token) {
            try { await jwtVerify(token, secret); return NextResponse.redirect(new URL("/dashboard", req.url)) } catch {}
        }
        return NextResponse.next()
    }

    if (!token) return redirectToLogin(req, pathname, search)

    let payload = null
    try {
        const { payload: p } = await jwtVerify(token, secret)
        payload = p
    } catch {
        return redirectToLogin(req, pathname, search)
    }

    const isBypass = payload?.akun?.toLowerCase() === SUPER_ACCOUNT

    // ⬇️ hanya blokir jika non-aktif & bukan akun bypass
    if (!isBypass && payload?.aktif === false) {
        return redirectToLogin(req, pathname, search, "Akun%20dinonaktifkan")
    }

    // cek realtime (kalau dinonaktifkan setelah login)
    const me = await resolveMe(req)
    const isBypassRt = isBypass || (me?.akun?.toLowerCase() === SUPER_ACCOUNT)
    if (!isBypassRt && (!me || me.aktif === false)) {
        return redirectToLogin(req, pathname, search, "Akun%20dinonaktifkan")
    }

    // cek akses per route (bypass status ≠ bypass akses)
    const accessId = getAccessIdByPath(pathname)
    if (!accessId) return NextResponse.next()
    if (payload?.role === "admin") return NextResponse.next()

    const akses = await resolveAkses(req, payload, me)
    if (!akses?.[accessId]) {
        if (pathname.startsWith("/api/")) {
            return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
                status: 403, headers: { "content-type": "application/json" },
            })
        }
        const url = new URL("/forbidden", req.url)
        url.searchParams.set("m", accessId)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = { matcher: ["/:path*"] }
