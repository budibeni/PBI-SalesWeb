// app/komisi/page.jsx
"use client"

import React from "react"
import useItems from "@/hooks/useItems"
import { Card, CardContent } from "@/components/ui/card"
import TableProduk from "./TableProduk"
import AchTarget from "./AchTarget"
import HeaderPage from "./HeaderPage"
import FooterPage from "./FooterPage"
import { toNum } from "./utils"

const CAT_ALL = "__ALL__"

export default function SimulasiPage() {
    const { ready, loading, items, refresh } = useItems()

    // TargetKomisi (baru)
    const [targetKomisi, setTargetKomisi] = React.useState({ global: "", perKategori: {} })
    const [targetComputed, setTargetComputed] = React.useState(null)

    // Achievement visibility (pakai onExpandChange)
    const [showAchTarget, setShowAchTarget] = React.useState(false)

    // Filter
    const [selectedCat, setSelectedCat] = React.useState(CAT_ALL)

    // Rows tabel
    const [rows, setRows] = React.useState([])
    const onPick = (rowBaru) => {
        if (!rowBaru) return
        setRows((prev) => (prev.some((r) => r.id === rowBaru.id) ? prev : [...prev, rowBaru]))
    }
    const onRemoveRow = (id) => setRows((prev) => prev.filter((x) => x.id !== id))
    const onChangeRow = (id, patch) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

    const komisiDasar = React.useMemo(
        () => rows.reduce((sum, r) => sum + toNum(r.harga) * toNum(r.qty) * Number(r.persen || 0), 0),
        [rows]
    )
    const bonus1 = 0
    const bonus2 = 0

    return (
        <div>
            <HeaderPage
                loading={loading}
                ready={ready}
                rows={rows}
                setRows={setRows}
                refresh={refresh}
                targetKomisi={targetKomisi}
                setTargetKomisi={setTargetKomisi}
                onTargetComputed={setTargetComputed}
            />

            <TableProduk
                rows={rows}
                items={items}
                onChangeRow={onChangeRow}
                onRemoveRow={onRemoveRow}
                onPick={onPick}
                selectedCat={selectedCat}
                onChangeCategory={setSelectedCat}
                targetKomisi={targetKomisi}
                // PENTING: pakai state ini
                expand={showAchTarget}
                onExpandChange={setShowAchTarget}
            />

            {/* Tampilkan AchTarget hanya saat expand = true */}
            {showAchTarget && (
                <AchTarget
                    valuePerKategori={{}}          // pakai state-mu sendiri jika ada
                    onChangePerKategori={() => {}} // sesuaikan dgn implementasimu
                    onComputed={() => {}}
                />
            )}

            <div className="sticky bottom-0 left-0 right-0 z-40 py-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <FooterPage komisiDasar={komisiDasar} bonus1={bonus1} bonus2={bonus2} />
            </div>
        </div>
    )
}
