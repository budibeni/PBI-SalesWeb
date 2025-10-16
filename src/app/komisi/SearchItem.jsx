// komisi/SearchItem.jsx
"use client"

import React from "react"
import useItems from "@/hooks/useItems"
import { useKategori } from "@/providers/KategoriProvider"
import MasterInputSearchTitleDesc from "@/components/master-input-search/MasterInputSearchTitleDesc"

export default function SearchItem({ onPick }) {
    const { items } = useItems()
    const { items: kategoriItems, ready: katReady } = useKategori()

    // map kategori → persentase
    const persenByKategori = React.useMemo(() => {
        const m = new Map()
        ;(kategoriItems || []).forEach((r) => {
            // r.kategori (string), r.persentase (float desimal, mis 0.1 = 10%)
            m.set(String(r.kategori || "").trim().toLowerCase(), Number(r.persentase || 0))
        })
        return m
    }, [kategoriItems])

    const fetchPicker = React.useCallback(
        async (q) => {
            const qq = (q || "").trim().toLowerCase()
            if (!qq) return items || []
            return (items || []).filter((it) => {
                const hay = `${it.kodeItem || ""} ${it.namaItem || ""}`.toLowerCase()
                return hay.includes(qq)
            })
        },
        [items]
    )

    const handlePick = (it) => {
        if (!it) return
        const key = String(it.kategori || "").trim().toLowerCase()
        const persen = persenByKategori.get(key) ?? 0
        const rowBaru = {
            id: it.id,
            msrp: Number(it.harga || 0), // harga master dari DB
            harga: 0,                    // input bebas (default 0)
            qty: 0,                      // input bebas (default 0)
            persen,                      // komisi dari kategori
        }
        onPick?.(rowBaru)
    }

    return (
        <MasterInputSearchTitleDesc
            value={null}
            onChange={handlePick}
            fetchData={fetchPicker}
            placeholder="Cari dan tambahkan produk.."
            groupLabel="Pilih produk untuk ditambahkan"
            titleKey="kodeItem"
            descriptionKey="namaItem"
            buttonClassName="w-full justify-between"
            popoverClassName="min-w-[28rem]"
            allowClear={false}
            disabled={!katReady && (kategoriItems || []).length === 0}
        />
    )
}
