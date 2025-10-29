"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Wallet, Gift, GiftIcon, Sigma } from "lucide-react";

const nf = (n) =>
    Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });

export default function FooterPage({
                                       komisiKategori = 0,
                                       achvmentRows = [],
                                       onSummaryChange,
                                   }) {
    // Normalisasi input komisi per kategori
    const perKategori =
        (typeof komisiKategori === "object" &&
            komisiKategori !== null &&
            komisiKategori.perKategori) ||
        {};

    // Buat lookup dari AchRow[], lengkap dengan default aman
    const achMap = React.useMemo(() => {
        const m = new Map();
        for (const r of achvmentRows || []) {
            if (!r?.kategori) continue;
            m.set(r.kategori, {
                achievement: Number(r.achievement) || 0,
                minAchKomisiDasar:
                    r.minAchKomisiDasar == null ? 0 : Number(r.minAchKomisiDasar) || 0,
                minBonusUtama:
                    r.minBonusUtama == null ? 0 : Number(r.minBonusUtama) || 0,
                valueBonusUtama:
                    r.valueBonusUtama == null ? 0 : Number(r.valueBonusUtama) || 0,
                minBonusExtra:
                    r.minBonusExtra == null ? 1.0 : Number(r.minBonusExtra) || 0,
                valueBonusExtra:
                    r.valueBonusExtra == null ? 0 : Number(r.valueBonusExtra) || 0,
            });
        }
        return m;
    }, [achvmentRows]);

    // 1) Komisi Dasar per Kategori (hanya jika achievement >= minAchKomisiDasar)
    const { dasarMap, totalDasar } = React.useMemo(() => {
        const m = {};
        let sum = 0;
        for (const [k, dasarVal] of Object.entries(perKategori)) {
            const dasar = Number(dasarVal) || 0;
            const a = achMap.get(k);
            const ach = a?.achievement ?? 0;
            const minAch = a?.minAchKomisiDasar ?? 0;
            const value = ach >= minAch ? dasar : 0;

            m[k] = value;
            sum += value;
        }
        return { dasarMap: m, totalDasar: sum };
    }, [perKategori, achMap]);

    // 2) Bonus Utama per Kategori (jika achievement >= minBonusUtama)
    //    Rumus: komisiDasarPerKategori * valueBonusUtama
    const { bonusUtamaMap, bonusUtama } = React.useMemo(() => {
        const m = {};
        let sum = 0;
        for (const k of Object.keys(perKategori)) {
            const dasarK = Number(dasarMap[k]) || 0; // sudah ter-filter dari poin 1
            const a = achMap.get(k);
            const ach = a?.achievement ?? 0;
            const minUtama = a?.minBonusUtama ?? 0;
            const valUtama = a?.valueBonusUtama ?? 0;

            const v = ach >= minUtama ? dasarK * valUtama : 0;
            m[k] = v;
            sum += v;
        }
        return { bonusUtamaMap: m, bonusUtama: sum };
    }, [perKategori, achMap, dasarMap]);

    // 3) Bonus Extra per Kategori (jika achievement >= minBonusExtra)
    //    Rumus: (achievement * komisiDasarPerKategori * valueBonusExtra) - (komisiDasarPerKategori + bonusUtamaPerKategori)
    const { bonusExtraMap, bonusExtra } = React.useMemo(() => {
        const m = {};
        let sum = 0;
        for (const k of Object.keys(perKategori)) {
            const dasarK = Number(dasarMap[k]) || 0;
            const utamaK = Number(bonusUtamaMap[k]) || 0;

            const a = achMap.get(k);
            const ach = a?.achievement ?? 0;
            const minExtra = a?.minBonusExtra ?? 1.0;
            const valExtra = a?.valueBonusExtra ?? 0;

            const eligible = ach >= minExtra;
            const extraK = eligible
                ? ach * dasarK * valExtra - (dasarK + utamaK)
                : 0;

            m[k] = extraK;
            sum += extraK;
        }
        return { bonusExtraMap: m, bonusExtra: sum };
    }, [perKategori, achMap, dasarMap, bonusUtamaMap]);

    const total = totalDasar + bonusUtama + bonusExtra;

    // Kirim ringkasan ke parent
    React.useEffect(() => {
        onSummaryChange?.({
            komisiDasarTotal: totalDasar,
            komisiDasarPerKategori: dasarMap,
            bonusUtamaTotal: bonusUtama,
            bonusUtamaPerKategori: bonusUtamaMap,
            bonusExtraTotal: bonusExtra,
            bonusExtraPerKategori: bonusExtraMap,
            subtotalTotal: total,
        });
    }, [
        totalDasar,
        dasarMap,
        bonusUtama,
        bonusUtamaMap,
        bonusExtra,
        bonusExtraMap,
        total,
        onSummaryChange,
    ]);

    return (
        <div className="sticky bottom-0 left-0 right-0 z-40 py-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div
                className={cn(
                    "bg-background/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md",
                    "border-t py-3 sm:py-4"
                )}
                role="contentinfo"
                aria-label="Ringkasan Komisi"
            >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <StatCard
                        icon={<Wallet className="h-4 w-4" />}
                        label="Komisi Dasar"
                        value={`Rp. ${nf(totalDasar)}`}
                        tone="gray"
                    />
                    <StatCard
                        icon={<Gift className="h-4 w-4" />}
                        label="Bonus Utama"
                        value={`+Rp. ${nf(bonusUtama)}`}
                        tone="green"
                    />
                    <StatCard
                        icon={<GiftIcon className="h-4 w-4" />}
                        label="Bonus Extra"
                        value={`${bonusExtra >= 0 ? "+" : ""}Rp. ${nf(bonusExtra)}`}
                        tone="green"
                    />
                    <StatCard
                        icon={<Sigma className="h-4 w-4" />}
                        label="Total Komisi"
                        value={`Rp. ${nf(total)}`}
                        tone="blue"
                        emphasize
                    />
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, tone = "gray", emphasize = false }) {
    const tones = {
        gray: {
            chip: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
            ring: "ring-gray-200/60 dark:ring-gray-700/60",
            value: "text-gray-900 dark:text-gray-100",
        },
        green: {
            chip:
                "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
            ring: "ring-green-200/60 dark:ring-green-800/50",
            value: "text-green-800 dark:text-green-200",
        },
        blue: {
            chip:
                "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
            ring: "ring-blue-200/60 dark:ring-blue-800/50",
            value: "text-blue-900 dark:text-blue-100",
        },
    }[tone];

    return (
        <div
            className={cn(
                "group rounded-md p-2.5 sm:p-3",
                "ring-1 transition-all duration-300",
                "bg-card hover:shadow-md hover:-translate-y-[1px]",
                tones.ring
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] sm:text-xs",
                        tones.chip
                    )}
                >
                    <span className="opacity-80">{icon}</span>
                    <span className="font-medium">{label}</span>
                </div>

                <div
                    className={cn(
                        "font-semibold text-right tracking-tight tabular-nums",
                        tones.value,
                        emphasize ? "text-sm sm:text-base" : "text-[13px] sm:text-sm"
                    )}
                >
                    {value}
                </div>
            </div>
        </div>
    );
}
