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
import { useKategori } from "@/providers/KategoriProvider"

const CAT_ALL = "__ALL__"
const j = (v) => JSON.stringify(v ?? null)

const normKat = (v) => String(v ?? "").trim().toUpperCase()

export default function Page() {
    const { ready, loading, items, refresh } = useItems()
    const user = useUser()

    const isAdmin = user?.role === "admin"
    const jwtKategori = isAdmin ? "ALL" : normKat(user?.kategori || "ALL")
    const [customer, setCustomer] = React.useState(
        jwtKategori === "ALL" ? "RETAIL" : jwtKategori
    )

    const [idSimulasi, setIdSimulasi] = React.useState(null)
    const [judulSimulasi, setJudulSimulasi] = React.useState("")
    const [rows, setRows] = React.useState([])

    const [targetKomisi, setTargetKomisi] = React.useState({ global: "", perKategori: {} })

    const [achievementRows, setAchievementRows] = React.useState([])
    const setAchievementRowsSafe = React.useCallback((next) => {
        setAchievementRows((prev) => (j(prev) === j(next) ? prev : next))
    }, [])

    const [showAchTarget, setShowAchTarget] = React.useState(false)
    const [marginKategori, setMarginKategori] = React.useState(0)
    const [selectedCat, setSelectedCat] = React.useState(CAT_ALL)

    React.useEffect(() => {
        if (jwtKategori !== "ALL") {
            setCustomer(jwtKategori)
        }
    }, [jwtKategori])

    const { items: masterKomisiRaw } = useKategori()
    const masterKomisiSelected = React.useMemo(() => {
        if (!Array.isArray(masterKomisiRaw)) return []
        return masterKomisiRaw.filter((row) => {
            const c = (row.customer || "RETAIL").toUpperCase()
            return c === customer.toUpperCase()
        })
    }, [masterKomisiRaw, customer])

    const [summary, setSummary] = React.useState({
        komisiDasarTotal: 0,
        komisiDasarPerKategori: {},
        bonusUtamaTotal: 0,
        bonusUtamaPerKategori: {},
        bonusExtraTotal: 0,
        bonusExtraPerKategori: {},
        subtotalTotal: 0,
    })

    React.useEffect(() => {
        if (!Array.isArray(masterKomisiSelected)) return

        setAchievementRows((prev) => {
            const prevMap = new Map()
            ;(prev || []).forEach((r) => {
                if (r && r.kategori) prevMap.set(r.kategori, r)
            })

            const next = masterKomisiSelected.map((it) => {
                const kat = it.kategori
                const old = prevMap.get(kat)
                const achievement = old?.achievement ?? 0

                return {
                    kategori: kat,
                    persentase: it.persentase ?? null,
                    minAchKomisiDasar: it.minAchKomisiDasar ?? null,
                    minBonusUtama: it.minAchBonusUtama ?? null,
                    valueBonusUtama: it.valueBonusUtama ?? null,
                    minBonusExtra: it.minAchBonusExtra ?? null,
                    valueBonusExtra: it.valueBonusExtra ?? null,
                    achievement,
                }
            })

            return j(prev) === j(next) ? prev : next
        })
    }, [masterKomisiSelected])

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

    const itemById = React.useMemo(() => {
        const m = new Map((items || []).map((it) => [it.id, it]))
        return (id) => m.get(id)
    }, [items])

    const onPick = (rowBaru) => {
        if (!rowBaru) return
        setRows((prev) => (prev.some((r) => r.id === rowBaru.id) ? prev : [...prev, rowBaru]))
    }
    const onRemoveRow = (id) => setRows((prev) => prev.filter((x) => x.id !== id))
    const onChangeRow = (id, patch) =>
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

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
            customer,
            targetGlobal,
            targetKategori: targetKategoriSaved,
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
    }, [judulSimulasi, customer, targetKomisi, achievementRows, summary, rows, itemById])

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

            // ✅ kalau jwtKategori bukan ALL, jangan izinkan detail mengubah customer
            const detailCustomer = (d.customer || "RETAIL").toUpperCase()
            setCustomer(jwtKategori === "ALL" ? detailCustomer : jwtKategori)

            setTargetKomisi({
                global: String(d.targetGlobal ?? ""),
                perKategori: d.targetKategori || {},
            })

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
                customer={customer}
                setCustomer={setCustomer}
                masterKomisiSelected={masterKomisiSelected}
                jwtKategori={jwtKategori}
            />

            <TableProduk
                rows={rows}
                items={items}
                onChangeRow={onChangeRow}
                onRemoveRow={onRemoveRow}
                onPick={onPick}
                masterKomisiSelected={masterKomisiSelected}
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
                masterKomisiSelected={masterKomisiSelected}
                valueRows={achievementRows}
                onComputed={setAchievementRowsSafe}
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
