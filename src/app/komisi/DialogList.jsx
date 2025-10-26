"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Trash2 } from "lucide-react"

export default function DialogList({
                                       open,
                                       onOpenChange,
                                       items = [],
                                       onSelect,
                                       onPrint,
                                       onDelete,
                                       emptyText = "Belum ada data tersimpan.",
                                   }) {
    const handleDelete = async (id, judul) => {
        const confirmDelete = window.confirm(`Hapus simulasi "${judul || "(Tanpa Judul)"}"?`)
        if (confirmDelete) {
            onDelete?.(id)
        }
    }

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
                            className="border rounded p-2 hover:bg-accent/60 transition flex justify-between items-center gap-2"
                        >
                            {/* Klik area untuk load detail */}
                            <div
                                className="flex-1 cursor-pointer"
                                onClick={() => onSelect?.(d.id)}
                            >
                                <div className="font-medium">{d.judul || "(Tanpa Judul)"}</div>
                                <div className="text-xs text-muted-foreground">
                                    Total: Rp. {Number(d.subtotalTotal || 0).toLocaleString("id-ID")} •{" "}
                                    {d.dibuatTanggal
                                        ? new Date(d.dibuatTanggal).toLocaleString("id-ID")
                                        : "-"}
                                </div>
                            </div>

                            {/* Tombol print */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Cetak Simulasi"
                                onClick={() => onPrint?.(d.id)}
                            >
                                <Printer className="h-4 w-4 text-blue-600" />
                            </Button>

                            {/* Tombol hapus */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Hapus Simulasi"
                                onClick={() => handleDelete(d.id, d.judul)}
                            >
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
