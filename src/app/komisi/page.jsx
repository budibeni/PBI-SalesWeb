"use client"

import React from "react"
import useItems from "@/hooks/useItems"
import TableProduk from "./TableProduk"
import AchTarget from "./AchTarget"
import HeaderPage from "./HeaderPage"
import FooterPage from "./FooterPage"
import DialogSave from "./DialogSave"
import DialogList from "./DialogList"
import PrintSimulasi from "./PrintSimulasi"
import { useReactToPrint } from "react-to-print"
import { useUser } from "@/providers/UserProvider"

const CAT_ALL = "__ALL__"
const j = (v) => JSON.stringify(v ?? null)

export default function Page() {
    const { ready, loading, items, refresh } = useItems()
    const user = useUser()
    const isAdmin = user?.role === "admin"

    // --- state utama ---
    const [idSimulasi, setIdSimulasi] = React.useState(null)
    const [judulSimulasi, setJudulSimulasi] = React.useState("")
    const [rows, setRows] = React.useState([])

    const [targetKomisi, setTargetKomisi] = React.useState({ global: "", perKategori: {} })

    // ✅ hanya pakai array detail (AchRow[])
    const [achievementRows, setAchievementRows] = React.useState([])
    const setAchievementRowsSafe = React.useCallback((next) => {
        setAchievementRows((prev) => (j(prev) === j(next) ? prev : next))
    }, [])

    const [showAchTarget, setShowAchTarget] = React.useState(false)
    const [marginKategori, setMarginKategori] = React.useState(0)
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

    // --- dialog & print ---
    const [saving, setSaving] = React.useState(false)
    const [showDialog, setShowDialog] = React.useState(false)
    const [listData, setListData] = React.useState([])
    const [showList, setShowList] = React.useState(false)
    const [printData, setPrintData] = React.useState(null)
    const printRef = React.useRef()

    const handlePrintNow = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Simulasi Komisi",
    })

    // 🧹 Reset semua
    const resetAll = React.useCallback(() => {
        setIdSimulasi(null)
        setJudulSimulasi("")
        setRows([])
        setMarginKategori(0)
        setAchievementRows([])
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

    // mapping cepat item by id
    const itemById = React.useMemo(() => {
        const m = new Map((items || []).map((it) => [it.id, it]))
        return (id) => m.get(id)
    }, [items])

    // Picker item
    const onPick = (rowBaru) => {
        if (!rowBaru) return
        setRows((prev) => (prev.some((r) => r.id === rowBaru.id) ? prev : [...prev, rowBaru]))
    }
    const onRemoveRow = (id) => setRows((prev) => prev.filter((x) => x.id !== id))
    const onChangeRow = (id, patch) =>
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

    // Payload builder (API sudah pakai struktur baru)
    const buildPayload = React.useCallback(() => {
        const tgRaw = String(targetKomisi?.global ?? "").trim()
        const targetGlobal = tgRaw ? Number(tgRaw) : null

        const isPercentMode = !!targetGlobal && !Number.isNaN(targetGlobal) && targetGlobal > 0
        const rawPerKat = targetKomisi?.perKategori || {}
        const targetKategoriSaved = Object.fromEntries(
            Object.entries(rawPerKat).map(([kat, val]) => {
                const s = String(val ?? "").trim()
                if (isPercentMode) {
                    const num = Number(s.replace(/%/g, "")) || 0
                    return [kat, `${num}%`]
                }
                const num = Number(s) || 0
                return [kat, num]
            })
        )

        return {
            judul: judulSimulasi || "Simulasi Komisi",
            targetGlobal,
            targetKategori: targetKategoriSaved,

            // ✅ hanya kirim struktur baru
            achievementKategori: achievementRows || [],

            komisiDasarTotal: Number(summary.komisiDasarTotal || 0),
            komisiDasarKategori: summary.komisiDasarPerKategori || {},
            bonusUtamaTotal: Number(summary.bonusUtamaTotal || 0),
            bonusUtamaKategori: summary.bonusUtamaPerKategori || {},
            bonusExtraTotal: Number(summary.bonusExtraTotal || 0),
            bonusExtraKategori: summary.bonusExtraPerKategori || {},
            subtotalTotal: Number(summary.subtotalTotal || 0),

            rowsItem: rows.map((r) => {
                const it = itemById(r.id) || {}
                return {
                    id: r.id,
                    kodeItem: r.kodeItem ?? it.kodeItem ?? "",
                    namaItem: r.namaItem ?? it.namaItem ?? "",
                    kategori: r.kategori ?? it.kategori ?? "",
                    satuan: r.satuan ?? it.satuan ?? "",
                    hpp: Number(r.hpp || 0),
                    msrp: Number((r.msrp ?? it.msrp ?? it.harga) || 0),
                    harga: Number(r.harga || 0),
                    qty: Number(r.qty || 0),
                    persen: Number(r.persen || 0),
                    hargaLocked: !!r.hargaLocked,
                    qtyLocked: !!r.qtyLocked,
                }
            }),
        }
    }, [judulSimulasi, targetKomisi, achievementRows, summary, rows, itemById])

    // Simpan baru / update
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

    // List & detail
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

            // ✅ muat struktur baru; set aman (hindari setState kalau sama)
            setAchievementRowsSafe(
                Array.isArray(d.achievementKategori) ? d.achievementKategori : []
            )

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

    // 🔹 Cetak
    const handlePrint = async (id) => {
        try {
            const res = await fetch(`/api/komisi/${id}`)
            const json = await res.json()
            if (!json.ok) throw new Error(json.error)
            setPrintData(json.data)
            setTimeout(() => handlePrintNow(), 150)
        } catch (err) {
            alert("Gagal menyiapkan cetak: " + err.message)
        }
    }

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`/api/komisi/${id}`, { method: "DELETE" })
            const json = await res.json()
            if (!json.ok) throw new Error(json.error || "Gagal menghapus")
            alert("Data berhasil dihapus.")
            setListData((prev) => prev.filter((x) => x.id !== id))
        } catch (err) {
            alert("Gagal menghapus: " + err.message)
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
                judul={judulSimulasi}
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
                onMarginKategoriChange={setMarginKategori}
                isAdmin={isAdmin}
            />

            <AchTarget
                show={showAchTarget}
                valueRows={achievementRows}      // nilai awal array
                onComputed={setAchievementRowsSafe} // hasil array detail (aman)
            />

            <FooterPage
                marginKategori={marginKategori}
                achvmentRows={achievementRows}
                onSummaryChange={setSummary}
            />

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
                onPrint={handlePrint}
                onDelete={handleDelete}
            />

            <div className="hidden">
                <PrintSimulasi ref={printRef} data={printData} />
            </div>
        </div>
    )
}
