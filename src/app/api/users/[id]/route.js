// app/api/users/[id]/route.js
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { normalizeAccess } from "@/lib/access"

function requireAdmin(me) {
    if (!me || me.role !== "admin") {
        throw NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
}

export async function PATCH(req, { params }) {
    try {
        const me = await getCurrentUser()
        requireAdmin(me)

        const id = Number(params.id)
        if (!id) return NextResponse.json({ error: "id invalid" }, { status: 400 })

        const body = await req.json().catch(() => ({}))

        const data = {}
        if (body.akses !== undefined) data.akses = normalizeAccess(body.akses)
        if (body.role) data.role = String(body.role).toLowerCase()
        if (body.nama !== undefined) data.nama = body.nama || null
        if (body.bagian !== undefined) data.bagian = body.bagian || null
        if (body.noHp !== undefined) data.noHp = body.noHp || null
        if (body.email !== undefined) data.email = body.email || null

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "tidak ada field untuk diupdate" }, { status: 400 })
        }

        data.diubahOleh = me.email || me.akun || "system"

        await prisma.tbUser.update({ where: { id }, data })
        return NextResponse.json({ success: true })
    } catch (e) {
        if (e instanceof NextResponse) return e
        console.error(e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
