"use client"

import React from "react"
import { useKategori } from "@/providers/KategoriProvider"
import NumericInput from "@/components/ui/NumericInput"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AchTarget({ show, onComputed, value = {} }) {
    const { items: kategoriItems, ready: katReady } = useKategori()

    const kategoriList = React.useMemo(
        () =>
            Array.isArray(kategoriItems)
                ? kategoriItems.map((r) => r.kategori).filter(Boolean)
                : [],
        [kategoriItems]
    )

    const [values, setValues] = React.useState({})

    // 🟢 Sinkronisasi dari parent
    React.useEffect(() => {
        if (!value || typeof value !== "object") return
        const next = {}
        for (const [kat, val] of Object.entries(value)) {
            // value dari DB sudah dalam bentuk skala 1.0 (bukan persen)
            const num = Number(val)
            next[kat] = Number.isFinite(num) ? String((num * 100).toFixed(2)) : ""
        }
        setValues(next)
    }, [value])

    const handleChange = (kat, strNumeric) => {
        setValues((prev) => {
            const next = { ...prev, [kat]: strNumeric }
            const scaled = {}
            for (const [k, v] of Object.entries(next)) {
                const num = Number(v)
                scaled[k] = Number.isFinite(num) ? num / 100 : 0
            }
            onComputed?.(scaled)
            return next
        })
    }

    return (
        <div className={show ? "" : "hidden"}>
            <Card className="space-y-1 mt-4 gap-0">
                <CardHeader>
                    <div className="text-sm font-medium">Achievement (%)</div>
                </CardHeader>

                <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-1">
                    {(katReady ? kategoriList : []).map((kat) => {
                        const val = values[kat] ?? ""
                        return (
                            <div key={kat} className="space-y-1">
                                <label className="text-sm" htmlFor={`ach-${kat}`}>
                                    {kat}
                                </label>
                                <div className="relative mt-1">
                                    <NumericInput
                                        value={val}
                                        onValue={(v) => handleChange(kat, v)}
                                        inputMode="decimal"
                                        fixedDecimalScale={false}
                                        decimalScale={2}
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
        </div>
    )
}
