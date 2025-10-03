// File: components/master-input-search/MasterInputSearchValue.jsx
"use client";
import React from "react";
import MasterInputSearch from "./MasterInputSearch";

/** Value only */
export default function MasterInputSearchValue(props) {
    return (
        <MasterInputSearch
            {...props}
            renderItem={(row, { get }) => (
                <div className="w-full truncate">{String(get(row, props.valueKey || "value") ?? "")}</div>
            )}
            // default getItemValue mengikuti kolom 'value' juga
            getItemValue={(row, { get }) => String(get(row, props.valueKey || "value") ?? "")}
        />
    );
}