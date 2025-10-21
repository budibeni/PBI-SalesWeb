// komisi/AchTarget.jsx
"use client"

import React from "react"
import { useKategori } from "@/providers/KategoriProvider"
import { Input } from "@/components/ui/input"
import { fmt, toNum } from "./utils"
import {Card, CardContent, CardHeader} from "@/components/ui/card";

const makeObjUpdater = (setter) => (key, raw) => {
    setter((prev) => {
        const base = typeof prev === "function" ? prev() : (prev || {})
        return { ...base, [key]: raw }
    })
}

const parsePct = (v) => {
    const cleaned = String(v ?? "").replace(/%/g, "").trim()
    const n = toNum(cleaned)
    return Number.isFinite(n) ? n : 0
}

export default function AchTarget({ valuePerKategori = {}, onChangePerKategori, onComputed }) {
    const { items: kategoriItems, ready: katReady } = useKategori()

    const kategoriList = React.useMemo(
        () => (Array.isArray(kategoriItems) ? kategoriItems.map((r) => r.kategori).filter(Boolean) : []),
        [kategoriItems],
    )

    const { byKategoriPct, totalPct } = React.useMemo(() => {
        const map = {}
        let sum = 0
        for (const kat of kategoriList) {
            const raw = valuePerKategori[kat]
            const pct = parsePct(raw)
            map[kat] = pct
            sum += pct
        }
        return { byKategoriPct: map, totalPct: sum }
    }, [kategoriList, valuePerKategori])

    React.useEffect(() => {
        onComputed?.({ byKategoriPct, totalPct })
    }, [byKategoriPct, totalPct, onComputed])

    const setKat = React.useMemo(() => makeObjUpdater(onChangePerKategori), [onChangePerKategori])

    return (
        <Card className="space-y-1 mt-4">
            {/* Header flex: kiri label + kanan total */}
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <div className="text-sm font-medium">Achievement (%)</div>
                <div className="text-xs text-muted-foreground sm:text-right">
                    Total: <b>{fmt(totalPct, 2)}%</b>
                </div>
            </CardHeader>

            {/* Grid input per kategori */}
            <CardContent className="grid grid-cols-4 gap-3">
                {(katReady ? kategoriList : []).map((kat) => {
                    const raw = valuePerKategori[kat] ?? ""
                    const pct = byKategoriPct[kat] ?? 0
                    return (
                        <div key={kat} className="space-y-1">
                            <label className="text-sm" htmlFor={`ach-${kat}`}>
                                {kat}
                            </label>
                            <div className="relative mt-1">
                                <Input
                                    id={`ach-${kat}`}
                                    value={raw}
                                    onChange={(e) => setKat(kat, e.target.value)}
                                    inputMode="decimal"
                                    autoComplete="off"
                                    aria-label={`Persentase kategori ${kat}`}
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
