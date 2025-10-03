// File: components/master-input-search/MasterInputSearchTable.jsx
"use client";
import React from "react";
import MasterInputSearch from "./MasterInputSearch";

/**
 * props tambahan:
 * - columns: [{ key, header, className?, render? }]
 * - headerSticky: boolean
 */
export default function MasterInputSearchTable({
                                                   columns = [
                                                       { key: "kode", header: "Kode" },
                                                       { key: "nama", header: "Nama" },
                                                       { key: "satuan", header: "Satuan" },
                                                   ],
                                                   headerSticky = true,
                                                   groupLabel = "Hasil",
                                                   ...rest
                                               }) {
    const Header = (
        <div
            className={`grid gap-2 px-3 py-2 text-xs font-medium opacity-70 ${
                headerSticky ? "sticky top-0 bg-background z-10 border-b" : ""
            }`}
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
            {columns.map((c, i) => (
                <div key={i} className={c.className || ""}>{c.header}</div>
            ))}
        </div>
    );

    return (
        <MasterInputSearch
            {...rest}
            groupLabel={groupLabel}
            groupHeaderExtra={Header}
            renderItem={(row, { get }) => (
                <div
                    className="grid gap-2 w-full items-center"
                    style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
                >
                    {columns.map((c, i) => (
                        <div key={i} className={c.className || "truncate"}>
                            {c.render ? c.render(row) : String(get(row, c.key) ?? "")}
                        </div>
                    ))}
                </div>
            )}
        />
    );
}
