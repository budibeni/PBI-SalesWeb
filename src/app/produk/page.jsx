"use client"

import { useMemo, useState } from "react"
import useItems from "@/hooks/useItems"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Image as ImageIcon,
    Link as LinkIcon,
    RefreshCw,
    Table as TableIcon,
    LayoutGrid
} from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"

export default function ProdukPage() {
    const { ready, loading, items, categories, refresh } = useItems()
    const [q, setQ] = useState("")
    const [cat, setCat] = useState("__ALL__")
    const [mode, setMode] = useState("card") // "card" | "table"

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase()
        return items.filter((it) => {
            const okCat = cat === "__ALL__" || it.kategori === cat
            if (!qq) return okCat
            const hay = `${it.kodeItem || ""} ${it.namaItem || ""} ${it.jenisItem || ""} ${it.kategori || ""}`.toLowerCase()
            return okCat && hay.includes(qq)
        })
    }, [items, q, cat])

    return (
        <Card className="mx-auto max-w-6xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Produk</CardTitle>
                <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {loading ? "Memuat…" : ready ? `Total ${filtered.length} / ${items.length}` : "Siapkan data…"}
          </span>
                    <Button variant="outline" size="sm" onClick={() => refresh()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>

                    {/* Toggle Mode */}
                    <ToggleGroup
                        type="single"
                        value={mode}
                        onValueChange={(v) => v && setMode(v)}
                        className="ml-2 hidden sm:flex"
                    >
                        <ToggleGroupItem value="card" aria-label="Tampilan Card">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="table" aria-label="Tampilan Table">
                            <TableIcon className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        placeholder="Cari kode/nama/jenis/kategori…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="w-full"
                    />
                    <Select value={cat} onValueChange={setCat}>
                        <SelectTrigger className="w-full sm:w-60">
                            <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__ALL__">(Semua kategori)</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* === Tampilan Card === */}
                {mode === "card" && (
                    filtered.length === 0 ? (
                        <div className="py-14 text-center text-muted-foreground">Tidak ada data</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((it) => (
                                <Card key={it.id} className="overflow-hidden p-0">
                                    {/* Gambar */}
                                    <div className="aspect-[16/9] w-full bg-muted/40 flex items-center justify-center overflow-hidden">
                                        {it.gambarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={it.gambarUrl}
                                                alt={it.namaItem}
                                                className="h-full w-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <ImageIcon className="h-8 w-8 mb-2" />
                                                <span className="text-xs">Tidak ada gambar</span>
                                            </div>
                                        )}
                                    </div>

                                    <CardContent className="px-4 pb-4 space-y-2">
                                        <div className="font-medium leading-snug">{it.kodeItem}</div>
                                        <div className="text-xs text-muted-foreground">{it.namaItem}</div>
                                        {it.linkWeb && (
                                            <Button asChild variant="outline" size="sm" className="mt-2">
                                                <a href={it.linkWeb} target="_blank" rel="noopener noreferrer">
                                                    <LinkIcon className="h-4 w-4 mr-2" /> Buka Link
                                                </a>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )
                )}

                {/* === Tampilan Table === */}
                {mode === "table" && (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-36">Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead className="w-40">Kategori</TableHead>
                                    <TableHead className="w-40">Gambar</TableHead>
                                    <TableHead className="w-40">Link</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((it) => (
                                    <TableRow key={it.id}>
                                        <TableCell className="font-medium">{it.kodeItem}</TableCell>
                                        <TableCell>{it.namaItem}</TableCell>
                                        <TableCell>{it.kategori || "—"}</TableCell>
                                        <TableCell>
                                            {it.gambarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={it.gambarUrl}
                                                    alt={it.namaItem}
                                                    className="h-10 w-16 rounded object-cover border"
                                                />
                                            ) : (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <ImageIcon className="h-4 w-4" /> Tidak ada
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {it.linkWeb ? (
                                                <Button asChild size="sm" variant="outline">
                                                    <a href={it.linkWeb} target="_blank" rel="noopener noreferrer">
                                                        <LinkIcon className="h-4 w-4 mr-1" /> Buka
                                                    </a>
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Tidak ada</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
