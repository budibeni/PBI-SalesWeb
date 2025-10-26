"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function DialogList({
                                               open,
                                               onOpenChange,
                                               items = [],
                                               onSelect,        // function (id) => void
                                               emptyText = "Belum ada data tersimpan.",
                                           }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Daftar Simulasi Komisi</DialogTitle>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto space-y-2">
                    {(!items || items.length === 0) && (
                        <div className="text-sm text-muted-foreground">{emptyText}</div>
                    )}

                    {items?.map((d) => (
                        <div
                            key={d.id}
                            className="border rounded p-2 hover:bg-accent cursor-pointer"
                            onClick={() => onSelect?.(d.id)}
                        >
                            <div className="font-medium">{d.judul}</div>
                            <div className="text-xs text-muted-foreground">
                                Total: Rp. {Number(d.subtotalTotal || 0).toLocaleString("id-ID")} •{" "}
                                {d.dibuatTanggal ? new Date(d.dibuatTanggal).toLocaleString("id-ID") : "-"}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
