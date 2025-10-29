// app/api/items/route.js
import {getCurrentUser} from "@/lib/auth-server";

export const runtime = "nodejs"

import prisma from "@/lib/db"
import { NextResponse } from "next/server"

// utils
function numOrNull(v) {
    if (v === undefined || v === null || v === "") return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}
function intOrNull(v) {
    const n = numOrNull(v)
    return n === null ? null : Math.round(n)
}
function strOrNull(v) {
    if (v === undefined || v === null) return null
    const s = String(v).trim()
    return s.length ? s : null
}

// OPTIONAL: whitelist kategori
// const ALLOWED_KATEGORI = new Set(["BLOCK","SLAB","BOND","SHIELD"])

export async function GET(req) {
    try {
        const url = new URL(req.url)
        const q = (url.searchParams.get("q") || "").trim()
        const cat = (url.searchParams.get("cat") || "").trim()
        const page = Math.max(1, Number(url.searchParams.get("page") || 1))
        const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") || 10)))
        const skip = (page - 1) * pageSize

        // Catatan: tanpa mode: "insensitive" agar aman di SQLite
        const where = {
            ...(q
                ? {
                    OR: [
                        { kodeItem: { contains: q } },
                        { namaItem: { contains: q } },
                        { kategori: { contains: q } },
                        { jenisItem: { contains: q } },
                        { deskripsi: { contains: q } },
                    ],
                }
                : {}),
            ...(cat ? { kategori: { equals: cat } } : {}),
        }

        const [items, total] = await Promise.all([
            prisma.tbMasterItem.findMany({
                where,
                orderBy: { dibuatTanggal: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.tbMasterItem.count({ where }),
        ])

        return NextResponse.json({
            items,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const body = await req.json()
        const user = await getCurrentUser()
        const namaUser = user?.akun || user?.nama || user?.email || "system"

        const data = {
            // umum
            kodeItem: String(body.kodeItem || "").trim(),
            namaItem: String(body.namaItem || "").trim(),
            deskripsi: strOrNull(body.deskripsi),
            kategori: strOrNull(body.kategori),
            jenisItem: strOrNull(body.jenisItem),
            hpp: intOrNull(body.hpp),
            harga: intOrNull(body.harga),

            // konversi/kalkulator
            satuan: String(body.satuan || "").trim(),
            nilaiSatuan: numOrNull(body.nilaiSatuan),
            nilaiKonversi: numOrNull(body.nilaiKonversi),
            satuanKonversi: strOrNull(body.satuanKonversi),

            // penggunaan
            nilaiPenggunaan: numOrNull(body.nilaiPenggunaan),
            satuanPenggunaan: strOrNull(body.satuanPenggunaan),
            deskripsiPenggunaan: strOrNull(body.deskripsiPenggunaan),

            // media
            gambarUrl: strOrNull(body.gambarUrl),
            linkWeb: strOrNull(body.linkWeb),

            dibuatOleh: namaUser,
        }

        // validasi minimal
        if (!data.kodeItem || !data.namaItem || !data.satuan) {
            return NextResponse.json(
                { error: "Field kodeItem, namaItem, dan satuan wajib diisi." },
                { status: 400 }
            )
        }

        const created = await prisma.tbMasterItem.create({ data })
        return NextResponse.json(created, { status: 201 })
    } catch (e) {
        const msg =
            e?.code === "P2002"
                ? "Kode item sudah dipakai."
                : e?.message || "Gagal membuat item"
        console.error("POST /api/items failed:", e)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
