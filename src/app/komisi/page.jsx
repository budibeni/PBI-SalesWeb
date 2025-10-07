"use client"

import useItems from "@/hooks/useItems"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function KomisiPage() {
    const { items } = useItems()
    return (
        <div className="p-4">
            <Card className="mx-auto max-w-6xl">
                <CardHeader><CardTitle>Komisi Produk</CardTitle></CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-36">Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead className="w-40">Komisi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((it) => (
                                    <TableRow key={it.id}>
                                        <TableCell className="font-medium">{it.kodeItem}</TableCell>
                                        <TableCell>{it.namaItem}</TableCell>
                                        <TableCell>{it.persentaseKomisi != null ? `${(it.persentaseKomisi * 100).toFixed(2)}%` : "—"}</TableCell>
                                    </TableRow>
                                ))}
                                {items.length === 0 && (
                                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
