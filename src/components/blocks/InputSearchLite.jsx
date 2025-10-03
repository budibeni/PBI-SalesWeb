"use client";
import * as React from "react";
import {
    Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

import useVisualViewportSize from "@/hooks/useVisualViewportSize";
import { useIsMobile } from "@/hooks/useIsMobile";

// --- utils ---
const get = (obj, path) =>
    (path || "").split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

function useDebounce(value, ms = 250) {
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

/**
 * InputSearchLite — inline picker (judul + deskripsi)
 *
 * Props:
 * - value: object|null
 * - onChange: (row|null)=>void
 * - fetchData: (q:string)=>Promise<object[]>
 * - titleKey / descriptionKey  (atau getTitle / getDescription)
 * - searchKeys?: string[]
 * - placeholder, emptyText, groupLabel
 * - useDialogOnMobile?: boolean (default true)
 * - buttonClassName, popoverClassName, allowClear, disabled, initialFetch
 * - onClear?: ()=>void
 */
const InputSearchLite = React.forwardRef(function InputSearchLite(
    {
        value,
        onChange,
        fetchData,
        titleKey,
        descriptionKey,
        getTitle,
        getDescription,
        searchKeys,
        placeholder = "Cari…",
        emptyText = "Tidak ada data.",
        groupLabel = "Hasil",
        allowClear = true,
        buttonClassName = "w-full justify-between",
        popoverClassName = "",
        initialFetch = true,
        disabled = false,
        useDialogOnMobile = true,
        onClear,
    },
    ref
) {
    const [open, setOpen] = React.useState(false);
    const [q, setQ] = React.useState("");
    const dq = useDebounce(q, 250);

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState("");

    const isMobile = useIsMobile();
    const vvHeight = useVisualViewportSize(open);

    const titleOf = (row) =>
        getTitle?.(row) ?? (titleKey ? String(get(row, titleKey) ?? "") : "");
    const descOf = (row) =>
        getDescription?.(row) ??
        (descriptionKey ? String(get(row, descriptionKey) ?? "") : "");

    const itemValueOf = (row) => {
        const keys = searchKeys?.length
            ? searchKeys
            : [titleKey, descriptionKey].filter(Boolean);
        return String(keys.map((k) => get(row, k)).filter(Boolean).join(" "));
    };

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

    const handleSelect = (row) => { onChange?.(row); setOpen(false); };
    const doClear = () => { onChange?.(null); onClear?.(); };

    React.useImperativeHandle(ref, () => ({
        clear: () => doClear(),
        open: () => setOpen(true),
        close: () => setOpen(false),
        setQuery: (text) => setQ(text ?? ""),
    }), []);

    const label = value
        ? (() => {
            const t = titleOf(value);
            const d = descOf(value);
            return d ? `${t} - ${d}` : (t || placeholder);
        })()
        : null;

    const Trigger = (
        <Button
            type="button"
            variant="outline"
            className={buttonClassName}
            disabled={disabled}
            onClick={() => setOpen(true)}
        >
      <span className={`truncate ${!label ? "opacity-60" : ""}`}>
        {label || placeholder}
      </span>
            <span className="flex items-center gap-2">
        {allowClear && value && !disabled && (
            <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                title="Hapus"
                aria-label="Hapus pilihan"
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); doClear(); }}
            >
                <X className="h-4 w-4 opacity-60 hover:opacity-100" />
            </button>
        )}
                <kbd className="hidden md:inline-block text-[10px] opacity-60">Enter pilih</kbd>
      </span>
        </Button>
    );

    // ===== Mobile: Dialog full-screen, keyboard-safe =====
    if (useDialogOnMobile && isMobile) {
        return (
            <>
                {Trigger}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent
                        className="p-0 gap-0 border-0 rounded-none !max-w-none !w-screen overflow-y-auto"
                        style={{ height: vvHeight ? `${vvHeight}px` : "100dvh" }}
                    >
                        <div className="flex flex-col min-h-full pb-[env(safe-area-inset-bottom)]">
                            <Command className="flex-1">
                                <CommandInput placeholder={placeholder} value={q} onValueChange={setQ} />
                                <CommandList className="max-h-[75svh]">
                                    {loading && <div className="p-3 text-sm opacity-70">Memuat…</div>}
                                    {!loading && err && <div className="p-3 text-sm text-red-600">{err}</div>}
                                    {!loading && !err && (
                                        <>
                                            <CommandEmpty>{emptyText}</CommandEmpty>
                                            <CommandGroup heading={groupLabel}>
                                                {rows.map((row, i) => (
                                                    <CommandItem
                                                        key={i}
                                                        value={itemValueOf(row)}
                                                        onSelect={() => handleSelect(row)}
                                                    >
                                                        <div className="flex flex-col w-full">
                                                            <span className="font-medium leading-tight">{titleOf(row)}</span>
                                                            {(descriptionKey || getDescription) && (
                                                                <span className="text-xs opacity-70 leading-snug truncate">
                                  {descOf(row)}
                                </span>
                                                            )}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </>
                                    )}
                                </CommandList>
                            </Command>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // ===== Desktop/Tablet: Popover responsif =====
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
                <Command>
                    <CommandInput placeholder={placeholder} value={q} onValueChange={setQ} />
                    <CommandList className="max-h-[min(70vh,28rem)]">
                        {loading && <div className="p-3 text-sm opacity-70">Memuat…</div>}
                        {!loading && err && <div className="p-3 text-sm text-red-600">{err}</div>}
                        {!loading && !err && (
                            <>
                                <CommandEmpty>{emptyText}</CommandEmpty>
                                <CommandGroup heading={groupLabel}>
                                    {rows.map((row, i) => (
                                        <CommandItem
                                            key={i}
                                            value={itemValueOf(row)}
                                            onSelect={() => handleSelect(row)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex flex-col w-full">
                                                <span className="font-medium leading-tight">{titleOf(row)}</span>
                                                {(descriptionKey || getDescription) && (
                                                    <span className="text-xs opacity-70 leading-snug truncate">
                                                        {descOf(row)}
                                                      </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
});

export default InputSearchLite;
