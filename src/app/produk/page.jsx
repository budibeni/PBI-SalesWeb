"use client"

import useItems from "@/hooks/useItems"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function ProdukPage() {
    const { ready, loading, items, categories, refresh } = useItems()
    const [q, setQ] = useState("")
    const [cat, setCat] = useState("__ALL__")

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase()
        return items.filter((it) => {
            const okCat = cat === "__ALL__" || it.kategori === cat
            if (!qq) return okCat
            const hay =
                `${it.kodeItem || ""} ${it.namaItem || ""} ${it.merek || ""} ${it.kategori || ""}`.toLowerCase()
            return okCat && hay.includes(qq)
        })
    }, [items, q, cat])

    return (
        <div className="p-4">
            <Card className="mx-auto max-w-6xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Produk</CardTitle>
                    <div className="text-xs text-muted-foreground">
                        {loading ? "Memuat…" : ready ? `Total ${filtered.length} / ${items.length}` : "Siapkan data…"}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input placeholder="Cari kode/nama/merek/kategori…" value={q} onChange={(e)=>setQ(e.target.value)} />
                        <Select value={cat} onValueChange={setCat}>
                            <SelectTrigger className="w-full sm:w-60"><SelectValue placeholder="Kategori" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__ALL__">(Semua kategori)</SelectItem>
                                {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={()=>refresh()}>Refresh</Button>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-36">Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead className="w-40">Kategori</TableHead>
                                    <TableHead className="w-32">Satuan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((it) => (
                                    <TableRow key={it.id}>
                                        <TableCell className="font-medium">{it.kodeItem}</TableCell>
                                        <TableCell>{it.namaItem}</TableCell>
                                        <TableCell>{it.kategori || "—"}</TableCell>
                                        <TableCell>{it.nilaiSatuan ? `${it.nilaiSatuan} ${it.satuan}` : it.satuan}</TableCell>
                                    </TableRow>
                                ))}
                                {filtered.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
