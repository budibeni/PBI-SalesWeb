"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, KeyRound, Eye, EyeOff, Save } from "lucide-react"

export default function PasswordForm() {
    const router = useRouter()

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [showCur, setShowCur] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConf, setShowConf] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [okMsg, setOkMsg] = useState("")

    const isValid =
        currentPassword.trim().length > 0 &&
        newPassword.length >= 8 &&
        confirm === newPassword

    const submit = async (e) => {
        e.preventDefault()
        setError("")
        setOkMsg("")
        if (!isValid) {
            if (!currentPassword) return setError("Kata sandi saat ini wajib diisi")
            if (newPassword.length < 8) return setError("Kata sandi baru minimal 8 karakter")
            if (confirm !== newPassword) return setError("Konfirmasi kata sandi tidak cocok")
        }

        setLoading(true)
        try {
            const res = await fetch("/api/me/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword, confirm }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)

            setOkMsg("Kata sandi berhasil diubah.")
            setCurrentPassword("")
            setNewPassword("")
            setConfirm("")
            router.refresh()
        } catch (err) {
            setError(err.message)
            if (err.message.toLowerCase().includes("unauthorized")) {
                // sesi kadaluarsa → arahkan ke login
                window.location.replace("/login?redirect=/account/password")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    Ubah Kata Sandi
                </CardTitle>
            </CardHeader>
            <CardContent>
                {okMsg && (
                    <div className="mb-3 rounded-md border border-emerald-200/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                        {okMsg}
                    </div>
                )}
                {error && (
                    <div className="mb-3 rounded-md border border-red-200/60 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-200">
                        {error}
                    </div>
                )}

                <form className="grid gap-4" onSubmit={submit}>
                    {/* current */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                        <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
                <Lock className="h-4 w-4" />
              </span>
                            <Input
                                id="currentPassword"
                                type={showCur ? "text" : "password"}
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="pl-9 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCur(v => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus:outline-none"
                                aria-label={showCur ? "Sembunyikan password" : "Tampilkan password"}
                            >
                                {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* new */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                        <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
                <KeyRound className="h-4 w-4" />
              </span>
                            <Input
                                id="newPassword"
                                type={showNew ? "text" : "password"}
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimal 8 karakter"
                                required
                                className="pl-9 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(v => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus:outline-none"
                                aria-label={showNew ? "Sembunyikan password" : "Tampilkan password"}
                            >
                                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* confirm */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="confirm">Konfirmasi Kata Sandi Baru</Label>
                        <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
                <KeyRound className="h-4 w-4" />
              </span>
                            <Input
                                id="confirm"
                                type={showConf ? "text" : "password"}
                                autoComplete="new-password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                                className="pl-9 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConf(v => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus:outline-none"
                                aria-label={showConf ? "Sembunyikan password" : "Tampilkan password"}
                            >
                                {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button type="submit" disabled={loading || !isValid} className="inline-flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {loading ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                        <span className="text-xs text-muted-foreground">
              Minimal 8 karakter. Gunakan kombinasi huruf & angka.
            </span>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
