import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

const PROTECTED = ["/dashboard"]   // tambahkan prefix lain bila perlu
const LOGIN = "/login"

export async function middleware(req) {
    const { pathname } = req.nextUrl
    const isProtected = PROTECTED.some(p => pathname.startsWith(p))

    const token = req.cookies.get("session")?.value
    let isAuth = false

    if (token) {
        try {
            await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))
            isAuth = true
        } catch {
            isAuth = false
        }
    }

    if (isProtected && !isAuth) {
        const url = new URL(LOGIN, req.url)
        url.searchParams.set("redirect", pathname)
        return NextResponse.redirect(url)
    }

    if (pathname.startsWith(LOGIN) && isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/dashboard", "/account", "/login"], // perluas sesuai kebutuhan
}
