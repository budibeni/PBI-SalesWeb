// app/api/public/articles/route.js
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(req) {
    try {
        const url = new URL(req.url)
        const q = (url.searchParams.get("q") || "").trim()
        const pageParam = Number(url.searchParams.get("page"))
        const pageSizeParam = Number(url.searchParams.get("pageSize"))

        const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 && pageSizeParam <= 50 ? pageSizeParam : 10
        const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
        const skip = (page - 1) * pageSize

        const where = {
            terbit: true,
            ...(q
                ? {
                    OR: [
                        { judul:   { contains: q } }, // SQLite: case-insensitive by default
                        { artikel: { contains: q } },
                    ],
                }
                : {}),
        }

        const [rows, total] = await Promise.all([
            prisma.tbArtikel.findMany({
                where,
                orderBy: { dibuatTanggal: "desc" }, // urut terbaru
                select: {
                    id: true, judul: true, artikel: true,
                    dibuatTanggal: true, diubahTanggal: true,
                },
                skip,
                take: pageSize,
            }),
            prisma.tbArtikel.count({ where }),
        ])

        return NextResponse.json({
            articles: rows,
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
