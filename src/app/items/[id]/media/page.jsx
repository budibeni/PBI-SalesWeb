"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"

export default function EditMediaPage() {
    const router = useRouter()
    const { id } = useParams()

    const [busy, setBusy] = useState(false)         // menyimpan perubahan ke DB
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState(null)

    const [nama, setNama] = useState("")
    const [gambarUrl, setGambarUrl] = useState("")  // url yang akan disimpan
    const [linkWeb, setLinkWeb] = useState("")

    // untuk keperluan replace/hapus setelah simpan
    const originalUrl = useMemo(() => gambarUrl, []) // placeholder; akan di-override setelah fetch

    // simpan URL lama terpisah agar bisa delete setelah replace
    const [beforeUrl, setBeforeUrl] = useState("")   // url saat halaman selesai load

    useEffect(() => {
        let ignore = false
        ;(async () => {
            try {
                setLoading(true)
                const res = await fetch(`/api/items/${id}`, { cache: "no-store" })
                const j = await res.json()
                if (ignore) return
                if (!res.ok) throw new Error(j?.error || "Gagal memuat item")
                setNama(j?.namaItem || "")
                setGambarUrl(j?.gambarUrl || "")
                setBeforeUrl(j?.gambarUrl || "")
                setLinkWeb(j?.linkWeb || "")
                setErr(null)
            } catch (e) {
                setErr(e?.message || "Error")
            } finally {
                if (!ignore) setLoading(false)
            }
        })()
        return () => { ignore = true }
    }, [id])

    async function onPickFile(e) {
        const file = e.target.files?.[0]
        e.target.value = "" // reset agar pilih file yang sama bisa trigger lagi
        if (!file) return

        // validasi dasar ukuran/tipe (opsional)
        const maxSize = 5 * 1024 * 1024 // 5 MB
        if (file.size > maxSize) {
            alert("Ukuran file maksimal 5 MB")
            return
        }

        setUploading(true)
        try {
            const fd = new FormData()
            fd.append("file", file)

            const res = await fetch("/api/upload", { method: "POST", body: fd })
            const j = await res.json()
            if (!res.ok) {
                alert(j?.error || "Upload gagal")
                return
            }
            // set URL baru ke state (belum simpan ke DB)
            setGambarUrl(j.url)
        } finally {
            setUploading(false)
        }
    }

    function isLocal(url) {
        return typeof url === "string" && url.startsWith("/uploads/")
    }

    // Simpan perubahan (replace/hanya set link)
    async function save() {
        setBusy(true)
        try {
            // 1) PATCH item
            const res = await fetch(`/api/items/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gambarUrl: gambarUrl || null,
                    linkWeb: linkWeb || null,
                }),
            })
            const j = await res.json().catch(() => ({}))
            if (!res.ok) {
                alert(j?.error || "Gagal menyimpan")
                return
            }

            // 2) Jika ada file lama lokal dan diganti URL baru → hapus file lama
            if (beforeUrl && gambarUrl && beforeUrl !== gambarUrl && isLocal(beforeUrl)) {
                try {
                    await fetch("/api/upload/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: beforeUrl }),
                    })
                } catch {}
            }

            // update "beforeUrl" agar halaman konsisten
            setBeforeUrl(gambarUrl || "")

            router.replace("/items")
        } finally {
            setBusy(false)
        }
    }

    // Hapus gambar (DB + file lokal jika perlu)
    const [confirmOpen, setConfirmOpen] = useState(false)
    async function deleteImage() {
        setBusy(true)
        try {
            // Hapus file lokal dulu (jika lokal)
            if (gambarUrl && isLocal(gambarUrl)) {
                try {
                    await fetch("/api/upload/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: gambarUrl }),
                    })
                } catch {}
            }
            // Kosongkan kolom di DB
            const res = await fetch(`/api/items/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gambarUrl: null }),
            })
            if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                alert(j?.error || "Gagal menghapus gambar")
                return
            }
            setGambarUrl("")
            setBeforeUrl("")
            setConfirmOpen(false)
        } finally {
            setBusy(false)
        }
    }

    if (loading) return <div className="p-4">Memuat…</div>
    if (err) return <div className="p-4 text-destructive">Error: {err}</div>

    return (
        <div className="p-4">
            <Card className="mx-auto max-w-3xl">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>Edit Item — Media</CardTitle>
                    <div className="flex gap-2">
                        <Button asChild variant="outline"><Link href={`/items/${id}/edit`}>Umum</Link></Button>
                        <Button asChild variant="outline"><Link href={`/items/${id}/calc`}>Kalkulator</Link></Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-8">
                    <section className="space-y-2">
                        <div className="text-sm font-medium">Informasi</div>
                        <p className="text-xs text-muted-foreground">{nama || "—"}</p>
                        <Separator />
                    </section>

                    <section className="space-y-4">
                        <div>
                            <div className="text-sm font-medium">Gambar</div>
                            <p className="text-xs text-muted-foreground">Upload baru untuk mengganti, atau isi URL manual.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Upload Gambar">
                                <Input type="file" accept="image/*" onChange={onPickFile} disabled={uploading || busy} />
                                {uploading && <p className="text-xs text-muted-foreground mt-1">Mengunggah…</p>}
                            </Field>
                            <Field label="Gambar URL">
                                <Input
                                    value={gambarUrl}
                                    onChange={(e)=>setGambarUrl(e.target.value)}
                                    placeholder="/uploads/xxx.jpg atau https://cdn.example.com/img.jpg"
                                    disabled={busy}
                                />
                            </Field>
                        </div>

                        {gambarUrl ? (
                            <div className="flex items-center gap-3">
                                <img
                                    src={gambarUrl}
                                    alt={nama || "preview"}
                                    className="h-24 w-24 rounded-md object-cover border"
                                />
                                <div className="flex flex-col gap-2">
                                    <code className="text-xs break-all">{gambarUrl}</code>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="secondary" asChild>
                                            <a href={gambarUrl} target="_blank" rel="noreferrer">Buka</a>
                                        </Button>

                                        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="outline" disabled={busy}>Hapus</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Hapus gambar?</AlertDialogTitle>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={deleteImage}>Hapus</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">Belum ada gambar yang diset.</p>
                        )}
                    </section>

                    <section className="space-y-4">
                        <div>
                            <div className="text-sm font-medium">Link Web</div>
                            <p className="text-xs text-muted-foreground">Tautan detail produk (opsional).</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Link Web">
                                <Input
                                    value={linkWeb}
                                    onChange={(e)=>setLinkWeb(e.target.value)}
                                    placeholder="https://…"
                                    disabled={busy}
                                />
                            </Field>
                        </div>
                    </section>
                </CardContent>

                <CardFooter className="flex gap-2">
                    <Button onClick={save} disabled={busy}>Simpan</Button>
                    <Button asChild variant="outline"><Link href="/items">Batal</Link></Button>
                </CardFooter>
            </Card>
        </div>
    )
}

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
        </div>
    )
}
