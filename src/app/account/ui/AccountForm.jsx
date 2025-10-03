// app/account/ui/AccountForm.jsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

export default function AccountForm({ initialData }) {
    const router = useRouter()
    const [form, setForm] = useState({
        email: initialData?.email || "",
        noHp: initialData?.noHp || "",
        nama: initialData?.nama || "",
        bagian: initialData?.bagian || "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [okMsg, setOkMsg] = useState("")

    const onChange = (e) => {
        const { id, value } = e.target
        setForm((s) => ({ ...s, [id]: value }))
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setOkMsg("")
        setLoading(true)
        try {
            await api("/api/me", { method: "PATCH", body: form })
            setOkMsg("Perubahan disimpan.")
            router.refresh()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="p-6">
            <form className="grid gap-4" onSubmit={onSubmit}>
                {/* Akun: read-only */}
                <div className="grid gap-1.5">
                    <Label htmlFor="akun">Akun (username)</Label>
                    <Input id="akun" value={initialData?.akun || ""} readOnly disabled />
                    <p className="text-xs text-muted-foreground">Akun tidak dapat diubah.</p>
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={onChange} placeholder="nama@contoh.com" />
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="noHp">No HP</Label>
                    <Input id="noHp" value={form.noHp} onChange={onChange} placeholder="08xxxxxxxxxx" />
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="nama">Nama</Label>
                    <Input id="nama" value={form.nama} onChange={onChange} placeholder="Nama lengkap" />
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="bagian">Bagian</Label>
                    <Input id="bagian" value={form.bagian} onChange={onChange} placeholder="Divisi/Bagian" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <Button type="submit" disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                    {okMsg && <span className="text-sm text-green-600">{okMsg}</span>}
                    {error && <span className="text-sm text-red-600">{error}</span>}
                </div>
            </form>
        </Card>
    )
}
