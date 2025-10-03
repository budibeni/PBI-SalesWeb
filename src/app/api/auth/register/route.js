import prisma from "@/lib/db"
import { hashPassword } from "@/lib/crypto"

export async function POST(req) {
    const { email, akun, noHp, password, nama } = await req.json()

    if (!email || !akun || !noHp || !password) {
        return Response.json({ error: "email, akun, noHp, password wajib" }, { status: 400 })
    }

    const dupe = await prisma.tbUser.findFirst({
        where: { OR: [{ email }, { akun }, { noHp }] }
    })
    if (dupe) return Response.json({ error: "akun/email/noHp sudah terpakai" }, { status: 409 })

    const passwordHash = await hashPassword(password)
    const user = await prisma.tbUser.create({
        data: { email, akun, noHp, nama, passwordHash }
    })

    return Response.json({ id: user.id, email: user.email, akun: user.akun })
}
