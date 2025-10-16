// komisi/TargetKomisi.jsx
"use client"

import React from "react"
import { useKategori } from "@/providers/KategoriProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronRight } from "lucide-react"
import { fmt, toNum } from "./utils"

/**
 * TargetKomisi
 * - Aturan:
 *   • Jika Global kosong → input kategori HARUS nominal. Global = Σ kategori.
 *   • Jika Global terisi → input kategori HARUS persen (mis. 10%). Total ≤ 100%.
 *   • Tampilkan sisa nominal & persen saat belum 100% (ketika global terisi).
 *
 * Props:
 *  - valueGlobal, onChangeGlobal(string)
 *  - valuePerKategori (obj: { [kategori]: string }), onChangePerKategori(fn)
 *  - onComputed?(result) => { mode, global, perKategoriNominal, totalPercent, remainingPct, remainingNominal, error }
 */
export default function TargetKomisi({
                                         valueGlobal,
                                         onChangeGlobal,
                                         valuePerKategori,
                                         onChangePerKategori,
                                         onComputed,
                                     }) {
    const { items: kategoriItems, ready: katReady } = useKategori()
    const [expand, setExpand] = React.useState(false)

    const kategoriList = React.useMemo(
        () => (Array.isArray(kategoriItems) ? kategoriItems.map((r) => r.kategori) : []),
        [kategoriItems]
    )

    const hasGlobal = React.useMemo(
        () => toNum(valueGlobal) > 0 && String(valueGlobal || "").trim().length > 0,
        [valueGlobal]
    )

    const calc = React.useMemo(() => {
        const g = toNum(valueGlobal)
        let error = null
        let perKategoriNominal = {}
        let totalNominal = 0
        let totalPercent = 0

        if (!expand) {
            return {
                mode: "GLOBAL_ONLY",
                global: g,
                perKategoriNominal,
                totalNominal,
                totalPercent,
                remainingPct: hasGlobal ? 1 : 0,
                remainingNominal: hasGlobal ? g : 0,
                error: null,
            }
        }

        if (!hasGlobal) {
            // kategori HARUS nominal
            for (const [kat, raw] of Object.entries(valuePerKategori || {})) {
                const s = String(raw || "").trim()
                if (!s) continue
                if (s.endsWith("%")) {
                    error = "Saat Target Global kosong, input kategori harus nominal (tanpa %)."
                    break
                }
                const n = Math.max(0, toNum(s))
                perKategoriNominal[kat] = n
                totalNominal += n
            }
            return {
                mode: "NOMINAL_ONLY",
                global: totalNominal,
                perKategoriNominal,
                totalNominal,
                totalPercent: 0,
                remainingPct: 0,
                remainingNominal: 0,
                error,
            }
        } else {
            // kategori HARUS persen
            for (const [kat, raw] of Object.entries(valuePerKategori || {})) {
                const s = String(raw || "").trim()
                if (!s) continue
                if (!s.endsWith("%")) {
                    error = "Saat Target Global diisi, input kategori harus persen (mis. 10%)."
                    break
                }
                const pct = Math.max(0, toNum(s.slice(0, -1))) / 100
                totalPercent += pct
                perKategoriNominal[kat] = g * pct
            }

            if (!error && totalPercent - 1 > 1e-6) {
                const overPct = (totalPercent - 1) * 100
                error = `Total persentase kategori melebihi 100% (+${fmt(overPct, 2)}%).`
            }

            totalNominal = Object.values(perKategoriNominal).reduce((a, b) => a + b, 0)
            const remainingPct = Math.max(0, 1 - totalPercent)
            const remainingNominal = Math.max(0, g - totalNominal)

            return {
                mode: "PERCENT_ONLY",
                global: g,
                perKategoriNominal,
                totalNominal,
                totalPercent,
                remainingPct,
                remainingNominal,
                error,
            }
        }
    }, [expand, hasGlobal, valueGlobal, valuePerKategori])

    React.useEffect(() => {
        onComputed?.(calc)
    }, [calc, onComputed])

    const toggleExpand = () => {
        setExpand((prev) => {
            const next = !prev
            if (!next) {
                // collapse → kosongkan target per-kategori
                onChangePerKategori?.({})
            }
            return next
        })
    }

    return (
        <div className="rounded-md border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="font-medium">Target</div>
                <Button type="button" size="sm" variant="outline" onClick={toggleExpand}>
                    {expand ? (
                        <>
                            <ChevronDown className="mr-2 h-4 w-4" /> Sembunyikan (collapse)
                        </>
                    ) : (
                        <>
                            <ChevronRight className="mr-2 h-4 w-4" /> Atur per Kategori (expand)
                        </>
                    )}
                </Button>
            </div>

            {/* Target Global */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <label className="text-sm text-muted-foreground sm:col-span-1">Target Global</label>
                <div className="sm:col-span-2">
                    <Input
                        value={valueGlobal}
                        onChange={(e) => onChangeGlobal?.(e.target.value)}
                        placeholder="mis: 1.500.000 (kosongkan untuk gunakan total kategori)"
                    />
                    {expand && (
                        <div className="mt-1 text-xs text-muted-foreground">
                            {hasGlobal
                                ? "Global terisi: input kategori WAJIB persen (mis. 10%)."
                                : "Global kosong: input kategori WAJIB nominal (tanpa %). Global = jumlah kategori."}
                        </div>
                    )}
                </div>
            </div>

            {/* Per-kategori */}
            {expand && (
                <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(katReady ? kategoriList : []).map((kat) => {
                            const raw = (valuePerKategori || {})[kat] ?? ""
                            const nominal = calc.perKategoriNominal[kat] ?? 0
                            return (
                                <div key={kat} className="space-y-1">
                                    <label className="text-sm">{kat}</label>
                                    <Input
                                        value={raw}
                                        onChange={(e) =>
                                            onChangePerKategori?.((s) => ({ ...(typeof s === "function" ? s() : s), [kat]: e.target.value }))
                                        }
                                        placeholder={hasGlobal ? "cth: 10%" : "cth: 750000"}
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        {hasGlobal ? `= ${fmt(nominal)} (${raw || "0"})` : `= ${fmt(nominal)}`}
                                    </div>
                                </div>
                            )
                        })}
                        {katReady && kategoriList.length === 0 && (
                            <div className="text-xs text-muted-foreground">Tidak ada kategori.</div>
                        )}
                    </div>

                    <div className="text-xs">
                        <div>
                            Target Global Terhitung: <b>{fmt(calc.global)}</b>
                        </div>
                        {hasGlobal && (
                            <div className="mt-1">
                                Total Persentase Kategori: <b>{fmt(calc.totalPercent * 100, 2)}%</b> • Sisa:{" "}
                                <b>
                                    {fmt(calc.remainingPct * 100, 2)}% / {fmt(calc.remainingNominal)}
                                </b>
                            </div>
                        )}
                        {calc.error ? <div className="text-red-600 mt-1">{calc.error}</div> : null}
                    </div>
                </div>
            )}
        </div>
    )
}
