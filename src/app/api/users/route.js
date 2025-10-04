// app/api/users/route.js
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { hashPassword } from "@/lib/crypto"
import { normalizeAccess, defaultAccess } from "@/lib/access"

function requireAdmin(me) {
    if (!me || me.role !== "admin") {
        throw NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
}

export async function GET() {
    try {
        const me = await getCurrentUser()
        requireAdmin(me)

        const users = await prisma.tbUser.findMany({
            orderBy: { dibuatTanggal: "desc" },
            select: {
                id: true, akun: true, email: true, noHp: true, nama: true,
                bagian: true, role: true, akses: true, aktif: true, // ⬅️ aktif
            },
        })
        const data = users.map(u => ({ ...u, akses: normalizeAccess(u.akses) }))
        return NextResponse.json({ users: data })
    } catch (e) {
        if (e instanceof NextResponse) return e
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const me = await getCurrentUser()
        requireAdmin(me)

        const ct = (req.headers.get("content-type") || "").toLowerCase()
        const isJson = ct.includes("application/json")
        const body = isJson
            ? await req.json()
            : Object.fromEntries((await req.formData()).entries())

        const akun     = body.akun?.toString().trim()
        const email    = body.email?.toString().trim()
        const noHp     = body.noHp?.toString().trim()
        const nama     = body.nama?.toString().trim() || null
        const bagian   = body.bagian?.toString().trim() || null
        const role     = (body.role?.toString().trim() || "user").toLowerCase()
        const password = body.password?.toString() || ""

        // aktif: terima boolean/string; default true
        let aktif = body.aktif
        if (typeof aktif === "string") {
            aktif = ["true", "1", "on", "yes"].includes(aktif.toLowerCase())
        }
        if (typeof aktif !== "boolean") aktif = true

        // akses: object atau string JSON
        let aksesRaw = body.akses
        let aksesParsed
        if (typeof aksesRaw === "string") {
            if (aksesRaw.trim() !== "") {
                try { aksesParsed = JSON.parse(aksesRaw) } catch {
                    return NextResponse.json({ error: "Field 'akses' harus JSON valid" }, { status: 400 })
                }
            }
        } else if (aksesRaw && typeof aksesRaw === "object") {
            aksesParsed = aksesRaw
        }
        const akses = normalizeAccess(aksesParsed ?? defaultAccess(false))

        if (!akun || !email || !noHp || !password) {
            return NextResponse.json({ error: "akun, email, noHp, password wajib" }, { status: 400 })
        }
        if (password.length < 8) {
            return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 422 })
        }

        const passwordHash = await hashPassword(password)

        const created = await prisma.tbUser.create({
            data: {
                akun, email, noHp, nama, bagian, role,
                passwordHash,
                akses,
                aktif, // ⬅️ simpan status
                dibuatOleh: me.email || me.akun || "system",
            },
            select: { id: true },
        })

        return NextResponse.json({ success: true, id: created.id })
    } catch (e) {
        if (e.code === "P2002") {
            return NextResponse.json({ error: "akun/email/noHp sudah terpakai" }, { status: 409 })
        }
        if (e instanceof NextResponse) return e
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
