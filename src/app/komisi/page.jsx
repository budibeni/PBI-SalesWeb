"use client"

import React from "react"
import useItems from "@/hooks/useItems"
import TableProduk from "./TableProduk"
import AchTarget from "./AchTarget"
import HeaderPage from "./HeaderPage"
import FooterPage from "./FooterPage"
import DialogSave from "./DialogSave"
import DialogList from "./DialogList"

const CAT_ALL = "__ALL__"

export default function Page() {
    const { ready, loading, items, refresh } = useItems()

    // --- state utama ---
    const [idSimulasi, setIdSimulasi] = React.useState(null)
    const [judulSimulasi, setJudulSimulasi] = React.useState("")
    const [rows, setRows] = React.useState([])
    const [targetKomisi, setTargetKomisi] = React.useState({ global: "", perKategori: {} })
    const [achievementValue, setAchievementValue] = React.useState({})
    const [showAchTarget, setShowAchTarget] = React.useState(false)
    const [komisiDasar, setKomisiDasar] = React.useState(0)
    const [selectedCat, setSelectedCat] = React.useState(CAT_ALL)
    const [summary, setSummary] = React.useState({
        komisiDasarTotal: 0,
        komisiDasarPerKategori: {},
        bonusUtamaTotal: 0,
        bonusUtamaPerKategori: {},
        bonusExtraTotal: 0,
        bonusExtraPerKategori: {},
        subtotalTotal: 0,
    })

    // --- state penyimpanan dan dialog ---
    const [saving, setSaving] = React.useState(false)
    const [showDialog, setShowDialog] = React.useState(false)
    const [listData, setListData] = React.useState([])
    const [showList, setShowList] = React.useState(false)

    // 🧹 Reset semua
    const resetAll = React.useCallback(() => {
        setIdSimulasi(null)
        setJudulSimulasi("")
        setRows([])
        setKomisiDasar(0)
        setAchievementValue({})
        setTargetKomisi({ global: "", perKategori: {} })
        setShowAchTarget(false)
        setSelectedCat(CAT_ALL)
        setSummary({
            komisiDasarTotal: 0,
            komisiDasarPerKategori: {},
            bonusUtamaTotal: 0,
            bonusUtamaPerKategori: {},
            bonusExtraTotal: 0,
            bonusExtraPerKategori: {},
            subtotalTotal: 0,
        })
    }, [])

    // Picker item
    const onPick = (rowBaru) => {
        if (!rowBaru) return
        setRows((prev) => (prev.some((r) => r.id === rowBaru.id) ? prev : [...prev, rowBaru]))
    }
    const onRemoveRow = (id) => setRows((prev) => prev.filter((x) => x.id !== id))
    const onChangeRow = (id, patch) =>
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

    // Payload builder
    const buildPayload = React.useCallback(() => {
        const tgRaw = String(targetKomisi?.global ?? "").trim()
        const targetGlobal = tgRaw ? Number(tgRaw) : null
        return {
            judul: judulSimulasi || "Simulasi Komisi",
            targetGlobal,
            targetKategori: targetKomisi?.perKategori || {},
            achievementKategori: achievementValue || {},
            komisiDasarTotal: Number(summary.komisiDasarTotal || 0),
            komisiDasarKategori: summary.komisiDasarPerKategori || {},
            bonusUtamaTotal: Number(summary.bonusUtamaTotal || 0),
            bonusUtamaKategori: summary.bonusUtamaPerKategori || {},
            bonusExtraTotal: Number(summary.bonusExtraTotal || 0),
            bonusExtraKategori: summary.bonusExtraPerKategori || {},
            subtotalTotal: Number(summary.subtotalTotal || 0),
            rowsItem: rows.map((r) => ({
                id: r.id,
                kodeItem: r.kodeItem,
                namaItem: r.namaItem,
                kategori: r.kategori,
                satuan: r.satuan,
                msrp: Number(r.msrp || 0),
                harga: Number(r.harga || 0),
                qty: Number(r.qty || 0),
                persen: Number(r.persen || 0),
                hargaLocked: !!r.hargaLocked,
                qtyLocked: !!r.qtyLocked,
            })),
        }
    }, [judulSimulasi, targetKomisi, achievementValue, summary, rows])

    // Simpan (baru / update)
    const handleSave = async () => {
        if (!rows.length) return alert("Belum ada data untuk disimpan.")
        if (!idSimulasi) setShowDialog(true)
        else await doSave("update")
    }

    const doSave = async (mode = "create") => {
        try {
            setSaving(true)
            const payload = buildPayload()
            const res = await fetch(
                mode === "create" ? "/api/komisi" : `/api/komisi/${idSimulasi}`,
                {
                    method: mode === "create" ? "POST" : "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            )
            const json = await res.json()
            if (!json.ok) throw new Error(json.error || "Gagal menyimpan")
            alert(mode === "create" ? "Tersimpan ✔︎" : "Tersimpan (update) ✔︎")
            if (mode === "create") setIdSimulasi(json.data.id)
            setShowDialog(false)
        } catch (err) {
            alert(`Gagal menyimpan: ${err.message}`)
        } finally {
            setSaving(false)
        }
    }

    // List
    const loadList = async () => {
        try {
            const res = await fetch("/api/komisi")
            const json = await res.json()
            if (!json.ok) throw new Error(json.error)
            setListData(json.data || [])
            setShowList(true)
        } catch (err) {
            alert("Gagal memuat daftar: " + err.message)
        }
    }

    // Detail
    const loadDetail = async (id) => {
        try {
            const res = await fetch(`/api/komisi/${id}`)
            const json = await res.json()
            if (!json.ok) throw new Error(json.error)
            const d = json.data
            setIdSimulasi(d.id)
            setJudulSimulasi(d.judul || "")
            setTargetKomisi({
                global: String(d.targetGlobal ?? ""),
                perKategori: d.targetKategori || {},
            })
            setAchievementValue(d.achievementKategori || {})
            setSummary({
                komisiDasarTotal: d.komisiDasarTotal || 0,
                komisiDasarPerKategori: d.komisiDasarKategori || {},
                bonusUtamaTotal: d.bonusUtamaTotal || 0,
                bonusUtamaPerKategori: d.bonusUtamaKategori || {},
                bonusExtraTotal: d.bonusExtraTotal || 0,
                bonusExtraPerKategori: d.bonusExtraKategori || {},
                subtotalTotal: d.subtotalTotal || 0,
            })
            setRows(d.rowsItem || [])
            setShowList(false)
        } catch (err) {
            alert("Gagal memuat data: " + err.message)
        }
    }

    return (
        <div>
            <HeaderPage
                loading={loading}
                ready={ready}
                rows={rows}
                clear={resetAll}
                refresh={refresh}
                targetKomisi={targetKomisi}
                setTargetKomisi={setTargetKomisi}
                onSave={handleSave}
                onShowList={loadList}
                saving={saving}
                isUpdate={!!idSimulasi}
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
                value={achievementValue}
                onComputed={setAchievementValue}
            />

            <FooterPage
                komisiDasar={komisiDasar}
                achvment={achievementValue}
                onSummaryChange={setSummary}
            />

            {/* ⬇️ Komponen dialog terpisah */}
            <DialogSave
                open={showDialog}
                onOpenChange={setShowDialog}
                judul={judulSimulasi}
                onChangeJudul={setJudulSimulasi}
                onConfirm={() => doSave("create")}
                saving={saving}
            />

            <DialogList
                open={showList}
                onOpenChange={setShowList}
                items={listData}
                onSelect={loadDetail}
            />
        </div>
    )
}
