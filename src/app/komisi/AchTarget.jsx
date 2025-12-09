"use client"

import React from "react"
import { useKategori } from "@/providers/KategoriProvider"
import NumericInput from "@/components/ui/NumericInput"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function shallowObjEq(a, b) {
    if (a === b) return true
    const ka = Object.keys(a || {})
    const kb = Object.keys(b || {})
    if (ka.length !== kb.length) return false
    for (const k of ka) if (a[k] !== b[k]) return false
    return true
}
const j = (v) => JSON.stringify(v ?? null)

export default function AchTarget({ show, onComputed, valueRows = [] }) {
    const { items: kategoriItems, ready: katReady } = useKategori()

    // buat map dari valueRows untuk seed
    const initialMap = React.useMemo(() => {
        const m = {}
        for (const r of valueRows || []) if (r?.kategori) m[r.kategori] = r
        return m
    }, [valueRows])

    // state lokal string persen per kategori
    const [values, setValues] = React.useState({}) // { [kat]: "95.50" }

    // cache untuk mencegah emit/setValues duplikat
    const lastValuesStr = React.useRef("")          // JSON of values
    const lastEmittedStr = React.useRef("")         // JSON of last payload

    // helper bangun payload AchRow[]
    const buildRows = React.useCallback(
        (valsObj) => {
            if (!Array.isArray(kategoriItems)) return []
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
        [kategoriItems]
    )

    // ⏫ Sync values dari valueRows + kategoriItems (HANYA jika berubah)
    React.useEffect(() => {
        if (!Array.isArray(kategoriItems)) return
        const next = {}
        for (const it of kategoriItems) {
            const kat = it.kategori
            if (!kat) continue
            const prevRow = initialMap[kat]
            const ach = Number(prevRow?.achievement ?? 0)
            next[kat] = ach ? String((ach * 100).toFixed(2)) : ""
        }
        // guard: hanya set kalau benar-benar beda
        if (!shallowObjEq(values, next)) {
            const str = j(next)
            if (str !== lastValuesStr.current) {
                lastValuesStr.current = str
                setValues(next)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kategoriItems, initialMap])

    // 🔔 Emit ke parent hanya bila payload berubah
    React.useEffect(() => {
        if (!katReady) return
        const payload = buildRows(values)
        const payloadStr = j(payload)
        if (payloadStr !== lastEmittedStr.current) {
            lastEmittedStr.current = payloadStr
            onComputed?.(payload)
        }
    }, [katReady, values, buildRows, onComputed])

    const handleChange = (kat, strNumeric) => {
        setValues((prev) => {
            const next = { ...prev, [kat]: strNumeric }
            // guard setState: hindari set kalau sama
            if (prev[kat] === strNumeric) return prev

            const nextStr = j(next)
            if (nextStr !== lastValuesStr.current) {
                lastValuesStr.current = nextStr
            }
            // emit jika payload berubah
            const payload = buildRows(next)
            const payloadStr = j(payload)
            if (payloadStr !== lastEmittedStr.current) {
                lastEmittedStr.current = payloadStr
                onComputed?.(payload)
            }
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
                    {(katReady ? kategoriItems : []).map((it) => {
                        const kat = it.kategori
                        const val = values[kat] ?? ""
                        return (
                            <div key={kat} className="space-y-1">
                                <label className="text-sm" htmlFor={`ach-${kat}`}>{kat}</label>
                                <div className="relative mt-1">
                                    <NumericInput
                                        value={val}
                                        onValue={(v) => handleChange(kat, v)}
                                        inputMode="decimal"
                                        fixedDecimalScale={false}
                                        decimalScale={2}
                                        className="pr-10"
                                    />
                                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                    Bonus : Utama ≥ {((it.minAchBonusUtama ?? 0) * 100).toFixed(2)}% — Extra ≥ {((it.minAchBonusExtra ?? 0) * 100).toFixed(2)}%
                                </div>
                            </div>
                        )
                    })}
                    {katReady && (!kategoriItems || kategoriItems.length === 0) && (
                        <div className="text-xs text-muted-foreground">Tidak ada kategori.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
