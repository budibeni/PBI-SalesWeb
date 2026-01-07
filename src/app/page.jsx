"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useSidebarMenus } from "@/components/sidebar/use-sidebar-menus";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Search, ArrowUpRight, X } from "lucide-react";

function cx(...cls) {
    return cls.filter(Boolean).join(" ");
}

const norm = (s) => String(s ?? "").toLowerCase().trim();

function highlight(text, q) {
    const t = String(text ?? "");
    const query = norm(q);
    if (!query) return t;

    const lower = t.toLowerCase();
    const idx = lower.indexOf(query);
    if (idx < 0) return t;

    const before = t.slice(0, idx);
    const match = t.slice(idx, idx + query.length);
    const after = t.slice(idx + query.length);

    return (
        <>
            {before}
            <mark className="rounded bg-foreground/10 px-1 text-foreground">{match}</mark>
            {after}
        </>
    );
}

function ResultsList({ filteredGroups, query, onSelect }) {
    return (
        <Command shouldFilter={false}>
            <CommandList className="max-h-[360px]">
                {filteredGroups.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                            <Search className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">Tidak ada menu yang cocok</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            Coba kata kunci lain atau periksa ejaannya.
                        </div>
                    </div>
                ) : (
                    filteredGroups.map(([section, items]) => (
                        <CommandGroup
                            key={section}
                            heading={
                                <div className="px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {section}
                                </div>
                            }
                        >
                            {(items || []).map((m) => {
                                const Icon = m.icon;
                                return (
                                    <CommandItem
                                        key={m.href}
                                        value={`${m.label} ${m.href} ${section}`}
                                        onSelect={() => onSelect(m.href)}
                                        className={cx(
                                            "group flex items-center gap-3",
                                            // ✅ tap target besar di mobile, tetap oke di desktop
                                            "px-3 py-4 sm:px-4 sm:py-3",
                                            "cursor-pointer data-[selected=true]:bg-muted/70"
                                        )}
                                    >
                                        <div
                                            className={cx(
                                                "flex h-10 w-10 items-center justify-center rounded-2xl bg-muted",
                                                "transition group-hover:shadow-sm"
                                            )}
                                        >
                                            {Icon ? <Icon className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">{highlight(m.label, query)}</div>
                                            <div className="truncate text-xs text-muted-foreground">{highlight(m.href, query)}</div>
                                        </div>

                                        <div className="hidden text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100 sm:block">
                                            buka →
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    ))
                )}
            </CommandList>
        </Command>
    );
}

export default function Home({ user }) {
    const router = useRouter();
    const { sectionGroups } = useSidebarMenus(user);

    const inputRef = useRef(null);

    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // detect mobile (<= sm)
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 640px)");
        const apply = () => setIsMobile(mq.matches);
        apply();
        mq.addEventListener?.("change", apply);
        return () => mq.removeEventListener?.("change", apply);
    }, []);

    // keyboard shortcuts desktop: Esc close, Ctrl/⌘+K focus
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") setOpen(false);

            const isK = e.key.toLowerCase() === "k";
            const isMod = e.ctrlKey || e.metaKey;
            if (!isMobile && isK && isMod) {
                e.preventDefault();
                inputRef.current?.focus();
                setOpen(true);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isMobile]);

    const filteredGroups = useMemo(() => {
        const q = norm(query);
        const entries = Object.entries(sectionGroups || {});
        if (!q) return entries;

        return entries
            .map(([section, items]) => {
                const sec = norm(section);
                const filtered = (items || []).filter((m) => {
                    const haystack = `${m.label} ${m.href} ${sec}`.toLowerCase();
                    return haystack.includes(q);
                });
                return [section, filtered];
            })
            .filter(([, items]) => items.length > 0);
    }, [sectionGroups, query]);

    const hasQuery = norm(query).length > 0;

    const handleSelect = (href) => {
        setOpen(false);
        router.push(href);
    };

    const totalResults = filteredGroups.reduce((acc, [, items]) => acc + (items?.length || 0), 0);

    return (
        <main className="relative min-h-[calc(100vh-1px)] px-4 py-10">
            {/* subtle background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-foreground/5 blur-3xl" />
                <div className="absolute left-[15%] top-[35%] h-56 w-56 rounded-full bg-foreground/4 blur-3xl" />
                <div className="absolute right-[10%] top-[25%] h-72 w-72 rounded-full bg-foreground/4 blur-3xl" />
            </div>

            <div className="mx-auto w-full max-w-2xl">
                {/* Header */}
                <div className="mb-6 text-center">
                    {/* ✅ tips hanya desktop/tablet */}
                    <div className="hidden mb-4 sm:inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                        Tips: Ctrl/⌘+K untuk fokus, Esc untuk tutup
                    </div>

                    {/*<h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">*/}
                    {/*    Cari Menu*/}
                    {/*</h1>*/}
                    <p className="mt-2 text-sm text-muted-foreground">
                        Ketik nama menu, halaman, atau path.
                    </p>
                </div>

                {/* Search Input */}
                <div
                    className={cx(
                        "relative w-full rounded-2xl border bg-background/70 backdrop-blur",
                        "shadow-sm transition",
                        "focus-within:border-foreground/20 focus-within:shadow-md"
                    )}
                >
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        placeholder="Cari dan buka…"
                        inputMode="search"
                        enterKeyHint="search"
                        className={cx(
                            "w-full bg-transparent py-4 pl-12 pr-12",
                            // ✅ minimal 16px biar iOS tidak auto-zoom
                            "text-[16px] outline-none placeholder:text-muted-foreground"
                        )}
                    />

                    {/* Clear button */}
                    {hasQuery && (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                setQuery("");
                                inputRef.current?.focus();
                                setOpen(true);
                            }}
                            className={cx(
                                "absolute right-3 top-1/2 -translate-y-1/2",
                                "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                                "text-muted-foreground hover:bg-muted hover:text-foreground transition"
                            )}
                            aria-label="Clear"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Results */}
                {open &&
                    (isMobile ? (
                        // ✅ MOBILE: bottom sheet
                        <div className="fixed inset-0 z-50">
                            {/* backdrop */}
                            <button
                                aria-label="Tutup"
                                className="absolute inset-0 bg-black/30"
                                onClick={() => setOpen(false)}
                            />

                            {/* sheet */}
                            <div className="absolute inset-x-0 bottom-0 max-h-[75vh] rounded-t-3xl border bg-background shadow-2xl">
                                <div className="flex items-center justify-between gap-3 px-4 py-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium">Hasil Pencarian</div>
                                        <div className="text-xs text-muted-foreground">{totalResults} hasil</div>
                                    </div>

                                    <button
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted"
                                        onClick={() => setOpen(false)}
                                        aria-label="Close"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="border-t">
                                    <div className="max-h-[calc(75vh-56px)] overflow-auto overscroll-contain p-2">
                                        <ResultsList filteredGroups={filteredGroups} query={query} onSelect={handleSelect} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // ✅ DESKTOP: dropdown biasa
                        <div className="relative mt-3">
                            <div className="overflow-hidden rounded-2xl border bg-background/80 shadow-lg backdrop-blur">
                                {/* summary bar */}
                                <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                                    <div className="text-xs text-muted-foreground">{totalResults} hasil</div>
                                    <div className="text-xs text-muted-foreground">Enter untuk buka</div>
                                </div>

                                <div className="p-2">
                                    <ResultsList filteredGroups={filteredGroups} query={query} onSelect={handleSelect} />
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </main>
    );
}
