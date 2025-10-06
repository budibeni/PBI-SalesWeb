"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export default function NewItemPage() {
    const router = useRouter()
    const [busy, setBusy] = useState(false)
    const [f, setF] = useState({
        kodeItem: "", namaItem: "", deskripsi: "",
        harga: "", satuan: "",
        faktorKonversi: "", satuanKonversi: "",
        nilaiCakupan: "", satuanCakupan: "", jenisCakupan: "",
        kategori: "", merek: "",
    })
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

    async function submit(e) {
        e.preventDefault()
        setBusy(true)
        try {
            const res = await fetch("/api/items", {
                method: "POST",
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

    return (
        <div className="p-4">
            <Card className="mx-auto max-w-3xl">
                <CardHeader><CardTitle>Tambah Item</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Kode Item" required><Input value={f.kodeItem} onChange={(e)=>set("kodeItem", e.target.value)} required /></Field>
                            <Field label="Nama Item" required><Input value={f.namaItem} onChange={(e)=>set("namaItem", e.target.value)} required /></Field>
                            <Field label="Satuan" required><Input value={f.satuan} onChange={(e)=>set("satuan", e.target.value)} required /></Field>
                            <Field label="Harga"><Input type="number" value={f.harga} onChange={(e)=>set("harga", e.target.value)} /></Field>
                        </div>

                        <Field label="Deskripsi"><Input value={f.deskripsi} onChange={(e)=>set("deskripsi", e.target.value)} /></Field>

                        <div className="space-y-2">
                            <div className="font-medium">Konversi (opsional)</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Satuan Konversi"><Input value={f.satuanKonversi} onChange={(e)=>set("satuanKonversi", e.target.value)} /></Field>
                                <Field label="Faktor Konversi"><Input type="number" step="any" value={f.faktorKonversi} onChange={(e)=>set("faktorKonversi", e.target.value)} /></Field>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="font-medium">Cakupan (opsional)</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Nilai Cakupan"><Input type="number" step="any" value={f.nilaiCakupan} onChange={(e)=>set("nilaiCakupan", e.target.value)} /></Field>
                                <Field label="Satuan Cakupan"><Input value={f.satuanCakupan} onChange={(e)=>set("satuanCakupan", e.target.value)} /></Field>
                                <Field label="Jenis Cakupan"><Input value={f.jenisCakupan} onChange={(e)=>set("jenisCakupan", e.target.value)} /></Field>
                            </div>
                        </div>

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
