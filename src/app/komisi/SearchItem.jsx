// app/komisi/SearchItem.jsx
"use client"

import React from "react"
import useItems from "@/hooks/useItems"
import { useKategori } from "@/providers/KategoriProvider"
import MasterInputSearchTitleDesc from "@/components/master-input-search/MasterInputSearchTitleDesc"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export const CAT_ALL = "__ALL__"

export default function SearchItem({
                                       onPick,
                                       selectedCat = CAT_ALL,                 // <-- dikontrol parent
                                       onChangeCategory = () => {},            // <-- dikontrol parent
                                   }) {
    const { items } = useItems()
    const { items: kategoriItems, ready: katReady } = useKategori()

    // daftar kategori dari provider komisi
    const kategoriList = React.useMemo(() => {
        const arr = Array.isArray(kategoriItems)
            ? kategoriItems.map((r) => r.kategori).filter(Boolean)
            : []
        return Array.from(new Set(arr)).sort((a, b) =>
            String(a).localeCompare(String(b), "id"),
        )
    }, [kategoriItems])

    // map kategori → persentase komisi
    const persenByKategori = React.useMemo(() => {
        const m = new Map()
        ;(kategoriItems || []).forEach((r) => {
            const key = String(r.kategori || "").trim().toLowerCase()
            m.set(key, Number(r.persentase || 0))   // desimal (0.1 = 10%)
        })
        return m
    }, [kategoriItems])

    // filter kategori + query pencarian
    const fetchPicker = React.useCallback(
        async (q) => {
            const qq = (q || "").trim().toLowerCase()
            const filteredByCat = (items || []).filter((it) => {
                if (selectedCat === CAT_ALL) return true
                const k = String(it.kategori || "").trim()
                return k.toLowerCase() === String(selectedCat).toLowerCase()
            })
            if (!qq) return filteredByCat
            return filteredByCat.filter((it) => {
                const hay = `${it.kodeItem || ""} ${it.namaItem || ""}`.toLowerCase()
                return hay.includes(qq)
            })
        },
        [items, selectedCat],
    )

    const handlePick = (it) => {
        if (!it) return
        const key = String(it.kategori || "").trim().toLowerCase()
        const persen = persenByKategori.get(key) ?? 0
        const rowBaru = {
            id: it.id,
            kodeItem: it.kodeItem,
            namaItem: it.namaItem,
            kategori: it.kategori,
            satuan: it.satuan,
            msrp: Number(it.harga ?? 0),
            harga: Number(it.harga ?? 0),
            qty: 0,
            persen,
        }
        onPick?.(rowBaru)
    }

    return (
        <div className="flex flex-row items-center gap-2 w-full">
            {/* Input pencarian produk: w-24 di mobile, flex-1 di desktop */}
            {/*<div className="sm:flex-1 sm:w-auto min-w-0">*/}
            <div className="flex-1">
                <MasterInputSearchTitleDesc
                    value={null}
                    onChange={handlePick}
                    fetchData={fetchPicker}
                    placeholder="Cari produk…"
                    groupLabel={
                        selectedCat === CAT_ALL
                            ? "Pilih produk untuk ditambahkan"
                            : `Pilih produk (kategori: ${selectedCat})`
                    }
                    titleKey="kodeItem"
                    descriptionKey="namaItem"
                    buttonClassName="w-full justify-between"
                    popoverClassName="min-w-[28rem]"
                    allowClear={false}
                    // isResponsive={true}
                    disabled={!katReady && (kategoriItems || []).length === 0}
                />
            </div>

            {/* Filter kategori: sisa lebar di mobile, w-48 di desktop */}
            {/*<div className="flex-1 sm:flex-none sm:w-48">*/}
            <div className="min-w-40">
                <Select value={selectedCat} onValueChange={onChangeCategory}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={CAT_ALL}>(Semua Kategori)</SelectItem>
                        {kategoriList.map((kat) => (
                            <SelectItem key={kat} value={kat}>
                                {kat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
