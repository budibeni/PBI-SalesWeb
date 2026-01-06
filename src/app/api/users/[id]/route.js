// app/api/users/[id]/route.js
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { normalizeAccess } from "@/lib/access"

function requireAdmin(me) {
    if (!me || me.role !== "admin") {
        throw NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
}

function parseBoolean(v) {
    if (typeof v === "boolean") return v
    if (typeof v === "string") {
        const s = v.toLowerCase()
        if (["true", "1", "yes", "on"].includes(s)) return true
        if (["false", "0", "no", "off"].includes(s)) return false
    }
    return undefined
}

function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export async function PATCH(req, { params }) {
    try {
        const me = await getCurrentUser()
        requireAdmin(me)

        const id = Number(params.id)
        if (!id || Number.isNaN(id)) {
            return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
        }

        // Dukung JSON dan Form
        const ct = (req.headers.get("content-type") || "").toLowerCase()
        const isJson = ct.includes("application/json")
        const body = isJson
            ? await req.json().catch(() => ({}))
            : Object.fromEntries((await req.formData()).entries())

        const data = {}

        // ⚠️ akun TIDAK boleh diubah → abaikan bila dikirim

        // akses: boleh object atau string JSON
        if (body.akses !== undefined) {
            let aksesParsed = undefined
            if (typeof body.akses === "string") {
                const raw = body.akses.trim()
                if (raw !== "") {
                    try {
                        aksesParsed = JSON.parse(raw)
                    } catch {
                        return NextResponse.json({ error: "Field 'akses' harus JSON valid" }, { status: 400 })
                    }
                } else {
                    aksesParsed = {} // kosong → semua false setelah normalize
                }
            } else if (body.akses && typeof body.akses === "object") {
                aksesParsed = body.akses
            } else {
                aksesParsed = {}
            }
            data.akses = normalizeAccess(aksesParsed)
        }

        // role (opsional): turunkan ke lower-case
        if (body.role !== undefined) {
            data.role = String(body.role).toLowerCase()
        }

        // nama/bagian/noHp/email (opsional)
        if (body.nama !== undefined) data.nama = body.nama || null
        if (body.bagian !== undefined) data.bagian = body.bagian || null
        if (body.kategori !== undefined) data.kategori = body.kategori || null
        if (body.noHp !== undefined) data.noHp = body.noHp || null
        if (body.email !== undefined) {
            const email = body.email || null
            if (email && !isValidEmail(email)) {
                return NextResponse.json({ error: "Format email tidak valid" }, { status: 422 })
            }
            data.email = email
        }

        // aktif (opsional)
        if (body.aktif !== undefined) {
            const b = parseBoolean(body.aktif)
            if (b === undefined) {
                return NextResponse.json({ error: "Field 'aktif' harus boolean" }, { status: 422 })
            }
            data.aktif = b
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Tidak ada field untuk diupdate" }, { status: 400 })
        }

        data.diubahOleh = me.email || me.akun || "system"

        const updated = await prisma.tbUser.update({
            where: { id },
            data,
            select: {
                id: true,
                akun: true,
                email: true,
                noHp: true,
                nama: true,
                bagian: true,
                kategori: true,
                role: true,
                akses: true,
                aktif: true,
                diubahOleh: true,
                diubahTanggal: true,
            },
        })

        return NextResponse.json({ success: true, user: updated })
    } catch (e) {
        // Uniq constraint (email/akun/noHp)
        if (e?.code === "P2002") {
            const target = Array.isArray(e.meta?.target) ? e.meta.target.join(", ") : (e.meta?.target || "")
            return NextResponse.json({ error: `Field harus unik: ${target}` }, { status: 409 })
        }
        if (e instanceof NextResponse) return e
        console.error("PATCH /api/users/[id] ERROR:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
