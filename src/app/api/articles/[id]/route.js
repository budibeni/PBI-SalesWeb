export const runtime = "nodejs"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

function requireLogin(me) {
    if (!me) throw NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

function parseBool(v) {
    if (typeof v === "boolean") return v
    const s = String(v).toLowerCase()
    if (["true","1","on","yes"].includes(s)) return true
    if (["false","0","off","no"].includes(s)) return false
    return undefined
}

export async function GET(_req, { params }) {
    try {
        const me = await getCurrentUser()
        requireLogin(me)

        const id = params.id
        const row = await prisma.tbArtikel.findUnique({
            where: { id },
            select: {
                id: true, judul: true, artikel: true, terbit: true,
                dibuatOleh: true, diubahOleh: true, dibuatTanggal: true, diubahTanggal: true,
            },
        })
        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json({ article: row })
    } catch (e) {
        if (e instanceof NextResponse) return e
        console.error("GET /api/articles/[id]", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(req, { params }) {
    try {
        const me = await getCurrentUser()
        requireLogin(me)

        const id = params.id
        const ct = (req.headers.get("content-type") || "").toLowerCase()
        const isJson = ct.includes("application/json")
        const body = isJson
            ? await req.json().catch(() => ({}))
            : Object.fromEntries((await req.formData()).entries())

        const data = {}
        if (body.judul !== undefined)   data.judul = String(body.judul).trim()
        if (body.artikel !== undefined) data.artikel = String(body.artikel).trim()
        if (body.terbit !== undefined) {
            const b = parseBool(body.terbit)
            if (b === undefined) return NextResponse.json({ error: "terbit harus boolean" }, { status: 422 })
            data.terbit = b
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 })
        }
        const user = await getCurrentUser()
        data.diubahOleh = user?.akun || user?.nama || user?.email || "system"

        const updated = await prisma.tbArtikel.update({
            where: { id },
            data,
            select: {
                id: true, judul: true, artikel: true, terbit: true,
                dibuatOleh: true, diubahOleh: true, dibuatTanggal: true, diubahTanggal: true,
            },
        })
        return NextResponse.json({ success: true, article: updated })
    } catch (e) {
        if (e instanceof NextResponse) return e
        console.error("PATCH /api/articles/[id]", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
