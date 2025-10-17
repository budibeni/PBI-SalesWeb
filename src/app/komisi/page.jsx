// app/komisi/page.jsx
"use client"

import React from "react"
import useItems from "@/hooks/useItems"
import { Card, CardContent } from "@/components/ui/card"
import SearchItem from "./SearchItem"
import TableProduk from "./TableProduk"
import AchTarget from "@/app/komisi/AchTarget";
import HeaderPage from "@/app/komisi/HeaderPage";
import FooterPage from "@/app/komisi/FooterPage";

const CAT_ALL = "__ALL__"

export default function SimulasiPage() {
    const { ready, loading, items, refresh } = useItems()
    const [rows, setRows] = React.useState([])
    const [targetGlobalRaw, setTargetGlobalRaw] = React.useState("")
    const [targetPerKategoriRaw, setTargetPerKategoriRaw] = React.useState({})
    const [targetComputed, setTargetComputed] = React.useState(null)
    const [selectedCat, setSelectedCat] = React.useState(CAT_ALL)

    const onPick = (rowBaru) => {
        if (!rowBaru) return
        setRows((prev) => (prev.some((r) => r.id === rowBaru.id) ? prev : [...prev, rowBaru]))
    }

    const onRemoveRow = (id) => {
        setRows((prev) => prev.filter((x) => x.id !== id))
    }

    const onChangeRow = (id, patch) => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    }

    return (
        <div>
            <HeaderPage
                loading             = {loading}
                ready               = {ready}
                rows                = {rows}
                setRows             = {setRows}
                refresh             = {refresh}
                targetGlobalRaw     = {targetGlobalRaw}
                setTargetGlobalRaw  = {setTargetGlobalRaw}
                targetPerKategoriRaw= {targetPerKategoriRaw}
                setTargetPerKategoriRaw= {setTargetPerKategoriRaw}
                setTargetComputed   = {setTargetComputed}
            />

            <Card className="mx-auto max-w-6xl mt-4">
                <CardContent className="space-y-6">
                    <SearchItem
                        onPick          = {onPick}
                        selectedCat     = {selectedCat}
                        onChangeCategory= {setSelectedCat}
                    />

                    <TableProduk
                        rows            = {rows}
                        items           = {items}
                        onChangeRow     = {onChangeRow}
                        onRemoveRow     = {onRemoveRow}
                        filterKategori  = {selectedCat}
                    />
                </CardContent>
            </Card>

            <Card className="mx-auto max-w-6xl mt-4">
                <AchTarget
                    valueGlobal         = {targetGlobalRaw}
                    onChangeGlobal      = {setTargetGlobalRaw}
                    valuePerKategori    = {targetPerKategoriRaw}
                    onChangePerKategori = {setTargetPerKategoriRaw}
                    onComputed          = {setTargetComputed}
                />
            </Card>

            <div className="sticky bottom-0 left-0 right-0 z-40 py-2">
                <FooterPage
                    komisiDasar={2000000}   // number
                    bonus1={2340}             // number
                    bonus2={0}             // number
                />
            </div>
        </div>
    )
}
