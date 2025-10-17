// components/master-input-search/MasterInputSearch.jsx
"use client";
import * as React from "react";
import {
    Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";

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

const MasterInputSearch = React.forwardRef(function MasterInputSearch(
    {
        value,
        onChange,
        fetchData,
        searchKeys,
        placeholder = "Cari dan pilih data…",
        emptyText = "Tidak ada data.",
        groupLabel = "Silahkan pilih dari hasil pencarian",
        initialFetch = true,
        disabled = false,
        useDialogOnMobile = true,

        // UI
        allowClear = true,
        buttonClassName = "w-full justify-between",
        popoverClassName = "",
        isResponsive = false, // <-- NEW

        // helpers
        titleKey,
        descriptionKey,
        imageKey,
        getTitle,
        getDescription,
        getImageSrc,

        // render kustom
        renderItem,
        getItemValue,
        groupHeaderExtra,

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

    const titleOf = (row) => getTitle?.(row) ?? (titleKey ? String(get(row, titleKey) ?? "") : "");
    const descOf  = (row) => getDescription?.(row) ?? (descriptionKey ? String(get(row, descriptionKey) ?? "") : "");
    const imgOf   = (row) => getImageSrc?.(row) ?? (imageKey ? String(get(row, imageKey) ?? "") : "");

    const defaultItemValueOf = (row) => {
        const keys = searchKeys?.length ? searchKeys : [titleKey, descriptionKey].filter(Boolean);
        return String(keys.map((k) => get(row, k)).filter(Boolean).join(" "));
    };
    const itemValueOf = (row) =>
        (getItemValue ? getItemValue(row, { titleOf, descOf, imgOf, get }) : defaultItemValueOf(row)) || "";

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

    const isIconOnly = isResponsive && isMobile;

    const Trigger = (
        <Button
            type="button"
            variant="outline"
            className={`${buttonClassName}`}
            disabled={disabled}
            onClick={() => setOpen(true)}
            aria-label={isIconOnly ? "Cari & pilih data" : (label || placeholder)}
            title={isIconOnly ? "Cari" : (label || placeholder)}
        >
            {isIconOnly ? (
                // Trigger ikon-only (khusus mobile + isResponsive)
                <Search className="h-5 w-5 opacity-70" />
            ) : (
                // Trigger normal (teks + optional clear)
                <span className="flex items-center justify-between w-full">
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
        </span>
            )}
        </Button>
    );

    const ListBody = (
        <>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup heading={groupLabel}>
                {groupHeaderExtra}
                {rows.map((row, i) => (
                    <CommandItem
                        key={i}
                        value={itemValueOf(row)}
                        onSelect={() => handleSelect(row)}
                        className="cursor-pointer"
                    >
                        {renderItem
                            ? renderItem(row, { titleOf, descOf, imgOf, get })
                            : (
                                <div className="flex flex-col w-full">
                                    <span className="font-medium leading-tight">{titleOf(row)}</span>
                                    {(descriptionKey || getDescription) && (
                                        <span className="text-xs opacity-70 leading-snug truncate">{descOf(row)}</span>
                                    )}
                                </div>
                            )}
                    </CommandItem>
                ))}
            </CommandGroup>
        </>
    );

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
                                    {!loading && !err && ListBody}
                                </CommandList>
                            </Command>
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
                <Command>
                    <CommandInput placeholder={placeholder} value={q} onValueChange={setQ} />
                    <CommandList className="max-h-[min(70vh,28rem)]">
                        {loading && <div className="p-3 text-sm opacity-70">Memuat…</div>}
                        {!loading && err && <div className="p-3 text-sm text-red-600">{err}</div>}
                        {!loading && !err && ListBody}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
});

export default MasterInputSearch;
