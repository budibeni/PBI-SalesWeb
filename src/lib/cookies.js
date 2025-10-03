// lib/cookies.js
import { cookies } from "next/headers"

const COOKIE_NAME = "session"
const isProd = process.env.NODE_ENV === "production"

// Set cookie session (dipanggil saat login)
export async function setSessionCookie(token) {
    const store = await cookies() // ⬅️ wajib await
    store.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
    })
}

// Hapus cookie session (dipanggil saat logout)
export async function clearSessionCookie() {
    const store = await cookies() // ⬅️ wajib await
    store.set({
        name: COOKIE_NAME,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 0,
    })
}

// (opsional) helper kalau kamu butuh ambil token mentah
export async function getSessionCookie() {
    const store = await cookies() // ⬅️ wajib await
    return store.get(COOKIE_NAME)?.value
}
