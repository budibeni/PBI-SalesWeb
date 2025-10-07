"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InputSearchLite from "@/components/blocks/InputSearchLite";

// Ganti dengan API-mu (Express/Prisma/MariaDB)
async function fetchItems(q) {
    const all = [
        { kode_item: "PRO 389 PAPER BAG", nama_item: "Perbaikan Permukaan Beton (Concrete Surface Repair) • Bond", satuan: "Roll", harga: 250000 },
        { kode_item: "BRG-002", nama_item: "Router AX1800 sdfsd fsdf sdfwefr wer wefr werwer fwer wer werfwerwer weerwe", satuan: "Unit", harga: 820000 },
        { kode_item: "BRG-003", nama_item: "Konektor RJ45", satuan: "Pack", harga: 35000 },
    ];
    const qq = (q || "").toLowerCase();
    return all.filter(
        (x) =>
            !qq ||
            x.kode_item.toLowerCase().includes(qq) ||
            x.nama_item.toLowerCase().includes(qq)
    );
}

export default function FormPickBarang() {
    const [barang, setBarang] = React.useState(null);
    const [qty, setQty] = React.useState(1);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                // kirim objek barang utuh + qty
                console.log({ barang, qty });
            }}
            // className="max-w-xl space-y-4"
        >
            {/*<div className="space-y-2">*/}
                <InputSearchLite
                    value={barang}
                    onChange={setBarang}
                    fetchData={fetchItems}
                    titleKey="kode_item"
                    descriptionKey="nama_item"
                />

            {/*    <button type="button" onClick={() => setBarang(null)}>*/}
            {/*        Clear dari induk*/}
            {/*    </button>*/}
            {/*</div>*/}

            {/*<div className="space-y-2">*/}
            {/*    <label className="text-sm font-medium">Qty</label>*/}
            {/*    <Input*/}
            {/*        type="number"*/}
            {/*        min={1}*/}
            {/*        value={qty}*/}
            {/*        onChange={(e) => setQty(Number(e.target.value))}*/}
            {/*    />*/}
            {/*</div>*/}

            {/*/!* Debug: objek lengkap yang diterima induk *!/*/}
            {/*<div className="rounded-md bg-muted/50 p-3 text-xs">*/}
            {/*    <pre>{JSON.stringify({ barang, qty }, null, 2)}</pre>*/}
            {/*</div>*/}

            {/*<Button type="submit">Simpan</Button>*/}
        </form>
    );
}
