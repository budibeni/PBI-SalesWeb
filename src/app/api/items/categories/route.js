export const runtime = "nodejs"

import prisma from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const rows = await prisma.tbMasterItem.findMany({
            where: { kategori: { not: null } },
            select: { kategori: true },
            distinct: ["kategori"],
            orderBy: { kategori: "asc" },
        })
        const categories = rows.map(r => r.kategori?.trim()).filter(Boolean)
        return NextResponse.json({ categories })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
