"use client";
import React from "react";
import {
    MasterInputSearchTitleDesc,
    MasterInputSearchTable,
    MasterInputSearchMedia,
    MasterInputSearchValue,
    MasterInputCheckbox,
} from "@/components/master-input-search";

async function fakeFetch(q) {
    // ganti dengan API kamu; contoh dummy
    const all = [
        { kode: "ITM-001", nama: "Kabel LAN", satuan: "pcs", deskripsi: "Cat6 2m", image: "/img/lan.jpg", value: "ITM-001" },
        { kode: "ITM-002", nama: "Router",   satuan: "unit", deskripsi: "Dual Band", image: "/img/router.jpg", value: "ITM-002" },
    ];
    await new Promise(r => setTimeout(r, 300));
    return all.filter(r => JSON.stringify(r).toLowerCase().includes((q || "").toLowerCase()));
}

export default function ExampleUsage() {
    const [selected, setSelected] = React.useState([]);
    const [val1, setVal1] = React.useState(null);
    const [val2, setVal2] = React.useState(null);
    const [val3, setVal3] = React.useState(null);
    const [val4, setVal4] = React.useState(null);

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <MasterInputSearchTitleDesc
                    value={val1}
                    onChange={setVal1}
                    fetchData={fakeFetch}
                    titleKey="nama"
                    descriptionKey="deskripsi"
                    placeholder="Cari item (judul + deskripsi)"
                />

                <MasterInputSearchTable
                    value={val2}
                    onChange={setVal2}
                    fetchData={fakeFetch}
                    placeholder="Cari item (tabel)"
                    columns={[
                        { key: "kode", header: "Kode" },
                        { key: "nama", header: "Nama" },
                        { key: "satuan", header: "Satuan" },
                    ]}
                    titleKey="nama"
                    descriptionKey="deskripsi"
                />

                <MasterInputSearchMedia
                    value={val3}
                    onChange={setVal3}
                    fetchData={fakeFetch}
                    titleKey="nama"
                    imageKey="image"
                    placeholder="Cari item (judul + gambar)"
                />

                <MasterInputSearchValue
                    value={val4}
                    onChange={setVal4}
                    fetchData={fakeFetch}
                    valueKey="value"
                    placeholder="Cari item (value saja)"
                    titleKey="nama"
                />
            </div>

            {/* Multi-select checkbox */}
            <MasterInputCheckbox
                values={selected}
                onChange={setSelected}
                fetchData={fakeFetch}     // <— pakai fakeFetch yang sama
                keyField="kode"           // <— pakai 'kode' karena objek tidak punya 'id'
                titleKey="nama"
                descriptionKey="deskripsi"
                placeholder="Pilih beberapa item…"
            />

            {/* Contoh melihat hasil */}
            <pre className="text-xs opacity-70">
        {JSON.stringify({ single: { val1, val2, val3, val4 }, multi: selected }, null, 2)}
      </pre>
        </div>
    );
}
