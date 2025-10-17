// File: components/master-input-search/MasterInputSearchTitleDesc.jsx
"use client";
import React from "react";
import MasterInputSearch from "./MasterInputSearch";

/**
 * Props tambahan:
 * - isResponsive?: boolean (default: false)
 *   Jika true, di perangkat mobile trigger akan berubah jadi ikon-only (tanpa teks).
 *   Berlaku hanya pada halaman yang mengaktifkan prop ini.
 */
export default function MasterInputSearchTitleDesc({
                                                       isResponsive = false,
                                                       ...props
                                                   }) {
    return (
        <MasterInputSearch
            {...props}
            isResponsive={isResponsive} // <-- penting: teruskan ke MasterInputSearch
            renderItem={(row, { titleOf, descOf }) => (
                <div
                    className="w-full rounded-sm border bg-card p-3 shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-ring/40"
                    role="button"
                    tabIndex={-1}
                >
                    <div className="flex flex-col w-full">
            <span className="font-medium leading-tight text-foreground">
              {titleOf(row)}
            </span>
                        <span className="text-xs text-muted-foreground leading-snug whitespace-normal break-words mt-1">
              {descOf(row)}
            </span>
                    </div>
                </div>
            )}
        />
    );
}
