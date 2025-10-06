// app/items/[id]/edit/page.js
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

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
                kodeItem: j.kodeItem || "",
                namaItem: j.namaItem || "",
                deskripsi: j.deskripsi || "",
                harga: j.harga ?? "",
                satuan: j.satuan || "",
                kategori: j.kategori || "",
                merek: j.merek || "",
            })
        })()
    }, [id])

    async function submit(e) {
        e.preventDefault()
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
                    <Button asChild variant="outline"><Link href={`/items/${id}/calc`}>Pindah: Kalkulator</Link></Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Kode Item" required><Input value={f.kodeItem} onChange={(e)=>set("kodeItem", e.target.value)} required /></Field>
                            <Field label="Nama Item" required><Input value={f.namaItem} onChange={(e)=>set("namaItem", e.target.value)} required /></Field>
                            <Field label="Satuan" required><Input value={f.satuan} onChange={(e)=>set("satuan", e.target.value)} required /></Field>
                            <Field label="Harga"><Input type="number" value={f.harga} onChange={(e)=>set("harga", e.target.value)} /></Field>
                        </div>

                        <Field label="Deskripsi"><Input value={f.deskripsi} onChange={(e)=>set("deskripsi", e.target.value)} /></Field>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Kategori"><Input value={f.kategori} onChange={(e)=>set("kategori", e.target.value)} /></Field>
                            <Field label="Merek"><Input value={f.merek} onChange={(e)=>set("merek", e.target.value)} /></Field>
                        </div>

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
