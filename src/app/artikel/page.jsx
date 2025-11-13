import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import ArticlesManager from "./ui/ArticlesManager"

export const dynamic = "force-dynamic"

export default async function ArtikelPage() {
    const me = await getCurrentUser()
    if (!me) {
        return (
            <main className="p-6">
                <h1 className="text-xl font-semibold">Unauthorized</h1>
                <p className="text-sm text-muted-foreground">Silakan login.</p>
            </main>
        )
    }

    const rows = await prisma.tbArtikel.findMany({
        orderBy: { dibuatTanggal: "desc" },
        select: {
            id: true, judul: true, artikel: true, terbit: true,
            dibuatOleh: true, diubahOleh: true, dibuatTanggal: true, diubahTanggal: true,
        },
    })

    return (
        <main className="p-1">
            <ArticlesManager initialArticles={rows} />
        </main>
    )
}
