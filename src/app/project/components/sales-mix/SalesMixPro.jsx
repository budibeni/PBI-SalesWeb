"use client";

import { useMemo, useState } from "react";
import {PRODUCTS} from "@/app/project/data/catalog";
import {
    fmtIDR, toNumber, unitFor, displayQty, warningBelowVC,
    rowSubtotal, perUnitCommission, computeSummary, computeSummarySplit, distributeGreedy,
} from "@/app/project/lib/commission";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";


export function SalesMixPro() {
    // ===== State
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(new Map());
    const [target, setTarget] = useState(0);
    const [targetAAC, setTargetAAC] = useState(0);
    const [targetBond, setTargetBond] = useState(0);
    const [useSplit, setUseSplit] = useState(false);
    const [achPctAAC, setAchPctAAC] = useState(null);
    const [achPctBond, setAchPctBond] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    // ===== Derived
    const items = useMemo(() => [...selected.values()], [selected]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((p) => {
            if (filter === "bond" && p.family.toLowerCase() !== "bond") return false;
            if (filter === "aac" && p.family.toLowerCase() !== "aac") return false;
            if (!q) return true;
            const s = p.search || `${p.sku} ${p.name}`.toLowerCase();
            return s.includes(q);
        });
    }, [items, filter, search]);

    const summary = useMemo(() => {
        return useSplit
            ? computeSummarySplit({ items, targetAAC, targetBond })
            : computeSummary({ items, target, achPctAAC, achPctBond });
    }, [items, useSplit, target, targetAAC, targetBond, achPctAAC, achPctBond]);

    const searchCandidates = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return [];
        return PRODUCTS
            .filter(p => !selected.has(p.sku) && (p.search?.includes(q) || p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)))
            .slice(0, 20);
    }, [search, selected]);

    // ===== Mutators
    const addProduct = (sku) => {
        if (selected.has(sku)) return;
        const base = PRODUCTS.find((x) => x.sku === sku);
        if (!base) return;
        const clone = { ...base, price: base.msrp || Math.max(base.vc || 0, 0), qty: null };
        const next = new Map(selected); next.set(sku, clone); setSelected(next);
    };
    const removeProduct = (sku) => { const next = new Map(selected); next.delete(sku); setSelected(next); };
    const setField = (sku, key, val) => { const next = new Map(selected); const p = next.get(sku); if (!p) return; p[key]=val; next.set(sku,{...p}); setSelected(next); };

    const distribute = () => {
        if (useSplit) {
            const aac = items.filter(p=>p.family==="AAC");
            const bond = items.filter(p=>p.family==="Bond");
            distributeGreedy({ items: aac, target: targetAAC });
            distributeGreedy({ items: bond, target: targetBond });
            const next = new Map(); [...aac, ...bond].forEach(p=>next.set(p.sku,{...p})); setSelected(next);
        } else {
            const arr = [...items]; distributeGreedy({ items: arr, target });
            const next = new Map(); arr.forEach(p=>next.set(p.sku,{...p})); setSelected(next);
        }
    };

    const resetAll = () => {
        setSelected(new Map()); setTarget(0); setTargetAAC(0); setTargetBond(0);
        setAchPctAAC(null); setAchPctBond(null); setUseSplit(false); setSearch("");
    };

    // ===== UI
    return (
        <div className="space-y-4">
            {/* Header controls */}
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader className="gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-xl">Sales Mix Pro</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="destructive" className="h-9" onClick={resetAll}>Reset</Button>
                            <Button variant="secondary" className="h-9" onClick={() => setSheetOpen(true)}>Save</Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex-1 min-w-64">
                            <Input
                                placeholder="Cari produk… (SKU/Nama) lalu pilih untuk menambah"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-neutral-800 border-neutral-700"
                            />
                            {search && (
                                <Card className="mt-2 bg-neutral-900 border-neutral-800">
                                    <CardContent className="p-2">
                                        <ScrollArea className="max-h-64">
                                            {searchCandidates.length ? (
                                                <div className="space-y-1">
                                                    {searchCandidates.map((p) => (
                                                        <button
                                                            key={p.sku}
                                                            className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-neutral-800 transition"
                                                            onClick={() => { addProduct(p.sku); setSearch(""); }}
                                                        >
                                                            <div className="font-medium">{p.sku}</div>
                                                            <div className="text-xs text-neutral-400">{p.name}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="px-2 py-1 text-sm text-neutral-400">Tidak ada hasil.</div>
                                            )}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge
                                variant={filter === "all" ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => setFilter("all")}
                            >Semua</Badge>
                            <Badge
                                variant={filter === "aac" ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => setFilter("aac")}
                            >AAC</Badge>
                            <Badge
                                variant={filter === "bond" ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => setFilter("bond")}
                            >Bond</Badge>
                        </div>
                    </div>
                </CardHeader>

                <Separator className="bg-neutral-800" />

                <CardContent className="pt-4 space-y-4">
                    <Tabs defaultValue="target-umum" onValueChange={(v)=>setUseSplit(v==="target-split")}>
                        <TabsList className="bg-neutral-800">
                            <TabsTrigger value="target-umum">Target Umum</TabsTrigger>
                            <TabsTrigger value="target-split">Target Terpisah</TabsTrigger>
                        </TabsList>

                        <TabsContent value="target-umum" className="pt-4">
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-300">Target Komisi Total (Rp)</div>
                                    <Input
                                        inputMode="numeric"
                                        value={target ? Math.round(target) : ""}
                                        onChange={(e)=>setTarget(toNumber(e.target.value))}
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-300">AAC % Ach (opsional)</div>
                                    <Input
                                        inputMode="numeric"
                                        placeholder="mis. 85"
                                        value={achPctAAC ?? ""}
                                        onChange={(e)=>setAchPctAAC(e.target.value===""?null:toNumber(e.target.value))}
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-300">Bond % Ach (opsional)</div>
                                    <Input
                                        inputMode="numeric"
                                        placeholder="mis. 90"
                                        value={achPctBond ?? ""}
                                        onChange={(e)=>setAchPctBond(e.target.value===""?null:toNumber(e.target.value))}
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="target-split" className="pt-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-300">Target AAC (Rp)</div>
                                    <Input
                                        inputMode="numeric"
                                        value={targetAAC ? Math.round(targetAAC) : ""}
                                        onChange={(e)=>setTargetAAC(toNumber(e.target.value))}
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-300">Target Bond (Rp)</div>
                                    <Input
                                        inputMode="numeric"
                                        value={targetBond ? Math.round(targetBond) : ""}
                                        onChange={(e)=>setTargetBond(toNumber(e.target.value))}
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex items-center gap-2">
                        <Button onClick={distribute}>Distribusi Otomatis</Button>
                        <Button variant="secondary" onClick={resetAll}>Reset</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-lg">Daftar Item</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-neutral-300">Produk</TableHead>
                                <TableHead className="text-neutral-300">MSRP</TableHead>
                                <TableHead className="text-neutral-300">Harga</TableHead>
                                <TableHead className="text-neutral-300">Qty</TableHead>
                                <TableHead className="text-neutral-300">Subtotal</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <div className="p-4 text-sm text-neutral-400">Belum ada produk. Cari di atas, lalu tekan Tambah.</div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((p)=>(
                                    <TableRow key={p.sku} className="hover:bg-neutral-850">
                                        <TableCell className="align-top">
                                            <div className="font-medium">{p.sku}</div>
                                            <div className="text-xs text-neutral-400">{p.name} • {p.family}</div>
                                            {warningBelowVC(p) && (
                                                <div className="text-xs text-amber-400 mt-1">Harga di bawah minimum.</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            {p.msrp ? (
                                                <Button size="sm" variant="ghost" onClick={()=>setField(p.sku,"price",p.msrp)}>
                                                    {fmtIDR(p.msrp)}
                                                </Button>
                                            ) : <span className="text-neutral-500 text-sm">—</span>}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    className="w-[12ch] bg-neutral-800 border-neutral-700"
                                                    inputMode="decimal"
                                                    value={p.price ?? ""}
                                                    onChange={(e)=>setField(p.sku,"price",toNumber(e.target.value))}
                                                    onBlur={()=>setField(p.sku,"price",Math.round(p.price||0))}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm" variant="outline"
                                                    onClick={()=>{
                                                        const step=p.step||1; const next=(p.qty||0)-step;
                                                        setField(p.sku,"qty", Math.max(0, step===1?Math.round(next):Math.round(next/step)*step));
                                                    }}
                                                >−</Button>
                                                <Input
                                                    className="w-[10ch] text-center bg-neutral-800 border-neutral-700"
                                                    inputMode={p.step===1?"numeric":"decimal"}
                                                    value={displayQty(p)}
                                                    onChange={(e)=>{
                                                        const raw=e.target.value.trim();
                                                        if(raw==="") return setField(p.sku,"qty",null);
                                                        const v=toNumber(raw), step=p.step||1;
                                                        let q= step===1 ? Math.max(0, Math.round(v)) : Math.max(0, Math.round(v/step)*step);
                                                        setField(p.sku,"qty", step===1?q:Math.round(q*10)/10);
                                                    }}
                                                />
                                                <Button
                                                    size="sm" variant="outline"
                                                    onClick={()=>{
                                                        const step=p.step||1; const next=(p.qty||0)+step;
                                                        setField(p.sku,"qty", step===1?Math.round(next):Math.round(next/step)*step);
                                                    }}
                                                >+</Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <div className="font-medium">{fmtIDR(rowSubtotal(p))}</div>
                                            <div className="text-xs text-neutral-400">({fmtIDR(perUnitCommission(p))}/{unitFor(p)})</div>
                                        </TableCell>
                                        <TableCell className="align-top text-right">
                                            <Button size="sm" variant="destructive" onClick={()=>removeProduct(p.sku)}>Hapus</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Summary sticky-style block */}
            <Card className="bg-neutral-900 border-neutral-800 sticky bottom-4">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <KPI label="Komisi Dasar" value={fmtIDR(summary.baseTotal || 0)} />
                        <KPI label="Bonus 1" value={fmtIDR(summary.bonus1 || 0)} dim={!summary.bonus1} />
                        <KPI label="Bonus 2" value={fmtIDR(summary.bonus2 || 0)} dim={!summary.bonus2} />
                        <KPI label="Subtotal" value={fmtIDR((summary.subtotal ?? summary.baseTotal) || 0)} />
                        <div className="ml-auto flex items-center gap-2">
                            <Button onClick={distribute}>Sim</Button>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        <Progress value={summary.pct || 0} className="h-2 w-full" />
                        <div className="text-sm w-12 text-right">{summary.pct || 0}%</div>
                    </div>
                    <div className="mt-2 text-xs text-neutral-400">
                        {useSplit
                            ? <>AAC tercapai: {fmtIDR(summary.baseA||0)} • sisa: {fmtIDR(summary.remAAC||0)} — BOND tercapai: {fmtIDR(summary.baseB||0)} • sisa: {fmtIDR(summary.remBond||0)}</>
                            : <>Sisa menuju target: {fmtIDR(summary.rem||0)}</>}
                    </div>
                </CardContent>
            </Card>

            {/* Save/Load (placeholder) */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="bottom" className="border-neutral-800 bg-neutral-900 text-neutral-100">
                    <SheetHeader>
                        <SheetTitle>Skenario</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                        <div className="text-sm text-neutral-400">Integrasi simpan lokal/API bisa ditambahkan di sini.</div>
                    </div>
                    <SheetFooter>
                        <Button variant="secondary" onClick={()=>setSheetOpen(false)}>Tutup</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function KPI({ label, value, dim }) {
    return (
        <div className={`rounded-md border px-3 py-2 ${dim ? "opacity-70" : ""} border-neutral-800 bg-neutral-900`}>
            <div className="text-xs text-neutral-400">{label}</div>
            <div className="text-base font-semibold">{value}</div>
        </div>
    );
}
