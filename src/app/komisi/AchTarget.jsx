// komisi/AchTarget.jsx
"use client"

import React from "react"
import NumericInput from "@/components/ui/NumericInput"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const j = (v) => JSON.stringify(v ?? null)

export default function AchTarget({
                                      show,
                                      masterKomisiSelected,   // array master komisi hasil filter customer (dari Page)
                                      valueRows = [],          // array achievement dari parent (misal dari loadDetail)
                                      onComputed,              // callback ke parent kalau user ubah nilai
                                  }) {
    // kalau panel disembunyikan, jangan render apa pun supaya tidak ada efek yg jalan
    if (!show) return null

    // normalisasi daftar kategori dari masterKomisiSelected
    const kategoriItems = React.useMemo(
        () => (Array.isArray(masterKomisiSelected) ? masterKomisiSelected : []),
        [masterKomisiSelected],
    )
    const katReady = kategoriItems.length > 0

    // state lokal: map kategori → string persen, contoh: { "BLOCK": "95.00" }
    const [values, setValues] = React.useState({})

    // 1) SYNC: valueRows (dari parent) → values (state lokal)
    React.useEffect(() => {
        if (!katReady) return

        // buat map dari valueRows: kategori → achievement (0–1)
        const mapAch = new Map()
        ;(valueRows || []).forEach((row) => {
            if (!row || !row.kategori) return
            const ach = Number(row.achievement ?? 0)
            if (!Number.isFinite(ach)) return
            mapAch.set(row.kategori, ach)
        })

        const nextValues = {}
        kategoriItems.forEach((it) => {
            const kat = it.kategori
            if (!kat) return
            const ach = mapAch.get(kat) ?? 0
            nextValues[kat] = ach ? (ach * 100).toFixed(2) : ""
        })

        // hanya set kalau benar-benar beda, supaya tidak memicu render tak perlu
        setValues((prev) => (j(prev) === j(nextValues) ? prev : nextValues))
    }, [katReady, kategoriItems, valueRows])

    // helper: bangun payload AchRow[] dari values + masterKomisiSelected
    const buildRows = React.useCallback(
        (valsObj) => {
            if (!katReady) return []
            return kategoriItems.map((it) => {
                const kat = it.kategori
                const str = valsObj?.[kat] ?? ""
                const num = Number(str)
                const achievement = Number.isFinite(num) ? num / 100 : 0

                return {
                    kategori: kat,
                    persentase: it.persentase ?? null,
                    minAchKomisiDasar: it.minAchKomisiDasar ?? null,
                    minBonusUtama: it.minAchBonusUtama ?? null,
                    valueBonusUtama: it.valueBonusUtama ?? null,
                    minBonusExtra: it.minAchBonusExtra ?? null,
                    valueBonusExtra: it.valueBonusExtra ?? null,
                    achievement,
                }
            })
        },
        [katReady, kategoriItems],
    )

    // 2) Handle perubahan input user
    const handleChange = (kat, strNumeric) => {
        setValues((prev) => {
            // kalau tidak berubah, jangan apa-apa
            if (prev[kat] === strNumeric) return prev

            const next = { ...prev, [kat]: strNumeric }

            // hitung payload baru dan kirim ke parent
            const payload = buildRows(next)
            onComputed?.(payload)

            return next
        })
    }

    return (
        <Card className="space-y-1 mt-4 gap-0">
            <CardHeader>
                <div className="text-sm font-medium">Achievement (%)</div>
            </CardHeader>

            <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-1">
                {(katReady ? kategoriItems : []).map((it) => {
                    const kat = it.kategori
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
                            <div className="text-[10px] text-muted-foreground">
                                Bonus : Utama ≥ {((it.minAchBonusUtama ?? 0) * 100).toFixed(2)}% — Extra ≥{" "}
                                {((it.minAchBonusExtra ?? 0) * 100).toFixed(2)}%
                            </div>
                        </div>
                    )
                })}
                {katReady && (!kategoriItems || kategoriItems.length === 0) && (
                    <div className="text-xs text-muted-foreground">Tidak ada kategori.</div>
                )}
            </CardContent>
        </Card>
    )
}
