import {getCurrentUser} from "@/lib/auth-server";

export const runtime = "nodejs"

import prisma from "@/lib/db"
import { NextResponse } from "next/server"

// util lokal (boleh pakai file utils.js kalau mau)
function numOrNull(v) { if (v==null || v==="") return null; const n=Number(v); return Number.isFinite(n)?n:null }
function strOrNull(v) { if (v==null) return null; const s=String(v).trim(); return s.length?s:null }

export async function GET(req) {
    try {
        const url = new URL(req.url)
        const q = (url.searchParams.get("q") || "").trim()
        const page = Math.max(1, Number(url.searchParams.get("page") || 1))
        const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 20)))
        const skip = (page - 1) * pageSize

        const where = q
            ? { OR: [{ kategori: { contains: q, mode: "insensitive" } }] }
            : {}

        const [items, total] = await Promise.all([
            prisma.tbMasterKomisi.findMany({
                where,
                orderBy: { kategori: "asc" },
                skip,
                take: pageSize,
            }),
            prisma.tbMasterKomisi.count({ where }),
        ])

        return NextResponse.json({
            items,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        })
    } catch (e) {
        console.error("GET /api/komisi error:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const body = await req.json()
        const kategori = strOrNull(body.kategori)
        if (!kategori) {
            return NextResponse.json({ error: "kategori wajib diisi" }, { status: 400 })
        }

        const user = await getCurrentUser()
        const namaUser = user?.akun || user?.nama || user?.email || "system"

        const created = await prisma.tbMasterKomisi.create({
            data: {
                kategori,
                persentase: numOrNull(body.persentase), // contoh: 0.004 = 0.4%
                minAchBonusUtama: numOrNull(body.minAchBonusUtama),
                minAchBonusExtra: numOrNull(body.minAchBonusExtra),
                dibuatOleh: namaUser,
            },
        })
        return NextResponse.json(created, { status: 201 })
    } catch (e) {
        const msg = e?.code === "P2002"
            ? "Kategori sudah ada (unik)."
            : e?.message || "Gagal membuat data"
        console.error("POST /api/komisi error:", e)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
