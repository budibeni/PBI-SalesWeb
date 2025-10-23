"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Wallet, Gift, GiftIcon, Sigma } from "lucide-react";

const nf = (n) =>
    Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });

/**
 * FooterPage
 * - komisiDasar: number ATAU { total, perKategori }
 * - achvment: Record<string, number> // 0..1..n
 * - bonusUtama = Σ (0.10 × perKategori[k])
 * - bonusExtra = Σ ( (perKategori[k] * achvment[k] * 1.2) - (perKategori[k] + bonusUtamaK) )
 *                hanya jika achvment[k] >= 1
 * - total = totalDasar + bonusUtama + bonusExtra
 */
export default function FooterPage({ komisiDasar = 0, achvment = {} }) {
    // Normalisasi komisi dasar
    const totalDasar =
        Number(
            typeof komisiDasar === "object" && komisiDasar !== null
                ? komisiDasar.total
                : komisiDasar
        ) || 0;

    const perKategori =
        (typeof komisiDasar === "object" &&
            komisiDasar !== null &&
            komisiDasar.perKategori) ||
        {};

    // 🔹 Hitung Bonus Utama (10%)
    const { bonusUtamaMap, bonusUtama } = React.useMemo(() => {
        const m = {};
        let sum = 0;
        for (const [k, v] of Object.entries(perKategori)) {
            const dasar = Number(v) || 0;
            const bonusK = dasar * 0.1;
            m[k] = bonusK;
            sum += bonusK;
        }
        return { bonusUtamaMap: m, bonusUtama: sum };
    }, [perKategori]);

    // 🔹 Hitung Bonus Extra (hanya achvment >= 1)
    const bonusExtra = React.useMemo(() => {
        let sum = 0;
        for (const [k, dasarVal] of Object.entries(perKategori)) {
            const dasar = Number(dasarVal) || 0;
            const ach = Number(achvment?.[k]);
            if (!Number.isFinite(ach) || ach < 1) continue;
            const bUtamaK = Number(bonusUtamaMap[k]) || 0;
            const extraK = (dasar * ach * 1.2) - (dasar + bUtamaK);
            sum += extraK;
        }
        return sum;
    }, [perKategori, achvment, bonusUtamaMap]);

    const total = totalDasar + bonusUtama + bonusExtra;

    return (
        <div
            className={cn(
                "bg-background/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md",
                "border-t py-3 sm:py-4"
            )}
            role="contentinfo"
            aria-label="Ringkasan Komisi"
        >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {/* Komisi Dasar */}
                <StatCard
                    icon={<Wallet className="h-4 w-4" />}
                    label="Komisi Dasar"
                    value={`Rp. ${nf(totalDasar)}`}
                    tone="gray"
                />

                {/* Bonus Utama (10%) */}
                <StatCard
                    icon={<Gift className="h-4 w-4" />}
                    label="Bonus Utama"
                    value={`+Rp. ${nf(bonusUtama)}`}
                    tone="green"
                />

                {/* Bonus Extra */}
                <StatCard
                    icon={<GiftIcon className="h-4 w-4" />}
                    label="Bonus Extra"
                    value={`${bonusExtra >= 0 ? "+" : ""}Rp. ${nf(bonusExtra)}`}
                    tone="green"
                />

                {/* Total Komisi */}
                <StatCard
                    icon={<Sigma className="h-4 w-4" />}
                    label="Total Komisi"
                    value={`Rp. ${nf(total)}`}
                    tone="blue"
                    emphasize
                />
            </div>
        </div>
    );
}

/**
 * Komponen kecil untuk tiap metrik
 */
function StatCard({ icon, label, value, tone = "gray", emphasize = false }) {
    const tones = {
        gray: {
            chip: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
            ring: "ring-gray-200/60 dark:ring-gray-700/60",
            value: "text-gray-900 dark:text-gray-100",
        },
        green: {
            chip: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
            ring: "ring-green-200/60 dark:ring-green-800/50",
            value: "text-green-800 dark:text-green-200",
        },
        blue: {
            chip: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
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
