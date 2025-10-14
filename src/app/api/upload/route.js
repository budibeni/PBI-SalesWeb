export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export async function POST(req) {
    try {
        const form = await req.formData()
        const file = form.get("file")
        if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
        if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Tipe file tidak didukung" }, { status: 415 })

        await fs.mkdir(UPLOAD_DIR, { recursive: true })

        const ext = mimeToExt(file.type)
        const name = crypto.randomUUID() + ext
        const filepath = path.join(UPLOAD_DIR, name)

        const buf = Buffer.from(await file.arrayBuffer())
        await fs.writeFile(filepath, buf)

        const url = `/uploads/${name}`
        return NextResponse.json({ ok: true, url, name })
    } catch (e) {
        console.error("Upload error:", e)
        return NextResponse.json({ error: "Gagal upload" }, { status: 500 })
    }
}

function mimeToExt(mime) {
    switch (mime) {
        case "image/jpeg": return ".jpg"
        case "image/png":  return ".png"
        case "image/webp": return ".webp"
        case "image/gif":  return ".gif"
        default:           return ""
    }
}
