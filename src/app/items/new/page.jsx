"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function NewItemPage() {
    const router = useRouter()
    const [busy, setBusy] = useState(false)

    const [f, setF] = useState({
        // Umum
        kodeItem: "",
        namaItem: "",
        deskripsi: "",
        kategori: "",
        merek: "",
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
        // Komisi
        persentaseKomisi: "",
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
            <Card className="mx-auto max-w-4xl">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>Item Baru</CardTitle>
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
                                <Field label="Kode Item *">
                                    <Input value={f.kodeItem} onChange={(e)=>set("kodeItem", e.target.value)} placeholder="cth: PW-7,5X20X60" required />
                                </Field>
                                <Field label="Nama Item *">
                                    <Input value={f.namaItem} onChange={(e)=>set("namaItem", e.target.value)} placeholder="cth: AAC Power Block 7,5x20x60" required />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Kategori">
                                    <Input value={f.kategori} onChange={(e)=>set("kategori", e.target.value)} placeholder="cth: BLOCK STANDARD" />
                                </Field>
                                <Field label="Merek">
                                    <Input value={f.merek} onChange={(e)=>set("merek", e.target.value)} placeholder="cth: POWER BLOCK" />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Harga (angka)">
                                    <Input type="number" inputMode="decimal" value={f.harga} onChange={(e)=>set("harga", e.target.value)} placeholder="cth: 237000" />
                                </Field>
                                <Field label="Deskripsi">
                                    <Input value={f.deskripsi} onChange={(e)=>set("deskripsi", e.target.value)} placeholder="cth: Bata ringan berkualitas" />
                                </Field>
                            </div>
                        </section>

                        <Separator />

                        {/* Kalkulator / Konversi */}
                        <section className="space-y-4">
                            <div>
                                <div className="text-sm font-medium">Kalkulator / Konversi</div>
                                <p className="text-xs text-muted-foreground">Atur satuan item dan konversi satuan.</p>
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

                        <Separator />

                        {/* Penggunaan */}
                        <section className="space-y-4">
                            <div>
                                <div className="text-sm font-medium">Penggunaan</div>
                                <p className="text-xs text-muted-foreground">Cakupan / output pekerjaan dari satu item.</p>
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

                        <Separator />

                        {/* Komisi */}
                        <section className="space-y-4">
                            <div>
                                <div className="text-sm font-medium">Komisi</div>
                                <p className="text-xs text-muted-foreground">Isi dalam desimal. Contoh: 0.004 = 0.4%.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Persentase Komisi (desimal)">
                                    <Input
                                        type="number"
                                        step="any"
                                        inputMode="decimal"
                                        value={f.persentaseKomisi}
                                        onChange={(e)=>set("persentaseKomisi", e.target.value)}
                                        placeholder="cth: 0.004"
                                    />
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
