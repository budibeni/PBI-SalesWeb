// File: components/master-input-search/MasterInputSearchMedia.jsx
"use client";
import React from "react";
import MasterInputSearch from "./MasterInputSearch";

/**
 * Judul + Gambar kecil (thumbnail kiri)
 * props tambahan:
 * - imageKey atau getImageSrc via MasterInputSearch base
 */
export default function MasterInputSearchMedia(props) {
    return (
        <MasterInputSearch
            {...props}
            renderItem={(row, { titleOf, imgOf }) => (
                <div className="flex items-center gap-3 w-full">
                    {imgOf(row) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgOf(row)} alt={titleOf(row)} className="h-8 w-8 rounded object-cover shrink-0" />
                    ) : (
                        <div className="h-8 w-8 rounded bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="font-medium leading-tight truncate">{titleOf(row)}</div>
                    </div>
                </div>
            )}
        />
    );
}
