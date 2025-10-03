
// File: components/master-input-search/MasterInputCheckbox.jsx
"use client";
import * as React from "react";
import {
    Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

import useVisualViewportSize from "@/hooks/useVisualViewportSize";
import { useIsMobile } from "@/hooks/useIsMobile";

const get = (obj, path) => (path || "").split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
function useDebounce(value, ms = 250) {
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

/**
 * MasterInputCheckbox — multi select picker (checkbox style)
 *
 * Props:
 * - values: object[] (data terpilih), controlled
 * - onChange: (rows: object[]) => void
 * - fetchData: (q:string)=>Promise<object[]>
 * - keyField?: string (default: "id" jika ada; kalau tidak, dipakai JSON.stringify(row))
 * - titleKey / descriptionKey  (atau getTitle / getDescription)
 * - searchKeys?: string[]
 * - placeholder, emptyText, groupLabel
 * - allowClear, disabled, initialFetch
 * - useDialogOnMobile?: boolean (default true)
 * - closeButton?: boolean (default true) — tampilkan tombol "Selesai" untuk menutup popover/dialog
 */
export default function MasterInputCheckbox({
                                                values = [],
                                                onChange,
                                                fetchData,
                                                keyField,
                                                titleKey,
                                                descriptionKey,
                                                getTitle,
                                                getDescription,
                                                searchKeys,
                                                placeholder = "Cari & centang beberapa data…",
                                                emptyText = "Tidak ada data.",
                                                groupLabel = "Centang yang ingin dipilih",
                                                allowClear = true,
                                                buttonClassName = "w-full justify-between",
                                                popoverClassName = "",
                                                initialFetch = true,
                                                disabled = false,
                                                useDialogOnMobile = true,
                                                closeButton = true,
                                                // NEW: kontrol ringkasan label pada tombol
                                                summaryMax = 3,                  // gabungkan nama sampai N item
                                                summarySeparator = ", ",        // pemisah antar judul
                                                formatSummary,                   // (rows, helpers) => string (override total)
                                            }, ref) {
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(false);
    const [q, setQ] = React.useState("");
    const dq = useDebounce(q, 250);

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState("");

    const vvHeight = useVisualViewportSize(open);

    const titleOf = (row) => getTitle?.(row) ?? (titleKey ? String(get(row, titleKey) ?? "") : "");
    const descOf  = (row) => getDescription?.(row) ?? (descriptionKey ? String(get(row, descriptionKey) ?? "") : "");

    const getRowKey = (row) => {
        if (keyField) return String(get(row, keyField));
        if (row && "id" in (row || {})) return String(row.id);
        try { return JSON.stringify(row); } catch { return String(row); }
    };

    const selectedKeys = React.useMemo(() => new Set((values || []).map(getRowKey)), [values]);

    const defaultItemValueOf = (row) => {
        const keys = searchKeys?.length ? searchKeys : [titleKey, descriptionKey].filter(Boolean);
        return String(keys.map((k) => get(row, k)).filter(Boolean).join(" "));
    };

    const itemValueOf = (row) => defaultItemValueOf(row) || "";

    React.useEffect(() => {
        if (!open) return;
        let alive = true;
        setLoading(true);
        setErr("");
        Promise.resolve(fetchData(dq))
            .then((res) => { if (alive) setRows(Array.isArray(res) ? res : []); })
            .catch((e) => { if (alive) setErr(e?.message || "Gagal memuat data"); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [dq, open, fetchData]);

    const onOpenChange = (v) => {
        setOpen(v);
        if (v && initialFetch && q === "") setQ("");
    };

    const toggleRow = (row) => {
        const k = getRowKey(row);
        let next;
        if (selectedKeys.has(k)) {
            next = (values || []).filter((r) => getRowKey(r) !== k);
        } else {
            next = [ ...(values || []), row ];
        }
        onChange?.(next);
    };

    const doClear = () => onChange?.([]);

    React.useImperativeHandle(ref, () => ({
        clear: () => doClear(),
        open: () => setOpen(true),
        close: () => setOpen(false),
        setQuery: (text) => setQ(text ?? ""),
    }), [values]);

    const summaryLabel = () => {
        if (typeof formatSummary === "function") {
            return formatSummary(values || [], { get, titleOf, descOf });
        }
        if (!values || values.length === 0) return placeholder;

        const names = (values || []).map((r) => titleOf(r) || String(get(r, keyField || "value") ?? ""));

        if (names.length <= summaryMax) {
            return names.join(summarySeparator).trim();
        }
        // jika lebih dari summaryMax, tampilkan N pertama lalu +sisa
        const shown = names.slice(0, summaryMax).join(summarySeparator).trim();
        const rest = names.length - summaryMax;
        return `${shown} +${rest}`;
    };

    const Trigger = (
        <Button type="button" variant="outline" className={buttonClassName} disabled={disabled} onClick={() => setOpen(true)}>
            <span className={`truncate ${(!values || values.length===0) ? "opacity-60" : ""}`}>{summaryLabel()}</span>
            <span className="flex items-center gap-2">
        {allowClear && (values?.length > 0) && !disabled && (
            <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                title="Hapus semua"
                aria-label="Hapus semua"
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); doClear(); }}
            >
                <X className="h-4 w-4 opacity-60 hover:opacity-100" />
            </button>
        )}
                <kbd className="hidden md:inline-block text-[10px] opacity-60">Space/Click centang</kbd>
      </span>
        </Button>
    );

    const ListBody = (
        <>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup heading={groupLabel}>
                {rows.map((row, i) => {
                    const k = getRowKey(row);
                    const checked = selectedKeys.has(k);
                    return (
                        <CommandItem
                            key={i}
                            value={itemValueOf(row)}
                            onSelect={() => toggleRow(row)}
                            className="cursor-pointer"
                        >
                            <div className={`mr-3 h-4 w-4 rounded border flex items-center justify-center ${checked ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                                {checked && <Check className="h-3.5 w-3.5" />}
                            </div>
                            <div className="flex flex-col w-full min-w-0">
                                <span className="font-medium leading-tight truncate">{titleOf(row)}</span>
                                {(descriptionKey || getDescription) && (
                                    <span className="text-xs opacity-70 leading-snug truncate">{descOf(row)}</span>
                                )}
                            </div>
                        </CommandItem>
                    );
                })}
            </CommandGroup>
        </>
    );

    const Footer = closeButton ? (
        <div className="flex items-center justify-between gap-2 p-2 border-t bg-background/50">
            <div className="text-xs opacity-70">Terpilih: {values?.length || 0}</div>
            <div className="flex items-center gap-2">
                {allowClear && (values?.length > 0) && (
                    <Button variant="ghost" size="sm" onClick={doClear}>Bersihkan</Button>
                )}
                <Button size="sm" onClick={() => setOpen(false)}>Selesai</Button>
            </div>
        </div>
    ) : null;

    if (useDialogOnMobile && isMobile) {
        return (
            <>
                {Trigger}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="p-0 gap-0 border-0 rounded-none !max-w-none !w-screen overflow-y-auto" style={{ height: vvHeight ? `${vvHeight}px` : "100dvh" }}>
                        <div className="flex flex-col min-h-full pb-[env(safe-area-inset-bottom)]">
                            <Command className="flex-1">
                                <CommandInput placeholder={placeholder} value={q} onValueChange={setQ} />
                                <CommandList className="max-h-[70svh]">
                                    {loading && <div className="p-3 text-sm opacity-70">Memuat…</div>}
                                    {!loading && err && <div className="p-3 text-sm text-red-600">{err}</div>}
                                    {!loading && !err && ListBody}
                                </CommandList>
                            </Command>
                            {Footer}
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
            <PopoverContent
                className={`p-0 w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-1rem)] ${popoverClassName}`}
                align="start"
                side="bottom"
                sideOffset={6}
                collisionPadding={8}
            >
                <div className="flex flex-col max-h-[min(70vh,28rem)]">
                    <Command>
                        <CommandInput placeholder={placeholder} value={q} onValueChange={setQ} />
                        <CommandList className="overflow-auto">
                            {loading && <div className="p-3 text-sm opacity-70">Memuat…</div>}
                            {!loading && err && <div className="p-3 text-sm text-red-600">{err}</div>}
                            {!loading && !err && ListBody}
                        </CommandList>
                    </Command>
                    {Footer}
                </div>
            </PopoverContent>
        </Popover>
    );
}
