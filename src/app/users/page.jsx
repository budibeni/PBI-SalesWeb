// app/users/page.jsx
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import UsersManager from "./ui/UsersManager"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
    const me = await getCurrentUser()
    if (!me || me.role !== "admin") {
        return (
            <main className="p-6">
                <h1 className="text-xl font-semibold">Tidak berizin</h1>
                <p className="text-sm text-muted-foreground">Hanya admin yang dapat mengelola pengguna.</p>
            </main>
        )
    }

    const users = await prisma.tbUser.findMany({
        orderBy: { dibuatTanggal: "desc" },
        select: {
            id: true, akun: true, email: true, noHp: true, nama: true,
            bagian: true, role: true, akses: true, aktif: true, // ⬅️ aktif
        },
    })

    return (
        <main className="p-1">
            <UsersManager initialUsers={users} />
        </main>
    )
}
