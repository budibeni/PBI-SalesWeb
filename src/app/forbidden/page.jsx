// app/forbidden/page.jsx
export default function ForbiddenPage({ searchParams }) {
    const m = searchParams?.m
    return (
        <main className="p-6">
            <h1 className="text-xl font-semibold mb-2">Akses Ditolak</h1>
            <p className="text-sm text-muted-foreground">
                Anda tidak memiliki akses untuk halaman{m ? `: ${m}` : ""}.
            </p>
        </main>
    )
}
