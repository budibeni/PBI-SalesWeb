"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import NumericInput from "@/components/ui/NumericInput"
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react"
import { fmt } from "@/lib/format"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const isFilled = (v) => String(v ?? "").trim().length > 0
const toNumAny = (raw) => {
    const s = String(raw ?? "").trim()
    if (!s) return 0
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
}
const coerceNum = (v) => Math.max(0, toNumAny(v))
const stripPercent = (s) => String(s ?? "").trim().replace(/%/g, "")

function computeTargets({ expand, targetKomisi }) {
    const valueGlobal = targetKomisi?.global ?? ""
    const valuePerKategori = targetKomisi?.perKategori ?? {}

    const g = coerceNum(valueGlobal)
    const hasGlobal = isFilled(valueGlobal) && g > 0
    const hasPercentSymbol = Object.values(valuePerKategori).some((v) =>
        String(v ?? "").includes("%")
    )

    const forcedMode = hasPercentSymbol || hasGlobal ? "%" : "Rp."

    let error = null
    const perKategoriNominal = {}
    let totalNominal = 0
    let totalPercent = 0

    // jika expand = false, hitung sekilas agar caption tetap informatif
    if (!expand) {
        if (forcedMode === "Rp.") {
            for (const [kat, raw] of Object.entries(valuePerKategori || {})) {
                const n = coerceNum(raw)
                if (!n) continue
                perKategoriNominal[kat] = n
                totalNominal += n
            }
            return {
                forcedMode,
                mode: "GLOBAL_ONLY",
                global: hasGlobal ? g : totalNominal,
                perKategoriNominal,
                totalNominal,
                totalPercent: 0,
                remainingPct: 0,
                remainingNominal: 0,
                error: null,
            }
        }

        for (const [kat, raw] of Object.entries(valuePerKategori || {})) {
            const cleaned = stripPercent(raw)
            if (!isFilled(cleaned)) continue
            const pct = Math.max(0, toNumAny(cleaned)) / 100
            totalPercent += pct
        }

        return {
            forcedMode,
            mode: "GLOBAL_ONLY",
            global: g,
            perKategoriNominal,
            totalNominal: 0,
            totalPercent,
            remainingPct: Math.max(0, 1 - totalPercent),
            remainingNominal: Math.max(0, g * Math.max(0, 1 - totalPercent)),
            error: null,
        }
    }

    if (forcedMode === "Rp.") {
        for (const [kat, raw] of Object.entries(valuePerKategori || {})) {
            const n = coerceNum(raw)
            if (!n) continue
            perKategoriNominal[kat] = n
            totalNominal += n
        }

        return {
            forcedMode,
            mode: "NOMINAL_ONLY",
            global: hasGlobal ? g : totalNominal,
            perKategoriNominal,
            totalNominal,
            totalPercent: 0,
            remainingPct: 0,
            remainingNominal: 0,
            error,
        }
    }

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

export default function TargetKomisi({
                                         targetKomisi,
                                         onChangeTargetKomisi,
                                         customer,
                                         setCustomer,
                                         masterKomisiSelected,       // 🔹 data master komisi per customer (dari Page)
                                     }) {
    const [expand, setExpand] = React.useState(false)

    // 🔹 Daftar kategori berdasarkan masterKomisiSelected (bukan useKategori lagi)
    const kategoriList = React.useMemo(
        () =>
            Array.isArray(masterKomisiSelected)
                ? Array.from(
                    new Set(
                        masterKomisiSelected
                            .map((r) => r.kategori)
                            .filter(Boolean)
                    )
                )
                : [],
        [masterKomisiSelected]
    )

    const calc = React.useMemo(
        () => computeTargets({ expand, targetKomisi }),
        [expand, targetKomisi]
    )

    const hasAnyPerKatRaw = React.useMemo(
        () =>
            Object.values(targetKomisi?.perKategori || {}).some(
                (v) => String(v ?? "").trim() !== ""
            ),
        [targetKomisi]
    )

    const perKatPercentList = React.useMemo(() => {
        if (calc.forcedMode !== "%") return []
        const raw = targetKomisi?.perKategori || {}
        return Object.entries(raw)
            .filter(([, v]) => String(v ?? "").trim() !== "")
            .map(([k, v]) => [k, Number(stripPercent(v)) || 0])
    }, [calc.forcedMode, targetKomisi])

    const perKatNominalList = React.useMemo(() => {
        if (calc.forcedMode !== "Rp.") return []
        const raw = calc.perKategoriNominal || {}
        return Object.entries(raw).map(([k, v]) => [k, v])
    }, [calc.forcedMode, calc.perKategoriNominal])

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

    const totalKategori = Object.values(calc.perKategoriNominal || {}).reduce(
        (a, b) => a + b,
        0
    )

    return (
        <div className="px-2 sm:px-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="w-full sm:w-36">
                    <Select
                        value={customer}
                        onValueChange={(val) => setCustomer?.(val)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Customer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PROJECT">PROJECT</SelectItem>
                            <SelectItem value="RETAIL">RETAIL</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Global input */}
                <div className="w-full">
                    <div className="flex gap-2 w-full">
                        <NumericInput
                            value={targetKomisi?.global ?? ""}
                            onValue={setGlobal}
                            decimalScale={0}
                            placeholder={
                                expand
                                    ? calc.forcedMode === "%"
                                        ? "Target Global (Mode Persentase)"
                                        : `Target Global: Rp. ${fmt(calc.global)}`
                                    : "Silakan tentukan target"
                            }
                            className="flex-1 min-w-0"
                            inputMode="decimal"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setExpand((prev) => !prev)}
                            className="h-auto px-3 shrink-0"
                            style={{ minHeight: 0 }}
                        >
                            {expand ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* === Caption ketika collapsed === */}
            {!expand && (
                <div className="text-xs text-muted-foreground mt-1">
                    {calc.forcedMode === "%" ? (
                        hasAnyPerKatRaw ? (
                            <div>
                                <div className="mb-1">
                                    Persentase per kategori:{" "}
                                    <b>
                                        {perKatPercentList
                                            .map(
                                                ([k, p]) =>
                                                    `${k} ${fmt(p, 2)}%`
                                            )
                                            .join(" • ")}
                                    </b>
                                </div>
                                <div>
                                    Total Persentase:{" "}
                                    <b>
                                        {fmt(
                                            calc.totalPercent * 100,
                                            2
                                        )}
                                        %
                                    </b>{" "}
                                    • Sisa:{" "}
                                    <b>
                                        {fmt(
                                            calc.remainingPct * 100,
                                            2
                                        )}
                                        %
                                    </b>{" "}
                                    (Rp.{" "}
                                    <b>{fmt(calc.remainingNominal)}</b>)
                                </div>
                            </div>
                        ) : (
                            <div>
                                Anda belum menentukan persentase target per
                                kategori.
                            </div>
                        )
                    ) : (
                        hasAnyPerKatRaw && (
                            <div>
                                <div>
                                    TOTAL TARGET :{" "}
                                    <b>Rp. {fmt(calc.totalNominal)}</b>
                                </div>
                                <div className="mb-1">
                                    Target per kategori:{" "}
                                    <b>
                                        {perKatNominalList
                                            .map(
                                                ([k, p]) =>
                                                    `${k} ${fmt(p, 2)}`
                                            )
                                            .join(" • ")}
                                    </b>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* === Detail ketika expand === */}
            {expand && (
                <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">
                            Target per Kategori
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={resetPerKategori}
                            className="h-auto px-3 py-1 text-xs flex items-center gap-1"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {kategoriList.map((kat) => {
                            const raw =
                                targetKomisi?.perKategori?.[kat] ?? ""
                            const nominal =
                                calc.perKategoriNominal[kat] ?? 0
                            const info =
                                calc.forcedMode === "%"
                                    ? `= Rp. ${fmt(nominal)}`
                                    : (() => {
                                        const pct =
                                            totalKategori > 0
                                                ? (nominal /
                                                    totalKategori) *
                                                100
                                                : 0
                                        return `= ${fmt(pct, 2)}%`
                                    })()

                            return (
                                <div key={kat} className="space-y-1">
                                    <label className="text-sm">
                                        {kat}{" "}
                                        <span className="text-muted-foreground">
                                            ({calc.forcedMode})
                                        </span>
                                    </label>
                                    <NumericInput
                                        fixedDecimalScale={false}
                                        decimalScale={
                                            calc.forcedMode === "%"
                                                ? 2
                                                : 0
                                        }
                                        value={raw}
                                        onValue={(v) =>
                                            setPerKat(kat, v)
                                        }
                                        inputMode="decimal"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        {info}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="text-xs">
                        <div>
                            TOTAL TARGET :{" "}
                            <b>
                                {calc.forcedMode === "%"
                                    ? "Rp. " + fmt(calc.global)
                                    : "Rp. " + fmt(calc.totalNominal)}
                            </b>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
