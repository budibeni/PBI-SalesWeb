// app/komisi/page.jsx
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

    // TargetKomisi (baru)
    const [targetKomisi, setTargetKomisi] = React.useState({ global: "", perKategori: {} })

    // Achievement visibility (pakai onExpandChange)
    const [showAchTarget, setShowAchTarget] = React.useState(false)
    const [komisiDasar, setKomisiDasar] = React.useState(0)

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
