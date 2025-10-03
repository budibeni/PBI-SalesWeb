"use client";
import * as React from "react";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react"; // opsional: `npx shadcn add button` & lucide-react terpasang

// Debounce kecil biar hemat call API saat ketik
function useDebounce(value, ms = 250) {
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

/**
 * CommandCombobox (Reusable)
 * Props:
 * - value: any | null                      // nilai terpilih (object)
 * - onChange: (option|null)=>void          // dipanggil saat pilih/clear
 * - onSearch: (query:string)=>Promise<any[]>// fungsi pencarian async (return array)
 * - placeholder?: string
 * - emptyText?: string
 * - groupLabel?: string
 * - getOptionLabel?: (option)=>string
 * - getOptionValue?: (option)=>string      // untuk fuzzy-search internal
 * - renderOption?: (option)=>ReactNode     // custom tampilan item
 * - allowClear?: boolean                   // default true
 * - buttonClassName?: string               // styling tombol trigger
 * - popoverClassName?: string              // styling popover
 * - initialFetch?: boolean                 // fetch saat open tanpa query (default true)
 * - disabled?: boolean
 */
export default function CommandCombobox({
                                            value,
                                            onChange,
                                            onSearch,
                                            placeholder = "Cari…",
                                            emptyText = "Tidak ada hasil.",
                                            groupLabel = "Hasil",
                                            getOptionLabel = (o) => String(o?.label ?? o?.name ?? o?.title ?? ""),
                                            getOptionValue = (o) => {
                                                const id = o?.id ?? o?.value ?? o?.kode ?? o?.kode_item ?? "";
                                                return `${id} ${getOptionLabel(o)}`.trim();
                                            },
                                            renderOption,
                                            allowClear = true,
                                            buttonClassName = "w-full justify-between",
                                            popoverClassName = "p-0 w-[420px]",
                                            initialFetch = true,
                                            disabled = false,
                                        }) {
    const [open, setOpen] = React.useState(false);
    const [q, setQ] = React.useState("");
    const dq = useDebounce(q, 250);

    const [options, setOptions] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState("");

    // fetch saat query berubah
    React.useEffect(() => {
        if (!open) return; // hanya saat popover terbuka
        let alive = true;
        setLoading(true);
        setErr("");
        onSearch(dq)
            .then((res) => { if (alive) setOptions(Array.isArray(res) ? res : []); })
            .catch((e) => { if (alive) setErr(e?.message || "Gagal memuat data"); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [dq, onSearch, open]);

    // saat open pertama kali: load data awal (tanpa query)
    const handleOpenChange = (v) => {
        setOpen(v);
        if (v && initialFetch && q === "") {
            // trigger fetch awal (efek di atas akan jalan karena open === true)
            setQ("");
        }
    };

    const currentLabel = value ? getOptionLabel(value) : null;

    const handleSelect = (opt) => {
        onChange?.(opt);
        setOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange?.(null);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={buttonClassName}
                    disabled={disabled}
                >
          <span className={`truncate ${!currentLabel ? "opacity-60" : ""}`}>
            {currentLabel || placeholder}
          </span>
                    <span className="flex items-center gap-2">
            {allowClear && value && !disabled && (
                <X
                    className="h-4 w-4 opacity-60 hover:opacity-100"
                    onClick={handleClear}
                />
            )}
                        <kbd className="hidden md:inline-block text-[10px] opacity-60">Enter pilih</kbd>
          </span>
                </Button>
            </PopoverTrigger>

            <PopoverContent className={popoverClassName} align="start">
                <Command>
                    <CommandInput
                        placeholder={placeholder}
                        value={q}
                        onValueChange={setQ}
                    />
                    <CommandList className="max-h-64">
                        {loading && <div className="p-3 text-sm opacity-70">Memuat…</div>}

                        {!loading && err && (
                            <div className="p-3 text-sm text-red-600">{err}</div>
                        )}

                        {!loading && !err && (
                            <>
                                <CommandEmpty>{emptyText}</CommandEmpty>
                                <CommandGroup heading={groupLabel}>
                                    {options.map((opt, idx) => (
                                        <CommandItem
                                            key={idx}
                                            value={getOptionValue(opt)}      // penting untuk fuzzy search
                                            onSelect={() => handleSelect(opt)} // Enter pilih
                                        >
                                            {renderOption ? (
                                                renderOption(opt)
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{getOptionLabel(opt)}</span>
                                                </div>
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        <CommandSeparator />
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
