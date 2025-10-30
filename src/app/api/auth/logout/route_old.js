import { NextResponse } from "next/server"

const isProd = process.env.NODE_ENV === "production"
const COOKIE_NAME = "session"

export async function POST(req) {
    const res = NextResponse.redirect(new URL("/login", req.url), 303)
    res.cookies.set({
        name: COOKIE_NAME,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 0,
    })
    return res
}

export async function GET(req) {
    const res = NextResponse.redirect(new URL("/login", req.url), 303)
    res.cookies.set({
        name: COOKIE_NAME,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 0,
    })
    return res
}
