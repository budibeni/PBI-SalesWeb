"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export default function EditCommissionPage() {
    const router = useRouter()
    const { id } = useParams()
    const [busy, setBusy] = useState(false)
    const [f, setF] = useState(null)

    useEffect(() => {
        ;(async () => {
            const res = await fetch(`/api/items/${id}`, { cache: "no-store" })
            const j = await res.json()
            setF({
                persentaseKomisi: j.persentaseKomisi ?? "",
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
            <Card className="mx-auto max-w-md">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>Edit Item — Komisi</CardTitle>
                    <div className="flex gap-2">
                        <Button asChild variant="outline"><Link href={`/items/${id}/edit`}>Pindah: Umum</Link></Button>
                        <Button asChild variant="outline"><Link href={`/items/${id}/calc`}>Pindah: Kalkulator</Link></Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        <Field label="Persentase Komisi (desimal)">
                            <Input
                                type="number"
                                step="any"
                                value={f.persentaseKomisi}
                                onChange={(e)=>setF({ ...f, persentaseKomisi: e.target.value })}
                                placeholder="cth: 0.004 = 0.4%"
                            />
                        </Field>

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
