"use client";
import * as React from "react";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

/**
 * Hook debounce sederhana
 */
function useDebounce(value, ms = 250) {
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

/**
 * InputSearch (reusable)
 *
 * Props:
 * - value: object|null                // nilai terpilih (kirim balik dari onChange)
 * - onChange: (row|null)=>void        // dipanggil saat pilih baris (row dikirim utuh)
 * - fetchData: (q:string)=>Promise<Array<object>>
 * - columns: Array<{ key:string, label?:string, className?:string }>
 *      -> menentukan kolom apa yang ditampilkan dan urutannya
 * - searchKeys?: string[]             // daftar key yang dipakai fuzzy-search internal
 * - placeholder?: string
 * - emptyText?: string
 * - allowClear?: boolean
 * - displayValue?: (row)=>string      // label yang tampil di tombol saat ada pilihan
 * - buttonClassName?: string
 * - popoverClassName?: string
 * - initialFetch?: boolean            // true: load data awal saat dibuka
 * - disabled?: boolean
 */
export default function InputSearch({
                                        value,
                                        onChange,
                                        fetchData,
                                        columns,
                                        searchKeys,
                                        placeholder = "Cari…",
                                        emptyText = "Tidak ada data.",
                                        allowClear = true,
                                        displayValue = (row) => {
                                            // default label tombol: gabungan kolom pertama dan kedua jika ada
                                            if (!row) return "";
                                            if (columns?.length >= 2) {
                                                const a = safe(row, columns[0].key);
                                                const b = safe(row, columns[1].key);
                                                return [a, b].filter(Boolean).join(" — ");
                                            }
                                            if (columns?.length === 1) {
                                                return String(safe(row, columns[0].key) ?? "");
                                            }
                                            return "";
                                        },
                                        buttonClassName = "w-full justify-between",
                                        popoverClassName = "p-0 w-[560px]",
                                        initialFetch = true,
                                        disabled = false,
                                    }) {
    const [open, setOpen] = React.useState(false);
    const [q, setQ] = React.useState("");
    const dq = useDebounce(q, 250);

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState("");

    // util aman ambil nested key: "a.b.c"
    function safe(obj, path) {
        return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
    }

    // value untuk fuzzy search di CommandItem
    const getItemValue = (row) => {
        const keys = (searchKeys && searchKeys.length > 0)
            ? searchKeys
            : (columns || []).map((c) => c.key);
        const joined = keys
            .map((k) => safe(row, k))
            .filter(Boolean)
            .join(" ");
        return String(joined);
    };

    // fetch saat query berubah & popover sedang terbuka
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dq, open]);

    const onOpenChange = (v) => {
        setOpen(v);
        // trigger fetch awal (tanpa query) saat baru dibuka
        if (v && initialFetch && q === "") {
            setQ("");
        }
    };

    const label = value ? displayValue(value) : null;

    const handleSelect = (row) => {
        onChange?.(row);  // kirim satu object utuh ke induk
        setOpen(false);
    };

    const clear = (e) => {
        e.stopPropagation();
        onChange?.(null);
    };

    // header grid untuk kolom
    const renderHeader = () => (
        <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-2 px-3 py-2 text-xs font-medium opacity-70"
             style={{ "--cols": columns?.length || 1 }}>
            {columns?.map((c) => (
                <div key={c.key} className={c.className || ""}>{c.label ?? c.key}</div>
            ))}
        </div>
    );

    // satu baris row
    const renderRow = (row) => (
        <div
            className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-2 w-full"
            style={{ "--cols": columns?.length || 1 }}
        >
            {columns?.map((c) => (
                <div key={c.key} className={`truncate ${c.className || ""}`}>
                    {String(safe(row, c.key) ?? "")}
                </div>
            ))}
        </div>
    );

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={buttonClassName}
                    disabled={disabled}
                >
          <span className={`truncate ${!label ? "opacity-60" : ""}`}>
            {label || placeholder}
          </span>
                    <span className="flex items-center gap-2">
            {allowClear && value && !disabled && (
                <X className="h-4 w-4 opacity-60 hover:opacity-100" onClick={clear} />
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
                    <CommandList className="max-h-80 overflow-auto">
                        {loading && <div className="p-3 text-sm opacity-70">Memuat…</div>}
                        {!loading && err && <div className="p-3 text-sm text-red-600">{err}</div>}

                        {!loading && !err && (
                            <>
                                <CommandEmpty>{emptyText}</CommandEmpty>

                                {/* header kolom */}
                                {columns?.length > 0 && renderHeader()}

                                <CommandGroup >
                                    {rows.map((row, idx) => (
                                        <CommandItem
                                            key={idx}
                                            value={getItemValue(row)} // penting untuk fuzzy search
                                            onSelect={() => handleSelect(row)}
                                            className="cursor-pointer"
                                        >
                                            {renderRow(row)}
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
}
