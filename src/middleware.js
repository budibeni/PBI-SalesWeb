// middleware.js
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

const LOGIN = "/login"

// daftar path publik (tanpa login)
const PUBLIC_PATHS = [
    "/login",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
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

export async function middleware(req) {
    const { pathname, search } = req.nextUrl
    const token = req.cookies.get("session")?.value

    // Jika path publik, biarkan lewat (kecuali /login saat sudah login → redirect ke dashboard)
    if (isPublicPath(pathname)) {
        if (pathname.startsWith("/login") && token) {
            try {
                await jwtVerify(token, secret)
                return NextResponse.redirect(new URL("/dashboard", req.url))
            } catch { /* token tidak valid, lanjut ke /login */ }
        }
        return NextResponse.next()
    }

    // Selain PUBLIC_PATHS → WAJIB login
    let authed = false
    if (token) {
        try {
            await jwtVerify(token, secret)
            authed = true
        } catch { authed = false }
    }

    if (!authed) {
        const url = new URL(LOGIN, req.url)
        // bawa kembali ke halaman semula setelah login
        url.searchParams.set("redirect", pathname + search)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

// Matcher: “semua path” kecuali beberapa pola file statis internal.
// (Kalau ragu, biarkan saja seperti ini.)
export const config = {
    matcher: [
        // match everything
        "/:path*",
    ],
}
