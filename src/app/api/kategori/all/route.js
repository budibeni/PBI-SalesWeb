import prisma from "@/lib/db"
import { NextResponse } from "next/server"
import crypto from "crypto"

export const dynamic = "force-dynamic" // selalu ke server
export const revalidate = 0

function makeETag(payload) {
    const hash = crypto.createHash("sha1").update(payload).digest("hex")
    return `"W/${hash}"`
}

export async function GET(req) {
    try {
        const rows = await prisma.tbMasterKomisi.findMany({
            orderBy: { kategori: "asc" },
            // select: {
            //     id: true,
            //     kategori: true,
            //     persentase: true,
            //     minAchBonusUtama: true,
            //     minAchBonusExtra: true,
            //     dibuatTanggal: true,
            //     diubahTanggal: true,
            // },
        })

        const body = JSON.stringify({ success: true, total: rows.length, items: rows })
        const etag = makeETag(body)

        const ifNoneMatch = req.headers.get("if-none-match")
        if (ifNoneMatch && ifNoneMatch === etag) {
            // hemat bandwidth — pakai cache client
            return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "no-store" } })
        }

        return new NextResponse(body, {
            headers: {
                "Content-Type": "application/json",
                ETag: etag,
                "Cache-Control": "no-store",
            },
        })
    } catch (e) {
        console.error("GET /api/kategori/all error:", e)
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
    }
}
