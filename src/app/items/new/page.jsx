// app/items/new/page.js

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import NumericInput from "@/components/ui/NumericInput";

export default function NewItemPage() {
    const router = useRouter()
    const [busy, setBusy] = useState(false)

    const [f, setF] = useState({
        // Umum
        kodeItem: "",
        namaItem: "",
        deskripsi: "",
        kategori: "",    // BLOCK / SLAB / BOND / SHIELD (opsional)
        jenisItem: "",   // pengganti 'merek'
        harga: "",
        // Kalkulator/Konversi
        satuan: "",
        nilaiSatuan: "",
        nilaiKonversi: "",
        satuanKonversi: "",
        // Penggunaan
        nilaiPenggunaan: "",
        satuanPenggunaan: "",
        deskripsiPenggunaan: "",
        // Media
        gambarUrl: "",
        linkWeb: "",
    })
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

    async function submit(e) {
        e.preventDefault()
        // minimal client validation
        if (!f.kodeItem.trim() || !f.namaItem.trim() || !f.satuan.trim()) {
            alert("Kode Item, Nama Item, dan Satuan wajib diisi.")
            return
        }
        setBusy(true)
        try {
            const res = await fetch("/api/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(f),
            })
            const j = await res.json().catch(() => ({}))
            if (!res.ok) {
                alert(j.error || "Gagal membuat item")
                return
            }
            router.replace("/items")
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="p-4">
            <Card className="mx-auto max-w-6xl">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>Item Baru</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-8">
                        {/* Umum */}
                        <section className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Informasi Umum</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <Field label="Kode Item *">
                                    <Input value={f.kodeItem} onChange={(e)=>set("kodeItem", e.target.value)} placeholder="cth: PW-7,5X20X60" required />
                                </Field>
                                <Field label="Nama Item *">
                                    <Input value={f.namaItem} onChange={(e)=>set("namaItem", e.target.value)} placeholder="cth: AAC Power Block 7,5x20x60" required />
                                </Field>
                                <Field label="Kategori">
                                    <Input value={f.kategori} onChange={(e)=>set("kategori", e.target.value)} placeholder="cth: BLOCK / SLAB / BOND / SHIELD" />
                                </Field>
                                <Field label="Jenis Item">
                                    <Input value={f.jenisItem} onChange={(e)=>set("jenisItem", e.target.value)} placeholder="cth: BLOCK STANDARD" />
                                </Field>

                                <Field label="Deskripsi">
                                    <Input value={f.deskripsi} onChange={(e)=>set("deskripsi", e.target.value)} placeholder="cth: Bata ringan berkualitas" />
                                </Field>
                                <Field label="Harga (Rp.)">
                                    <NumericInput
                                        value={f.harga}
                                        onValue={(val) => set("harga", val)}
                                        decimalScale={0}
                                        fixedDecimalScale={false}
                                        allowNegative={false}
                                    />
                                </Field>
                            </div>
                        </section>

                        <Separator className="mb-4" />

                        {/* Kalkulator / Konversi */}
                        <section className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Kalkulator / Konversi</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <Field label="Satuan (base) *">
                                    <Input value={f.satuan} onChange={(e)=>set("satuan", e.target.value)} placeholder="cth: M3" required />
                                </Field>
                                <Field label="Nilai Satuan">
                                    <Input type="number" step="any" inputMode="decimal" value={f.nilaiSatuan} onChange={(e)=>set("nilaiSatuan", e.target.value)} placeholder="cth: 0.75" />
                                </Field>
                                <Field label="Nilai Konversi">
                                    <Input type="number" step="any" inputMode="decimal" value={f.nilaiKonversi} onChange={(e)=>set("nilaiKonversi", e.target.value)} placeholder="cth: 84" />
                                </Field>
                                <Field label="Satuan Konversi">
                                    <Input value={f.satuanKonversi} onChange={(e)=>set("satuanKonversi", e.target.value)} placeholder="cth: PCS" />
                                </Field>
                            </div>
                        </section>

                        <Separator className="mb-4" />

                        {/* Penggunaan */}
                        <section className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Cakupan atau daya sebar item.</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Nilai Penggunaan">
                                    <Input type="number" step="any" inputMode="decimal" value={f.nilaiPenggunaan} onChange={(e)=>set("nilaiPenggunaan", e.target.value)} placeholder="cth: 10" />
                                </Field>
                                <Field label="Satuan Penggunaan">
                                    <Input value={f.satuanPenggunaan} onChange={(e)=>set("satuanPenggunaan", e.target.value)} placeholder="cth: M2" />
                                </Field>
                                <Field label="Deskripsi Penggunaan">
                                    <Input value={f.deskripsiPenggunaan} onChange={(e)=>set("deskripsiPenggunaan", e.target.value)} placeholder="cth: Luas Dinding (m²)" />
                                </Field>
                            </div>
                        </section>

                        <Separator className="mb-4" />

                        {/* Media */}
                        <section className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Media</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Gambar URL">
                                    <Input value={f.gambarUrl} onChange={(e)=>set("gambarUrl", e.target.value)} placeholder="https://..." />
                                </Field>
                                <Field label="Link Web">
                                    <Input value={f.linkWeb} onChange={(e)=>set("linkWeb", e.target.value)} placeholder="https://..." />
                                </Field>
                            </div>
                        </section>

                        <CardFooter className="px-0 flex gap-2 pt-2">
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
