// app/api/public/articles/route.js
export const runtime = "nodejs"
export const revalidate = 3600 // 1 jam

import { NextResponse } from "next/server"
import prisma from "@/lib/db"

// --- util: seeded RNG & shuffle (deterministik) ---
function xfnv1a(str) {
    let h = 2166136261 >>> 0
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return () => h >>> 0
}
function mulberry32(a) {
    return function () {
        let t = (a += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
function shuffleInPlace(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

export async function GET(req) {
    try {
        const url = new URL(req.url)
        const q = (url.searchParams.get("q") || "").trim()
        const pageParam = Number(url.searchParams.get("page"))
        const pageSizeParam = Number(url.searchParams.get("pageSize"))
        const sort = (url.searchParams.get("sort") || "newest").toLowerCase() // "newest" | "random"
        const seed = url.searchParams.get("seed") || "" // contoh: "2025-10-06"

        const pageSize =
            Number.isFinite(pageSizeParam) && pageSizeParam > 0 && pageSizeParam <= 50
                ? pageSizeParam
                : 10
        const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
        const skip = (page - 1) * pageSize

        const where = {
            terbit: true,
            ...(q
                ? {
                    OR: [
                        { judul: { contains: q } },   // SQLite case-insensitive by default
                        { artikel: { contains: q } },
                    ],
                }
                : {}),
        }

        if (sort === "random") {
            // 1) ambil ID saja (ringan), lalu shuffle deterministik dg seed
            const allIds = (await prisma.tbArtikel.findMany({
                where,
                select: { id: true },
            })).map((r) => r.id)

            // jika 0 hasil, balikan kosong
            const total = allIds.length
            if (total === 0) {
                return NextResponse.json(
                    {
                        articles: [],
                        total: 0,
                        page,
                        pageSize,
                        totalPages: 1,
                    },
                    {
                        headers: {
                            "Cache-Control":
                                "public, s-maxage=3600, stale-while-revalidate=3600",
                        },
                    },
                )
            }

            // seed default kalau kosong -> bikin konsisten per hari
            const effectiveSeed =
                seed || new Date().toISOString().slice(0, 10) // YYYY-MM-DD

            // shuffle deterministik
            const seedInt = xfnv1a(effectiveSeed)()
            const rng = mulberry32(seedInt)
            shuffleInPlace(allIds, rng)

            // ambil potongan sesuai pagination
            const pageIds = allIds.slice(skip, skip + pageSize)

            // fetch data artikel untuk ID yang dipilih
            const rowsUnordered = await prisma.tbArtikel.findMany({
                where: { id: { in: pageIds } },
                select: {
                    id: true,
                    judul: true,
                    artikel: true,
                    dibuatTanggal: true,
                    diubahTanggal: true,
                },
            })

            // urutkan mengikuti urutan pageIds
            const orderMap = new Map(pageIds.map((id, i) => [id, i]))
            const rows = rowsUnordered.sort(
                (a, b) => orderMap.get(a.id) - orderMap.get(b.id),
            )

            return NextResponse.json(
                {
                    articles: rows,
                    total,
                    page,
                    pageSize,
                    totalPages: Math.max(1, Math.ceil(total / pageSize)),
                },
                {
                    headers: {
                        "Cache-Control":
                            "public, s-maxage=3600, stale-while-revalidate=3600",
                    },
                },
            )
        }

        // default: newest (stabil & cepat)
        const [rows, total] = await Promise.all([
            prisma.tbArtikel.findMany({
                where,
                orderBy: { dibuatTanggal: "desc" },
                select: {
                    id: true,
                    judul: true,
                    artikel: true,
                    dibuatTanggal: true,
                    diubahTanggal: true,
                },
                skip,
                take: pageSize,
            }),
            prisma.tbArtikel.count({ where }),
        ])

        return NextResponse.json(
            {
                articles: rows,
                total,
                page,
                pageSize,
                totalPages: Math.max(1, Math.ceil(total / pageSize)),
            },
            {
                headers: {
                    "Cache-Control":
                        "public, s-maxage=3600, stale-while-revalidate=3600",
                },
            },
        )
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
