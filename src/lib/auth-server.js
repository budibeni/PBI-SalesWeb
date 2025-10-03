// lib/auth-server.js
import { cookies } from "next/headers"
import { verifyUserJwt } from "@/lib/jwt"

// Ambil user dari cookie JWT (dipakai di server component / route)
export async function getCurrentUser() {
    const store = await cookies()
    const token = store.get("session")?.value
    if (!token) return null
    return await verifyUserJwt(token) // { sub, email, akun, role, nama? } | null
}
