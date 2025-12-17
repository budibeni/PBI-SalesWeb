// middleware.js
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getAccessIdByPath, isPublicByAccessItems } from "@/lib/access-map"

const LOGIN = "/login"
const SUPER_ACCOUNT = "budibeni"

const PUBLIC_PATHS = [
    "/login",
    "/forbidden",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/me",          // tetap public agar client bisa panggil
    "/api/public",
    "/artikel/terbit",
    "/baca",
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

function asBool(v) {
    if (typeof v === "boolean") return v
    if (typeof v === "number") return v === 1
    if (typeof v === "string") {
        const s = v.trim().toLowerCase()
        return s === "1" || s === "true"
    }
    return false
}

function normalizeAkses(raw) {
    if (raw && typeof raw === "object") return raw
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === "object") return parsed
        } catch {}
    }
    return {}
}

function redirectToLogin(req, pathname, search, message) {
    const url = new URL(LOGIN, req.url)
    url.searchParams.set("redirect", pathname + search)
    if (message) url.searchParams.set("error", message)

    const res = NextResponse.redirect(url)
    res.cookies.set("session", "", { path: "/", expires: new Date(0) })
    return res
}

const rawSecret = process.env.JWT_SECRET || ""
const secret = rawSecret ? new TextEncoder().encode(rawSecret) : null

export async function middleware(req) {
    const { pathname, search } = req.nextUrl
    const token = req.cookies.get("session")?.value

    // 0) Public path
    if (isPublicPath(pathname)) {
        if (pathname.startsWith("/login") && token && secret) {
            try {
                const { payload } = await jwtVerify(token, secret)
                const akun = (payload?.akun || "").toLowerCase()
                const aktif = asBool(payload?.aktif)
                if (aktif || akun === SUPER_ACCOUNT) {
                    return NextResponse.redirect(new URL("/", req.url))
                }
            } catch {}
        }
        return NextResponse.next()
    }

    // 1) Wajib token
    if (!token) return redirectToLogin(req, pathname, search)
    if (!secret) return redirectToLogin(req, pathname, search)

    // 2) Verify JWT
    let payload = null
    try {
        const { payload: p } = await jwtVerify(token, secret)
        payload = p
    } catch {
        return redirectToLogin(req, pathname, search)
    }

    // 3) Blokir non-aktif (kecuali super)
    const akun = (payload?.akun || "").toLowerCase()
    const isBypass = akun === SUPER_ACCOUNT
    const aktifFromToken = asBool(payload?.aktif)
    if (!isBypass && !aktifFromToken) {
        return redirectToLogin(req, pathname, search, "Akun dinonaktifkan")
    }

    // 4) Cek akses untuk route protected
    const accessId = getAccessIdByPath(pathname)
    if (!accessId) return NextResponse.next()

    if ((payload?.role || "").toLowerCase() === "admin") {
        return NextResponse.next()
    }

    // ✅ AKSES DIAMBIL DARI JWT (bukan /api/me)
    const akses = normalizeAkses(payload?.akses)
    const allowed = asBool(akses?.[accessId])

    if (!allowed) {
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
