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
    "/api/me",
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

// ✅ penting: akses bisa object atau string JSON
function normalizeAkses(raw) {
    if (raw && typeof raw === "object") return raw
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === "object") return parsed
        } catch {}
    }
    return null
}

function redirectToLogin(req, pathname, search, message) {
    const url = new URL(LOGIN, req.url)
    url.searchParams.set("redirect", pathname + search)
    if (message) url.searchParams.set("error", message)
    const res = NextResponse.redirect(url)
    res.cookies.set("session", "", { path: "/", expires: new Date(0) })
    return res
}

// ✅ timeout lebih longgar untuk production
async function resolveMeSafe(req, timeoutMs = 4000) {
    try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), timeoutMs)

        const res = await fetch(new URL("/api/me", req.url), {
            headers: {
                cookie: req.headers.get("cookie") || "",
                "cache-control": "no-store",
            },
            signal: ctrl.signal,
        }).catch(() => null)

        clearTimeout(t)
        if (!res || !res.ok) return undefined
        const data = await res.json().catch(() => undefined)
        return data
    } catch {
        return undefined
    }
}

// ✅ ambil akses dari me/payload, tapi robust
async function resolveAkses(req, payload, me) {
    const fromMe = normalizeAkses(me?.akses)
    if (fromMe) return fromMe

    const fromToken = normalizeAkses(payload?.akses)
    if (fromToken) return fromToken

    // fallback
    try {
        const res = await fetch(new URL("/api/me", req.url), {
            headers: {
                cookie: req.headers.get("cookie") || "",
                "cache-control": "no-store",
            },
        }).catch(() => null)

        if (res && res.ok) {
            const data = await res.json().catch(() => ({}))
            const a = normalizeAkses(data?.akses)
            if (a) return a
        }
    } catch {}

    return {}
}

const rawSecret = process.env.JWT_SECRET || ""
const secret = rawSecret ? new TextEncoder().encode(rawSecret) : null

export async function middleware(req) {
    const { pathname, search } = req.nextUrl
    const token = req.cookies.get("session")?.value

    // 0) Public
    if (isPublicPath(pathname)) {
        if (pathname.startsWith("/login") && token && secret) {
            try {
                const { payload: p } = await jwtVerify(token, secret)
                const akun = (p?.akun || "").toLowerCase()
                const isBypass = akun === SUPER_ACCOUNT
                const aktifFromToken = asBool(p?.aktif)

                if (!aktifFromToken && !isBypass) {
                    const res = NextResponse.next()
                    res.cookies.set("session", "", { path: "/", expires: new Date(0) })
                    return res
                }
                return NextResponse.redirect(new URL("/", req.url))
            } catch {}
        }
        return NextResponse.next()
    }

    // 1) wajib token
    if (!token) return redirectToLogin(req, pathname, search)
    if (!secret) return redirectToLogin(req, pathname, search)

    // 2) verify jwt
    let payload = null
    try {
        const { payload: p } = await jwtVerify(token, secret)
        payload = p
    } catch {
        return redirectToLogin(req, pathname, search)
    }

    // 3) cek aktif dari token
    const akun = (payload?.akun || "").toLowerCase()
    const isBypass = akun === SUPER_ACCOUNT
    const aktifFromToken = asBool(payload?.aktif)

    if (!isBypass && !aktifFromToken) {
        return redirectToLogin(req, pathname, search, "Akun dinonaktifkan")
    }

    // 3b) cek aktif real-time (soft)
    const me = await resolveMeSafe(req)
    const isBypassRt = isBypass || ((me?.akun || "").toLowerCase() === SUPER_ACCOUNT)
    const aktifFromMe = me?.aktif !== undefined ? asBool(me.aktif) : undefined

    if (!isBypassRt && aktifFromMe === false) {
        return redirectToLogin(req, pathname, search, "Akun dinonaktifkan")
    }

    // 4) cek akses route
    const accessId = getAccessIdByPath(pathname)
    if (!accessId) return NextResponse.next()

    if ((payload?.role || "").toLowerCase() === "admin") {
        return NextResponse.next()
    }

    const akses = await resolveAkses(req, payload, me)
    const allowed = asBool(akses?.[accessId])

    // ✅ LOG PRODUKSI (sementara) — sangat membantu
    // console.log("[AUTH]", { pathname, accessId, allowed, tokenHasAkses: !!payload?.akses, meHasAkses: !!me?.akses })

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
