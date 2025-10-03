// app/account/page.jsx
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import AccountForm from "./ui/AccountForm"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
    const me = await getCurrentUser()
    if (!me) {
        // sebenarnya tidak akan sampai sini karena middleware sudah proteksi
        return (
            <main className="p-6">
                <p>Tidak berizin.</p>
            </main>
        )
    }

    const user = await prisma.tbUser.findUnique({
        where: { id: Number(me.sub) },
        select: {
            akun: true,
            email: true,
            noHp: true,
            nama: true,
            bagian: true,
            role: true,
        },
    })

    return (
        <main className="p-6 max-w-2xl mx-auto space-y-4">
            <h1 className="text-2xl font-semibold">Edit Akun</h1>
            <p className="text-sm text-muted-foreground">
                Anda masuk sebagai <b>{user?.akun || user?.email}</b> (role: {user?.role}).
            </p>
            <AccountForm initialData={user} />
        </main>
    )
}
