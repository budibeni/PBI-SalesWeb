"use client";
import * as React from "react";
import CommandCombobox from "@/components/blocks/CommandCombobox";


// Ganti ini dengan panggilan API-mu (fetch/axios)
async function fetchItems(query) {
    // contoh request:
    // const res = await fetch(`/api/items?q=${encodeURIComponent(query||"")}`);
    // return await res.json();

    // Dummy data:
    const all = [
        { kode_item: "BRG-001", nama_item: "Kabel LAN Cat6", satuan: "Roll" },
        { kode_item: "BRG-002", nama_item: "Router AX1800", satuan: "Unit" },
        { kode_item: "BRG-003", nama_item: "Konektor RJ45", satuan: "Pack" },
    ];
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter(
        (x) =>
            x.kode_item.toLowerCase().includes(q) ||
            x.nama_item.toLowerCase().includes(q) ||
            x.satuan.toLowerCase().includes(q)
    );
}

export default function ItemPicker({ value, onChange, disabled }) {
    return (
        <CommandCombobox
            value={value}
            onChange={onChange}
            onSearch={fetchItems}
            placeholder="Cari kode/nama barang…"
            emptyText="Barang tidak ditemukan."
            groupLabel="Barang"
            disabled={disabled}
            getOptionLabel={(o) => `${o?.kode_item ?? ""} — ${o?.nama_item ?? ""}`}
            getOptionValue={(o) =>
                `${o?.kode_item ?? ""} ${o?.nama_item ?? ""} ${o?.satuan ?? ""}`
            }
            renderOption={(o) => (
                <div className="flex flex-col">
                    <span className="font-medium">{o.nama_item}</span>
                    <span className="text-xs opacity-70">
            {o.kode_item} • {o.satuan}
          </span>
                </div>
            )}
        />
    );
}
