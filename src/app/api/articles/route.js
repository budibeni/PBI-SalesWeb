export const runtime = "nodejs"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

function requireLogin(me) {
    if (!me) throw NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET(req) {
    try {
        const me = await getCurrentUser()
        requireLogin(me)

        const { searchParams } = new URL(req.url)
        const qRaw = searchParams.get("q") || ""
        const q = qRaw.trim()
        const terbitParam = searchParams.get("terbit")
        const takeParam = parseInt(searchParams.get("take") || "50", 10)
        const skipParam = parseInt(searchParams.get("skip") || "0", 10)

        const where = {}
        if (q) {
            // HAPUS mode: "insensitive" → SQLite tidak support
            where.OR = [
                { judul:   { contains: q } },
                { artikel: { contains: q } },
            ]
        }
        if (terbitParam === "true")  where.terbit = true
        if (terbitParam === "false") where.terbit = false

        const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 1), 200) : 50
        const skip = Number.isFinite(skipParam) ? Math.max(skipParam, 0) : 0

        const [rows, total] = await Promise.all([
            prisma.tbArtikel.findMany({
                where,
                orderBy: { dibuatTanggal: "desc" },
                select: {
                    id: true, judul: true, artikel: true, terbit: true,
                    dibuatOleh: true, diubahOleh: true, dibuatTanggal: true, diubahTanggal: true,
                },
                take,
                skip,
            }),
            prisma.tbArtikel.count({ where }),
        ])

        return NextResponse.json({ articles: rows, total })
    } catch (e) {
        if (e instanceof NextResponse) return e
        console.error("GET /api/articles", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const me = await getCurrentUser()
        requireLogin(me)

        const ct = (req.headers.get("content-type") || "").toLowerCase()
        const isJson = ct.includes("application/json")
        const body = isJson
            ? await req.json().catch(() => ({}))
            : Object.fromEntries((await req.formData()).entries())

        const judul   = body.judul?.toString().trim()
        const artikel = body.artikel?.toString().trim() || ""
        let terbit = false
        if (body.terbit !== undefined) {
            const s = String(body.terbit).toLowerCase()
            terbit = ["true","1","on","yes"].includes(s)
        }

        if (!judul)   return NextResponse.json({ error: "Judul wajib" }, { status: 400 })
        if (!artikel) return NextResponse.json({ error: "Isi artikel wajib" }, { status: 400 })

        const user = await getCurrentUser()
        const namaUser = user?.akun || user?.nama || user?.email || "system"

        const created = await prisma.tbArtikel.create({
            data: {
                judul, artikel, terbit,
                dibuatOleh: namaUser,
            },
            select: { id: true },
        })

        return NextResponse.json({ success: true, id: created.id })
    } catch (e) {
        if (e instanceof NextResponse) return e
        console.error("POST /api/articles", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
