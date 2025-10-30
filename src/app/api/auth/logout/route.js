// app/api/auth/logout/route.js
import { NextResponse } from "next/server"

const COOKIE_NAME = "session"

function getOrigin(req) {
    // Prioritaskan header dari reverse proxy
    const xfProto = req.headers.get("x-forwarded-proto")
    const xfHost  = req.headers.get("x-forwarded-host")
    if (xfProto && xfHost) return `${xfProto}://${xfHost}`

    // Fallback ke Host + asumsi proto dari x-forwarded-proto / https
    const host = req.headers.get("host")
    if (host) {
        const proto = xfProto || "https"
        return `${proto}://${host}`
    }

    // Paling terakhir: origin dari req.nextUrl (bisa salah di local/proxy)
    return req.nextUrl?.origin || "https://powerblockindonesia.com"
}

function redirectTo(req, path = "/login") {
    const origin = getOrigin(req)
    const url = new URL(path, origin)
    const res = NextResponse.redirect(url, 303)

    // Hapus cookie (samakan properti dengan saat set cookie login)
    res.cookies.set(COOKIE_NAME, "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: true,           // production via HTTPS: tetap true
        expires: new Date(0),   // pastikan benar-benar dihapus
        maxAge: 0,
    })
    return res
}

export async function POST(req) {
    // optional: dukung query ?next=/ (default /login)
    const next = req.nextUrl.searchParams.get("next") || "/login"
    return redirectTo(req, next)
}

export async function GET(req) {
    const next = req.nextUrl.searchParams.get("next") || "/login"
    return redirectTo(req, next)
}
