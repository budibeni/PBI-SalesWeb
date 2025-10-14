export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")

export async function POST(req) {
    try {
        const { url } = await req.json()
        if (!url || !String(url).startsWith("/uploads/")) {
            return NextResponse.json({ error: "URL tidak valid" }, { status: 400 })
        }
        const filename = String(url).replace("/uploads/", "")
        await fs.rm(path.join(UPLOAD_DIR, filename), { force: true })
        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error("delete upload error:", e)
        return NextResponse.json({ error: "Gagal menghapus file" }, { status: 500 })
    }
}
