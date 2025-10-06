// app/items/[id]/calc/page.js
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export default function EditCalcPage() {
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
                satuan: j.satuan || "",
                satuanKonversi: j.satuanKonversi || "",
                faktorKonversi: j.faktorKonversi ?? "",
                nilaiCakupan: j.nilaiCakupan ?? "",
                satuanCakupan: j.satuanCakupan || "",
                jenisCakupan: j.jenisCakupan || "",
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
                    <CardTitle>Edit Item — Kalkulator</CardTitle>
                    <Button asChild variant="outline"><Link href={`/items/${id}/edit`}>Pindah: Umum</Link></Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <div className="font-medium">Konversi</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Satuan (base)"><Input value={f.satuan} onChange={(e)=>set("satuan", e.target.value)} /></Field>
                                <Field label="Satuan Konversi"><Input value={f.satuanKonversi} onChange={(e)=>set("satuanKonversi", e.target.value)} /></Field>
                                <Field label="Faktor Konversi"><Input type="number" step="any" value={f.faktorKonversi} onChange={(e)=>set("faktorKonversi", e.target.value)} /></Field>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="font-medium">Cakupan</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Nilai Cakupan"><Input type="number" step="any" value={f.nilaiCakupan} onChange={(e)=>set("nilaiCakupan", e.target.value)} /></Field>
                                <Field label="Satuan Cakupan"><Input value={f.satuanCakupan} onChange={(e)=>set("satuanCakupan", e.target.value)} /></Field>
                                <Field label="Jenis Cakupan"><Input value={f.jenisCakupan} onChange={(e)=>set("jenisCakupan", e.target.value)} /></Field>
                            </div>
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

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
        </div>
    )
}
