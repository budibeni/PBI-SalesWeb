"use client"

import React from "react"
import useItems from "@/hooks/useItems"
import TableProduk from "./TableProduk"
import AchTarget from "./AchTarget"
import HeaderPage from "./HeaderPage"
import FooterPage from "./FooterPage"

const CAT_ALL = "__ALL__"

export default function SimulasiPage() {
    const { ready, loading, items, refresh } = useItems()

    const [targetKomisi, setTargetKomisi] = React.useState({ global: "", perKategori: {} })
    const [showAchTarget, setShowAchTarget] = React.useState(false)
    const [komisiDasar, setKomisiDasar] = React.useState(0)
    const [selectedCat, setSelectedCat] = React.useState(CAT_ALL)
    const [achievementValue, setAchievementValue] = React.useState({})
    const [rows, setRows] = React.useState([])

    // 🧹 Fungsi untuk mengosongkan semua data
    const onClear = React.useCallback(() => {
        setRows([])
        setKomisiDasar(0)
        setAchievementValue({})
        setTargetKomisi({ global: "", perKategori: {} })
        setShowAchTarget(false)
        setSelectedCat(CAT_ALL)
    }, [])

    // Picker
    const onPick = (rowBaru) => {
        if (!rowBaru) return
        setRows((prev) => (prev.some((r) => r.id === rowBaru.id) ? prev : [...prev, rowBaru]))
    }

    const onRemoveRow = (id) => setRows((prev) => prev.filter((x) => x.id !== id))

    const onChangeRow = (id, patch) =>
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

    return (
        <div>
            <HeaderPage
                loading={loading}
                ready={ready}
                rows={rows}
                clear={onClear} // 🔹 kirim ke HeaderPage
                refresh={refresh}
                targetKomisi={targetKomisi}
                setTargetKomisi={setTargetKomisi}
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
                expand={showAchTarget}
                onExpandChange={setShowAchTarget}
                onKomisiDasarChange={setKomisiDasar}
            />

            <AchTarget
                show={showAchTarget}
                onComputed={(data) => {
                    setAchievementValue(data)
                }}
            />

            <div className="sticky bottom-0 left-0 right-0 z-40 py-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <FooterPage komisiDasar={komisiDasar} achvment={achievementValue} />
            </div>
        </div>
    )
}
