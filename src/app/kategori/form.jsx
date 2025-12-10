"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import NumericInput from "@/components/ui/NumericInput"
import { Plus, Pencil } from "lucide-react"

// ===== Utility lokal (boleh disatukan ke helper kalau mau) =====
const api = async (url, init) => {
    const res = await fetch(url, init)
    const j = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(j.error || "Request gagal")
    return j
}

const numToStr = (v) => (v == null || Number.isNaN(v) ? "" : String(v))
const toNullNum = (s) => (s === "" || s == null ? null : Number(s))

export default function Form({ mode = "create", initial = {}, onDone }) {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)

    const seed = (r) => ({
        kategori: r.kategori ?? "",
        customer: r.customer ?? "",
        persentase: numToStr(r.persentase),
        minAchKomisiDasar: numToStr(r.minAchKomisiDasar),
        minAchBonusUtama: numToStr(r.minAchBonusUtama),
        valueBonusUtama: numToStr(r.valueBonusUtama),
        minAchBonusExtra: numToStr(r.minAchBonusExtra),
        valueBonusExtra: numToStr(r.valueBonusExtra),
    })

    const [f, setF] = useState(() => seed(initial))

    useEffect(() => {
        if (open) setF(seed(initial))
    }, [open, initial?.id])

    const submit = async (e) => {
        e.preventDefault()

        if (!f.kategori.trim()) return alert("Kategori wajib diisi")

        if (mode === "create") {
            if (!f.customer) {
                return alert("Customer wajib dipilih (PROJECT atau RETAIL)")
            }
        }

        setBusy(true)
        try {
            const basePayload = {
                persentase: toNullNum(f.persentase),
                minAchKomisiDasar: toNullNum(f.minAchKomisiDasar),
                minAchBonusUtama: toNullNum(f.minAchBonusUtama),
                valueBonusUtama: toNullNum(f.valueBonusUtama),
                minAchBonusExtra: toNullNum(f.minAchBonusExtra),
                valueBonusExtra: toNullNum(f.valueBonusExtra),
            }

            const payload =
                mode === "create"
                    ? {
                        kategori: f.kategori.trim(),
                        customer: f.customer,
                        ...basePayload,
                    }
                    : basePayload // PATCH: tidak boleh mengubah kategori+customer

            const url = mode === "create" ? "/api/kategori" : `/api/kategori/${initial.id}`
            const method = mode === "create" ? "POST" : "PATCH"

            await api(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            alert("Tersimpan ✔︎")
            setOpen(false)
            onDone?.()
        } catch (err) {
            alert("Gagal menyimpan: " + err.message)
        } finally {
            setBusy(false)
        }
    }

    const title = mode === "create" ? "Tambah Komisi" : "Edit Komisi"

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" /> Tambah
                    </Button>
                ) : (
                    <Button size="sm" variant="outline">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-h-[85dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Customer *">
                        <select
                            value={f.customer}
                            onChange={(e) =>
                                setF((s) => ({ ...s, customer: e.target.value }))
                            }
                            disabled={mode === "edit"}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="">-- Pilih Customer --</option>
                            <option value="PROJECT">PROJECT</option>
                            <option value="RETAIL">RETAIL</option>
                        </select>
                    </Field>

                    <Field label="Kategori *">
                        <Input
                            autoFocus
                            value={f.kategori}
                            onChange={(e) =>
                                setF((s) => ({ ...s, kategori: e.target.value }))
                            }
                            placeholder="BLOCK / SLAB / BOND / SHIELD"
                            disabled={mode === "edit"} // kategori tidak boleh diubah saat edit
                        />
                    </Field>

                    <p className="text-xs text-muted-foreground">
                        Isi data di bawah ini dalam bentuk desimal. Contoh: 10% ditulis{" "}
                        <b>0.10</b>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Min Ach Komisi Dasar */}
                        <Field
                            label="Min Ach Komisi Dasar"
                            keterangan="Min achievement untuk komisi dasar"
                        >
                            <NumericInput
                                value={f.minAchKomisiDasar ?? ""}
                                onValue={(v) =>
                                    setF((s) => ({
                                        ...s,
                                        minAchKomisiDasar:
                                            typeof v === "string" ? v : "",
                                    }))
                                }
                                decimalScale={8}
                                fixedDecimalScale={false}
                                allowNegative={false}
                                className="w-full"
                            />
                        </Field>

                        {/* Value Kategori Item (persentase) */}
                        <Field
                            label="Value Kategori Item"
                            keterangan="Rumus: value × achievement × margin"
                        >
                            <NumericInput
                                value={f.persentase ?? ""}
                                onValue={(v) =>
                                    setF((s) => ({
                                        ...s,
                                        persentase:
                                            typeof v === "string" ? v : "",
                                    }))
                                }
                                decimalScale={8}
                                fixedDecimalScale={false}
                                allowNegative={false}
                                className="w-full"
                            />
                        </Field>

                        {/* Min Ach Bonus Utama */}
                        <Field
                            label="Min Ach Bonus Utama"
                            keterangan="Min achievement untuk bonus utama"
                        >
                            <NumericInput
                                value={f.minAchBonusUtama ?? ""}
                                onValue={(v) =>
                                    setF((s) => ({
                                        ...s,
                                        minAchBonusUtama:
                                            typeof v === "string" ? v : "",
                                    }))
                                }
                                decimalScale={8}
                                fixedDecimalScale={false}
                                allowNegative={false}
                                className="w-full"
                            />
                        </Field>

                        {/* Value Bonus Utama */}
                        <Field
                            label="Value Bonus Utama"
                            keterangan="Rumus: Komisi Dasar × value"
                        >
                            <NumericInput
                                value={f.valueBonusUtama ?? ""}
                                onValue={(v) =>
                                    setF((s) => ({
                                        ...s,
                                        valueBonusUtama:
                                            typeof v === "string" ? v : "",
                                    }))
                                }
                                decimalScale={8}
                                fixedDecimalScale={false}
                                allowNegative={false}
                                className="w-full"
                            />
                        </Field>

                        {/* Min Ach Bonus Extra */}
                        <Field
                            label="Min Ach Bonus Extra"
                            keterangan="Min achievement untuk bonus extra"
                        >
                            <NumericInput
                                value={f.minAchBonusExtra ?? ""}
                                onValue={(v) =>
                                    setF((s) => ({
                                        ...s,
                                        minAchBonusExtra:
                                            typeof v === "string" ? v : "",
                                    }))
                                }
                                decimalScale={8}
                                fixedDecimalScale={false}
                                allowNegative={false}
                                className="w-full"
                            />
                        </Field>

                        {/* Value Bonus Extra */}
                        <Field
                            label="Value Bonus Extra"
                            keterangan="Rumus: (value × kategori item) × (margin − (margin / ach)) × ach"
                        >
                            <NumericInput
                                value={f.valueBonusExtra ?? ""}
                                onValue={(v) =>
                                    setF((s) => ({
                                        ...s,
                                        valueBonusExtra:
                                            typeof v === "string" ? v : "",
                                    }))
                                }
                                decimalScale={8}
                                fixedDecimalScale={false}
                                allowNegative={false}
                                className="w-full"
                            />
                        </Field>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={busy}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={busy}>
                            Simpan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// Field lokal untuk KomisiForm
function Field({ label, children, keterangan = "" }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">{label}</label>
            {children}
            {keterangan && (
                <p className="text-xs text-muted-foreground">{keterangan}</p>
            )}
        </div>
    )
}
