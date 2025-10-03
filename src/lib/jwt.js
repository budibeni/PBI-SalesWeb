// lib/jwt.js
import { SignJWT, jwtVerify } from "jose"

const rawSecret = process.env.JWT_SECRET
if (!rawSecret || rawSecret.trim().length < 16) {
    throw new Error("JWT_SECRET tidak diset atau terlalu pendek. Isi di .env dan restart server.")
}
const secret = new TextEncoder().encode(rawSecret.trim())
const expires = process.env.JWT_EXPIRES_IN || "7d"

export async function signUserJwt(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expires)
        .sign(secret)
}

export async function verifyUserJwt(token) {
    try {
        const { payload } = await jwtVerify(token, secret)
        return payload
    } catch {
        return null
    }
}
