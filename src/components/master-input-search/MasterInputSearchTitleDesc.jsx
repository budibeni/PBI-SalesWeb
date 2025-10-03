// File: components/master-input-search/MasterInputSearchTitleDesc.jsx
"use client";
import React from "react";
import MasterInputSearch from "./MasterInputSearch";

export default function MasterInputSearchTitleDesc(props) {
    return (
        <MasterInputSearch
            {...props}
            renderItem={(row, { titleOf, descOf }) => (
                <div className="flex flex-col w-full">
                    <span className="font-medium leading-tight">{titleOf(row)}</span>
                    <span className="text-xs opacity-70 leading-snug whitespace-normal break-words">
            {descOf(row)}
          </span>
                </div>
            )}
        />
    );
}