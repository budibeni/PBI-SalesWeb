// komisi/AchTarget.jsx
"use client"

import React from "react"
import { useKategori } from "@/providers/KategoriProvider"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AchTarget({ onComputed }) {
    const { items: kategoriItems, ready: katReady } = useKategori()

    const kategoriList = React.useMemo(
        () =>
            Array.isArray(kategoriItems)
                ? kategoriItems.map((r) => r.kategori).filter(Boolean)
                : [],
        [kategoriItems]
    )

    // local state untuk simpan nilai input per kategori
    const [values, setValues] = React.useState({})

    const handleChange = (kat, val) => {
        // bersihkan input (hanya angka & titik)
        const clean = val.replace(/[^0-9.,]/g, "").replace(",", ".")
        setValues((prev) => {
            const next = { ...prev, [kat]: clean }
            // kirim ke parent dengan nilai dibagi 100
            const scaled = {}
            for (const [k, v] of Object.entries(next)) {
                const num = parseFloat(v)
                scaled[k] = Number.isFinite(num) ? num / 100 : 0
            }
            onComputed?.(scaled)
            return next
        })
    }

    return (
        <Card className="space-y-1 mt-4 gap-0">
            <CardHeader>
                <div className="text-sm font-medium">Achievement (%)</div>
            </CardHeader>

            <CardContent className="grid grid-cols-4 gap-3 mt-1">
                {(katReady ? kategoriList : []).map((kat) => {
                    const val = values[kat] ?? ""
                    return (
                        <div key={kat} className="space-y-1">
                            <label className="text-sm" htmlFor={`ach-${kat}`}>
                                {kat}
                            </label>
                            <div className="relative mt-1">
                                <Input
                                    id={`ach-${kat}`}
                                    value={val}
                                    onChange={(e) => handleChange(kat, e.target.value)}
                                    inputMode="decimal"
                                    autoComplete="off"
                                    className="pr-10"
                                />
                                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
                            </div>
                        </div>
                    )
                })}

                {katReady && kategoriList.length === 0 && (
                    <div className="text-xs text-muted-foreground">Tidak ada kategori.</div>
                )}
            </CardContent>
        </Card>
    )
}
