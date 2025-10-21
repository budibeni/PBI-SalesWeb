// komisi/TargetKomisi.jsx
"use client"

import React from "react"
import { useKategori } from "@/providers/KategoriProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp } from "lucide-react"
import { fmt, toNum } from "./utils"

// utils kecil
const isFilled = (v) => String(v ?? "").trim().length > 0
const coerceNum = (v) => Math.max(0, toNum(String(v ?? "")))
const stripPercent = (s) => String(s ?? "").trim().replace(/%/g, "")

function computeTargets({ expand, targetKomisi }) {
    const valueGlobal = targetKomisi?.global ?? ""
    const valuePerKategori = targetKomisi?.perKategori ?? {}

    const g = coerceNum(valueGlobal)
    const hasGlobal = isFilled(valueGlobal) && g > 0
    const forcedMode = hasGlobal ? "%" : "Rp."

    let error = null
    const perKategoriNominal = {}
    let totalNominal = 0
    let totalPercent = 0

    if (!expand) {
        return {
            forcedMode,
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

    if (forcedMode === "Rp.") {
        // Global kosong → input kategori nominal; Global = Σ kategori
        for (const [kat, raw] of Object.entries(valuePerKategori || {})) {
            const n = coerceNum(raw)
            if (!n) continue
            perKategoriNominal[kat] = n
            totalNominal += n
        }
        return {
            forcedMode,
            mode: "NOMINAL_ONLY",
            global: totalNominal,
            perKategoriNominal,
            totalNominal,
            totalPercent: 0,
            remainingPct: 0,
            remainingNominal: 0,
            error,
        }
    }

    // Global ada → input kategori persen (≤100%)
    for (const [kat, raw] of Object.entries(valuePerKategori || {})) {
        const cleaned = stripPercent(raw)
        if (!isFilled(cleaned)) continue
        const pct = Math.max(0, toNum(cleaned)) / 100
        totalPercent += pct
        perKategoriNominal[kat] = g * pct
    }
    if (totalPercent - 1 > 1e-6) {
        const overPct = (totalPercent - 1) * 100
        error = `Total persentase kategori melebihi 100% (+${fmt(overPct, 2)}%).`
    }
    totalNominal = Object.values(perKategoriNominal).reduce((a, b) => a + b, 0)
    const remainingPct = Math.max(0, 1 - totalPercent)
    const remainingNominal = Math.max(0, g - totalNominal)

    return {
        forcedMode,
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

export default function TargetKomisi({
                                         targetKomisi,              // { global: string, perKategori: Record<string,string> }
                                         onChangeTargetKomisi,      // (nextObj) => void
                                     }) {
    const { items: kategoriItems, ready: katReady } = useKategori()
    const [expand, setExpand] = React.useState(false)

    const kategoriList = React.useMemo(
        () => (Array.isArray(kategoriItems) ? kategoriItems.map((r) => r.kategori).filter(Boolean) : []),
        [kategoriItems]
    )

    const calc = React.useMemo(
        () => computeTargets({ expand, targetKomisi }),
        [expand, targetKomisi]
    )


    const setGlobal = (val) => {
        onChangeTargetKomisi?.({
            ...(targetKomisi || { global: "", perKategori: {} }),
            global: val,
        })
    }

    const setPerKat = (kat, val) => {
        onChangeTargetKomisi?.({
            ...(targetKomisi || { global: "", perKategori: {} }),
            perKategori: {
                ...(targetKomisi?.perKategori || {}),
                [kat]: val,
            },
        })
    }

    const resetPerKategori = () => {
        onChangeTargetKomisi?.({
            ...(targetKomisi || { global: "", perKategori: {} }),
            perKategori: {},
        })
    }

    const hasGlobal = calc.forcedMode === "%"
    const totalKategori = Object.values(calc.perKategoriNominal || {}).reduce((a, b) => a + b, 0)

    return (
        <div className="px-2 sm:px-4 space-y-3">
            {/* Global + expand/collapse */}
            <div className="w-full">
                <div className="flex gap-2 w-full">
                    <Input
                        value={targetKomisi?.global ?? ""}
                        onChange={(e) => setGlobal(e.target.value)}
                        placeholder={
                            expand
                                ? hasGlobal
                                    ? "Target Global Telah Ditentukan"
                                    : `Target global: Rp. ${fmt(calc.global)}`
                                : "Silakan tentukan target"
                        }
                        className="flex-1 min-w-0"
                        autoComplete="off"
                        aria-label="Target Global"
                    />
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setExpand((prev) => {
                                const next = !prev
                                if (!next) resetPerKategori()
                                return next
                            })
                        }}
                        className="h-auto px-3 shrink-0"
                        style={{ minHeight: 0 }}
                        aria-label={expand ? "Sembunyikan pengaturan per kategori" : "Atur target per kategori"}
                        title={expand ? "Sembunyikan pengaturan per kategori" : "Atur target per kategori"}
                    >
                        {expand ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Per-kategori */}
            {expand && (
                <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {(katReady ? kategoriList : []).map((kat) => {
                            const raw = targetKomisi?.perKategori?.[kat] ?? ""
                            const nominal = calc.perKategoriNominal[kat] ?? 0
                            const info =
                                calc.forcedMode === "%"
                                    ? `= Rp. ${fmt(nominal)}`
                                    : (() => {
                                        const pct = totalKategori > 0 ? (nominal / totalKategori) * 100 : 0
                                        return `= ${fmt(pct, 2)}%`
                                    })()

                            return (
                                <div key={kat} className="space-y-1">
                                    <label className="text-sm" htmlFor={`kat-${kat}`}>
                                        {kat} <span className="text-muted-foreground">({calc.forcedMode})</span>
                                    </label>
                                    <Input
                                        id={`kat-${kat}`}
                                        value={raw}
                                        onChange={(e) => setPerKat(kat, e.target.value)}
                                        autoComplete="off"
                                        inputMode="decimal"
                                        aria-label={`Target kategori ${kat}`}
                                    />
                                    <div className="text-xs text-muted-foreground">{info}</div>
                                </div>
                            )
                        })}
                        {katReady && kategoriList.length === 0 && (
                            <div className="text-xs text-muted-foreground">Tidak ada kategori.</div>
                        )}
                    </div>

                    <div className="text-xs">
                        <div>
                            TOTAL TARGET : <b>Rp. {fmt(calc.global)}</b>
                        </div>

                        {calc.forcedMode === "%" && (
                            <div className="mt-1">
                                Total Persentase Kategori: <b>{fmt(calc.totalPercent * 100, 2)}%</b> • Sisa:{" "}
                                <b>{fmt(calc.remainingPct * 100, 2)}%</b> (Rp. <b>{fmt(calc.remainingNominal)}</b>)
                            </div>
                        )}

                        {calc.error ? <div className="text-red-600 mt-1">{calc.error}</div> : null}
                    </div>
                </div>
            )}
        </div>
    )
}
