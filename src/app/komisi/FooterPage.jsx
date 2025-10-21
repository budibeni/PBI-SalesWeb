"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Wallet, Gift, GiftIcon, Sigma } from "lucide-react";

const nf = (n) =>
    Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });

/**
 * FooterPage
 * - Warna: Komisi Dasar (abu-abu), Bonus (hijau), Total (biru)
 * - Tidak sticky—biarkan parent yang mengatur posisi (sticky/fixed)
 * - Responsif + animasi halus
 */
export default function FooterPage({
                                       komisiDasar = 0,
                                       bonus1 = 0,
                                       bonus2 = 0,
                                       className = "",
                                   }) {
    const total = (Number(komisiDasar) || 0) + (Number(bonus1) || 0) + (Number(bonus2) || 0);

    return (
        <div
            className={cn(
                "bg-background/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md",
                "border-t  py-3 sm:py-4",
                className
            )}
            role="contentinfo"
            aria-label="Ringkasan Komisi"
        >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {/* Komisi Dasar (Gray) */}
                <StatCard
                    icon={<Wallet className="h-4 w-4" />}
                    label="Komisi Dasar"
                    value={`Rp. ${nf(komisiDasar)}`}
                    tone="gray"
                />

                {/* Bonus 1 (Green) */}
                <StatCard
                    icon={<Gift className="h-4 w-4" />}
                    label="Bonus"
                    value={`+Rp. ${nf(bonus1)}`}
                    tone="green"
                />

                {/* Bonus 2 (Green) */}
                <StatCard
                    icon={<GiftIcon className="h-4 w-4" />}
                    label="Extra Bonus"
                    value={`+Rp. ${nf(bonus2)}`}
                    tone="green"
                />

                {/* Total Komisi (Blue) */}
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
 * Kartu kecil untuk setiap metrik
 * tone: "gray" | "green" | "blue"
 * emphasize: bold + ukuran lebih besar untuk sorotan
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
                {/* Chip + Icon */}
                <div
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] sm:text-xs",
                        "transition-colors",
                        tones.chip
                    )}
                >
                    <span className="opacity-80">{icon}</span>
                    <span className="font-medium">{label}</span>
                </div>

                {/* Nilai */}
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
