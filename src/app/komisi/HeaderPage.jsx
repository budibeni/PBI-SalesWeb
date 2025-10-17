"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Save, Trash2 } from "lucide-react";
import TargetKomisi from "./TargetKomisi";

/**
 * Komponen HeaderPage
 * Menangani seluruh tampilan dan kontrol untuk “Target Komisi”
 *
 * Props:
 * - loading, ready: state dari useItems
 * - rows, setRows: kontrol tabel (hanya digunakan untuk tombol bersihkan)
 * - refresh: fungsi refresh data
 * - targetGlobalRaw, setTargetGlobalRaw
 * - targetPerKategoriRaw, setTargetPerKategoriRaw
 * - setTargetComputed: callback hasil hitungan TargetKomisi
 */
export default function HeaderPage({
                                              loading,
                                              ready,
                                              rows,
                                              setRows,
                                              refresh,
                                              targetGlobalRaw,
                                              setTargetGlobalRaw,
                                              targetPerKategoriRaw,
                                              setTargetPerKategoriRaw,
                                              setTargetComputed,
                                          }) {
    return (
        <Card className="mx-auto max-w-6xl py-4 sm:py-6 gap-4 sm:gap-6">
            <div className="px-4 sm:px-6 flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <div className="flex-1 text-base sm:text-lg">Target Komisi</div>
                <div className="text-xs text-muted-foreground sm:whitespace-nowrap">
                    {loading ? "Memuat…" : ready ? `Item : ${rows.length}` : "Siapkan data…"}
                </div>

                {/* Tombol Refresh */}
                <Button
                    variant="outline"
                    onClick={refresh}
                    className="sm:w-auto flex items-center justify-center gap-1"
                    title="Refresh data"
                >
                    <RefreshCcw className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Refresh</span>
                </Button>

                {/* Tombol Bersihkan */}
                <Button
                    variant="outline"
                    onClick={() => setRows([])}
                    disabled={rows.length === 0}
                    className="sm:w-auto flex items-center justify-center gap-1"
                    title="Bersihkan"
                >
                    <Trash2 className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Bersihkan</span>
                </Button>

                {/* Tombol Simpan */}
                <Button
                    onClick={() => console.log("TODO: simpan target komisi")}
                    disabled={rows.length === 0}
                    className="sm:w-auto flex items-center justify-center gap-1"
                    title="Simpan"
                >
                    <Save className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Simpan</span>
                </Button>
            </div>

            <CardContent className="px-2">
                <TargetKomisi
                    valueGlobal={targetGlobalRaw}
                    onChangeGlobal={setTargetGlobalRaw}
                    valuePerKategori={targetPerKategoriRaw}
                    onChangePerKategori={setTargetPerKategoriRaw}
                    onComputed={setTargetComputed}
                />
            </CardContent>
        </Card>
    );
}
