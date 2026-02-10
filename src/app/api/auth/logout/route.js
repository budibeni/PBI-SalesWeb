// app/api/auth/logout/route.js
import { NextResponse } from "next/server"

const COOKIE_NAME = "session"

function getProto(req) {
    const xfProto = req.headers.get("x-forwarded-proto")
    if (xfProto) return xfProto.split(",")[0].trim().toLowerCase()
    // nextUrl.protocol = "http:" / "https:"
    return (req.nextUrl?.protocol || "http:").replace(":", "")
}

function getHost(req) {
    const xfHost = req.headers.get("x-forwarded-host")
    if (xfHost) return xfHost.split(",")[0].trim()
    return req.headers.get("host") || req.nextUrl?.host
}

function getOrigin(req) {
    const proto = getProto(req)
    const host = getHost(req)
    if (host) return `${proto}://${host}`
    return req.nextUrl?.origin || "http://localhost:3030"
}

function isHttps(req) {
    return getProto(req) === "https"
}

function clearSessionCookie(res, req) {
    // hapus cookie dengan atribut yg konsisten
    res.cookies.set(COOKIE_NAME, "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: isHttps(req),     // ✅ hanya true kalau HTTPS
        expires: new Date(0),
        maxAge: 0,
    })
}

function redirectTo(req, path = "/login") {
    const origin = getOrigin(req)
    const url = new URL(path, origin)

    const res = NextResponse.redirect(url, 303)
    clearSessionCookie(res, req)
    return res
}

export async function POST(req) {
    const next = req.nextUrl.searchParams.get("next") || "/login"
    return redirectTo(req, next)
}

export async function GET(req) {
    const next = req.nextUrl.searchParams.get("next") || "/login"
    return redirectTo(req, next)
}
