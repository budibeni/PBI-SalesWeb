// app/dashboard/page.jsx
import { getCurrentUser } from "@/lib/auth-server"

export const dynamic = "force-dynamic" // optional, supaya selalu dinamis

export default async function Dashboard() {
    const user = await getCurrentUser() // ⬅️ WAJIB await

    return (
        <main style={{ padding: 24 }}>
            <h1>Dashboard</h1>
            <p>
                Halo, <b>{user?.nama || user?.akun || user?.email}</b> (role: {user?.role ?? "?"}).
            </p>
            <form action="/api/auth/logout" method="post">
                <button>Keluar</button>
            </form>

        </main>
    )
}
