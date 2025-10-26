"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DialogSave({
                                               open,
                                               onOpenChange,
                                               judul,
                                               onChangeJudul,
                                               onConfirm,
                                               saving = false,
                                           }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Beri Judul Simulasi Komisi</DialogTitle>
                </DialogHeader>

                <Input
                    autoFocus
                    placeholder="Judul simulasi..."
                    value={judul}
                    onChange={(e) => onChangeJudul?.(e.target.value)}
                    disabled={saving}
                />

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange?.(false)}
                        disabled={saving}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={!judul || saving}
                    >
                        {saving ? "Menyimpan..." : "Simpan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
