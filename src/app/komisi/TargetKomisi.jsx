// komisi/TargetKomisi.jsx
"use client"

import React from "react"
import { useKategori } from "@/providers/KategoriProvider"
import { Button } from "@/components/ui/button"
import NumericInput from "@/components/ui/NumericInput"
import { ChevronDown, ChevronUp } from "lucide-react"
import { fmt } from "./utils"   // hanya fmt yang masih digunakan

/* ================= Helpers ================= */
const isFilled = (v) => String(v ?? "").trim().length > 0
// Parser aman untuk nilai dari NumericInput (dot-decimal string -> number)
const toNumAny = (raw) => {
    const s = String(raw ?? "").trim()
    if (!s) return 0
    const n = Number(s) // NumericInput sudah kirim dot-decimal
    return Number.isFinite(n) ? n : 0
}
const coerceNum = (v) => Math.max(0, toNumAny(v))
const stripPercent = (s) => String(s ?? "").trim().replace(/%/g, "")

/* ============== Core Computation ============== */
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
        const pct = Math.max(0, toNumAny(cleaned)) / 100
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

/* ============== Component ============== */
export default function TargetKomisi({
                                         targetKomisi,
                                         onChangeTargetKomisi,
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
                    <NumericInput
                        value={targetKomisi?.global ?? ""}
                        onValue={setGlobal}
                        decimalScale={0}
                        placeholder={
                            expand
                                ? hasGlobal
                                    ? "Target Global Telah Ditentukan"
                                    : `Target global: Rp. ${fmt(calc.global)}`
                                : "Silakan tentukan target"
                        }
                        className="flex-1 min-w-0"
                        inputMode="decimal"
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
                                    <label className="text-sm">
                                        {kat} <span className="text-muted-foreground">({calc.forcedMode})</span>
                                    </label>
                                    <NumericInput
                                        fixedDecimalScale={false}
                                        decimalScale={calc.forcedMode === "%"?2:0}
                                        value={raw}
                                        onValue={(v) => setPerKat(kat, v)}
                                        inputMode="decimal"
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

                        {calc.error && <div className="text-red-600 mt-1">{calc.error}</div>}
                    </div>
                </div>
            )}
        </div>
    )
}
