// app/api/auth/logout/route.js
import { clearSessionCookie } from "@/lib/cookies"

export async function POST() {
    await clearSessionCookie() // ⬅️ WAJIB await
    return Response.json({ success: true })
}
