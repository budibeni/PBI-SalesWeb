import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const email = "budibeni@gmail.com"
    const akun = "budibeni"
    const noHp = "087884233604"
    const password = "Rahasia"
    const kategori = "RETAIL"
    const hash = await bcrypt.hash(password, 10)

    await prisma.tbUser.upsert({
        where: { email },
        update: {},
        create: {
            email,
            akun,
            noHp,
            kategori,
            nama: "Budi Beni",
            passwordHash: hash,
            role: "admin",
        },
    })

    console.log("Seeded admin:", { email, akun, password })
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
