// app/items/[id]/edit/page.js
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function EditGeneralPage() {
    const router = useRouter()
    const { id } = useParams()
    const [busy, setBusy] = useState(false)
    const [f, setF] = useState(null)
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

    useEffect(() => {
        ;(async () => {
            const res = await fetch(`/api/items/${id}`, { cache: "no-store" })
            const j = await res.json()
            setF({
                // umum
                kodeItem: j.kodeItem || "",
                namaItem: j.namaItem || "",
                deskripsi: j.deskripsi || "",
                hpp: j.hpp ?? "",
                harga: j.harga ?? "",
                satuan: j.satuan || "",
                kategori: j.kategori || "",
                jenisItem: j.jenisItem || "",   // pengganti merek
                // media
                gambarUrl: j.gambarUrl || "",
                linkWeb: j.linkWeb || "",
            })
        })()
    }, [id])

    async function submit(e) {
        e.preventDefault()
        // validasi minimal client-side
        if (!f.kodeItem.trim() || !f.namaItem.trim() || !f.satuan.trim()) {
            alert("Kode Item, Nama Item, dan Satuan wajib diisi.")
            return
        }
        setBusy(true)
        try {
            const res = await fetch(`/api/items/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(f),
            })
            if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                alert(j.error || "Gagal simpan")
                return
            }
            router.replace("/items")
        } finally { setBusy(false) }
    }

    if (!f) return <div className="p-4">Memuat…</div>

    return (
        <div className="p-4">
            <Card className="mx-auto max-w-3xl">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>Edit Item — Umum</CardTitle>
                    <div className="flex gap-2">
                        <Button asChild variant="outline"><Link href={`/items/${id}/calc`}>Pindah: Kalkulator</Link></Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-8">
                        {/* Umum */}
                        <section className="space-y-4">
                            <div>
                                <div className="text-sm font-medium">Informasi Umum</div>
                                <p className="text-xs text-muted-foreground">Data dasar item.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Kode Item" required>
                                    <Input value={f.kodeItem} onChange={(e)=>set("kodeItem", e.target.value)} required />
                                </Field>
                                <Field label="Nama Item" required>
                                    <Input value={f.namaItem} onChange={(e)=>set("namaItem", e.target.value)} required />
                                </Field>
                                <Field label="Deskripsi">
                                    <Input value={f.deskripsi} onChange={(e)=>set("deskripsi", e.target.value)} />
                                </Field>
                                <Field label="Satuan" required>
                                    <Input value={f.satuan} onChange={(e)=>set("satuan", e.target.value)} required />
                                </Field>
                                <Field label="HPP">
                                    <Input type="number" value={f.hpp} onChange={(e)=>set("hpp", e.target.value)} />
                                </Field>
                                <Field label="Harga">
                                    <Input type="number" value={f.harga} onChange={(e)=>set("harga", e.target.value)} />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Kategori">
                                    <Input value={f.kategori} onChange={(e)=>set("kategori", e.target.value)} placeholder="cth: BLOCK / SLAB / BOND / SHIELD" />
                                </Field>
                                <Field label="Jenis Item">
                                    <Input value={f.jenisItem} onChange={(e)=>set("jenisItem", e.target.value)} placeholder="cth: POWER BLOCK" />
                                </Field>
                            </div>
                        </section>

                        <Separator />

                        {/* Media */}
                        <section className="space-y-4">
                            <div>
                                <div className="text-sm font-medium">Media</div>
                                <p className="text-xs text-muted-foreground">URL gambar & tautan produk (opsional).</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Gambar URL">
                                    <Input value={f.gambarUrl} onChange={(e)=>set("gambarUrl", e.target.value)} placeholder="https://..." />
                                </Field>
                                <Field label="Link Web">
                                    <Input value={f.linkWeb} onChange={(e)=>set("linkWeb", e.target.value)} placeholder="https://..." />
                                </Field>
                            </div>

                            {/* Preview kecil bila ada gambar */}
                            {f.gambarUrl ? (
                                <div className="flex items-center gap-3">
                                    <img
                                        src={f.gambarUrl}
                                        alt={f.namaItem || "preview"}
                                        className="h-16 w-16 rounded-md object-cover border"
                                        referrerPolicy="no-referrer"
                                    />
                                    <span className="text-xs text-muted-foreground">Pratinjau gambar</span>
                                </div>
                            ) : null}
                        </section>

                        <CardFooter className="px-0 flex gap-2">
                            <Button type="submit" disabled={busy}>Simpan</Button>
                            <Button asChild variant="outline"><Link href="/items">Batal</Link></Button>
                        </CardFooter>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

function Field({ label, required, children }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}{required ? " *" : ""}</Label>
            {children}
        </div>
    )
}
