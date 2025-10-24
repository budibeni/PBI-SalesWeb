import prisma from "@/lib/db"
import BackBar from "./BackBar"
import CopyButton from "@/components/ui/copy-button"   // ⬅️ pakai reusable

export const dynamic = "force-dynamic"

export default async function BacaArtikel({ params }) {
    const { id } = await params
    const row = await prisma.tbArtikel.findUnique({
        where: { id },
        select: { id: true, judul: true, artikel: true, terbit: true, dibuatTanggal: true, diubahTanggal: true }
    })

    if (!row || !row.terbit) {
        return (
            <main className="mx-auto  p-6">
                <BackBar />
                <h1 className="text-xl font-semibold">Artikel tidak ditemukan</h1>
            </main>
        )
    }

    return (
        <main className="mx-auto max-w-5xl p-6">
            <BackBar />

            <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{row.judul}</h1>

                <CopyButton
                   text={`${row.judul}\n\n${row.artikel}`}
                   label="Salin Konten"
                 />
            </div>

            <div className="text-xs text-muted-foreground mt-1">
                Dipublikasikan {new Date(row.dibuatTanggal).toLocaleString()}
                {row.diubahTanggal ? ` • Diperbarui ${new Date(row.diubahTanggal).toLocaleString()}` : ""}
            </div>

            <article className="prose prose-sm dark:prose-invert mt-6 max-w-none whitespace-pre-wrap">
                {row.artikel}
            </article>
        </main>
    )
}
