"use client";

import React from "react";

/* ========================= Helpers ========================= */

// pembulatan 2 desimal (round-half-up)
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// format tampilan angka (2 desimal)
const fmt2 = (n) =>
    (Number(n) || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

/** Parse "1.234,56", "1,234.56", "100.000", "3.5" → number */
function toNum(v) {
    if (v === null || v === undefined) return 0;
    let s = String(v).trim();
    if (!s) return 0;
    s = s.replace(/[^\d.,-]/g, "");
    const hasComma = s.includes(",");
    const hasDot = s.includes(".");
    let dec = null;
    if (hasComma && hasDot) dec = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    else if (hasComma) dec = ",";
    else if (hasDot) dec = ".";
    if (dec) {
        const thousand = dec === "," ? "." : ",";
        s = s.split(thousand).join("");
        if (dec === ",") s = s.replace(",", ".");
    } else {
        s = s.replace(/[.,]/g, "");
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

const deepClone = (o) => JSON.parse(JSON.stringify(o));
const sub = (it) => round2(toNum(it.price)) * round2(toNum(it.qty));

// Harga boleh ±25% dari MSRP
const MIN_RATIO = 0.75;
const MAX_RATIO = 1.25;
const clampPriceRaw = (price, msrp) =>
    Math.max(toNum(msrp) * MIN_RATIO, Math.min(toNum(price), toNum(msrp) * MAX_RATIO));
const clampPrice = (price, msrp) => round2(clampPriceRaw(price, msrp));

// Qty minimal untuk item yang qty-nya boleh berubah (dua desimal)
const MIN_QTY = 0.01;

/* ========================= Dummy Data (contoh) ========================= */

const INIT_TARGET = {
    global: 1_000_000,
    byCategory: {
        "Kategori 1": 500_000,
        "Kategori 2": 300_000,
        "Kategori 3": 150_000,
        "Kategori 4": 50_000,
    },
};

const INIT_ITEMS = [
    { code: "I-001", category: "Kategori 1", msrp: 100_000, price: 100_000, lockPrice: true,  qty: 0,    lockQty: false },
    { code: "I-002", category: "Kategori 1", msrp: 100_000, price: 0,        lockPrice: false, qty: 3,    lockQty: true  },
    { code: "I-003", category: "Kategori 2", msrp: 100_000, price: 100_000,  lockPrice: true,  qty: 0,    lockQty: false },
    { code: "I-004", category: "Kategori 3", msrp: 100_000, price: 0,        lockPrice: false, qty: 3,    lockQty: true  },
    { code: "I-005", category: "Kategori 4", msrp: 100_000, price: 50_000,   lockPrice: false, qty: 1,    lockQty: true  },
];

/* ========================= Algoritma Rekomendasi ========================= */

// Tambah qty pada item lockPrice && !lockQty (tambah qty, jaga ≥ MIN_QTY, 2 desimal)
function fillByQty(items, remaining) {
    for (const it of items) {
        if (remaining <= 0) break;
        const price = round2(toNum(it.price));
        if (price <= 0) continue;
        const addQty = round2(remaining / price);
        const nextQty = round2(toNum(it.qty) + addQty);
        it.qty = Math.max(nextQty, MIN_QTY);
        remaining = round2(remaining - round2(addQty * price));
    }
    return Math.max(0, remaining);
}

// Untuk unlock keduanya: set price=MSRP (clamp), lalu tambah qty (≥ MIN_QTY, 2 desimal)
function fillByQtyForUnlockBoth(items, remaining) {
    for (const it of items) {
        if (remaining <= 0) break;
        it.price = clampPrice(toNum(it.msrp), toNum(it.msrp));
        const price = round2(toNum(it.price));
        if (price <= 0) continue;
        const addQty = round2(remaining / price);
        const nextQty = round2(toNum(it.qty) + addQty);
        it.qty = Math.max(nextQty, MIN_QTY);
        remaining = round2(remaining - round2(addQty * price));
    }
    return Math.max(0, remaining);
}

/** Hitung rekomendasi untuk sekumpulan item (kategori/global) terhadap `target` */
function recommendForScope(itemsInScope, target) {
    const items = deepClone(itemsInScope);
    let overLimit = false;

    // Normalisasi awal (harga/qty untuk yang tidak lock)
    for (const it of items) {
        if (!it.lockPrice) it.price = clampPrice(it.price || it.msrp, it.msrp);
        if (!it.lockQty) it.qty = Math.max(round2(toNum(it.qty)), MIN_QTY);
    }

    // 1) fixed subtotal
    let fixedSum = 0;
    for (const it of items) if (it.lockPrice && it.lockQty) fixedSum += sub(it);
    if (fixedSum > toNum(target)) {
        return { items, used: fixedSum, overLimit: true };
    }

    let remaining = round2(Math.max(0, toNum(target) - fixedSum));

    // 2) lockQty saja → set price rata (clamp), qty tetap
    const lockQtyOnly = items.filter((it) => it.lockQty && !it.lockPrice);
    if (lockQtyOnly.length > 0 && remaining > 0) {
        const totalQty = lockQtyOnly.reduce((a, b) => a + Math.max(0, round2(toNum(b.qty))), 0);
        if (totalQty > 0) {
            const unit = round2(remaining / totalQty);
            for (const it of lockQtyOnly) it.price = clampPrice(unit, toNum(it.msrp));
            const used = lockQtyOnly.reduce((a, b) => a + sub(b), 0);
            remaining = round2(Math.max(0, remaining - used));
        }
    }

    // 3a) lockPrice saja → tambah qty
    const lockPriceOnly = items.filter((it) => it.lockPrice && !it.lockQty);
    remaining = fillByQty(lockPriceOnly, remaining);

    // 3b) unlock keduanya → set price=MSRP (clamp) lalu tambah qty
    const unlockBoth = items.filter((it) => !it.lockPrice && !it.lockQty);
    remaining = fillByQtyForUnlockBoth(unlockBoth, remaining);

    const used = items.reduce((a, b) => a + sub(b), 0);
    if (used > toNum(target) + 1e-6) overLimit = true;
    // round pada akhir
    for (const it of items) {
        if (!it.lockPrice) it.price = round2(it.price);
        if (!it.lockQty) it.qty = round2(Math.max(it.qty, MIN_QTY));
    }
    return { items, used: Math.min(round2(used), round2(toNum(target))), overLimit };
}

/** Cap total semua item ke Target Global, tanpa harga/qty = 0, dan 2 desimal */
function enforceGlobalCap(allItems, targetGlobal) {
    const items = deepClone(allItems);
    const T = round2(toNum(targetGlobal));

    // Fixed global
    const fixedGlobal = items
        .filter((it) => it.lockPrice && it.lockQty)
        .reduce((a, b) => a + sub(b), 0);

    if (fixedGlobal > T) {
        return { items, total: items.reduce((a, b) => a + sub(b), 0), impossible: true };
    }

    // Normalisasi & jaga batas
    for (const it of items) {
        if (!it.lockPrice) it.price = clampPrice(it.price || it.msrp, it.msrp);
        if (!it.lockQty) it.qty = round2(Math.max(toNum(it.qty), MIN_QTY));
    }

    let total = items.reduce((a, b) => a + sub(b), 0);
    if (total <= T + 1e-6) return { items, total: round2(total) };

    let over = round2(total - T);

    // Step 1: turunkan harga pada (lockQty && !lockPrice) hingga minClamp (2 desimal)
    const priceAdj = items.filter((it) => it.lockQty && !it.lockPrice && toNum(it.qty) > 0);
    if (priceAdj.length > 0 && over > 0) {
        const reducibles = priceAdj.map((it) => {
            const qty = round2(toNum(it.qty));
            const p = round2(toNum(it.price));
            const minP = round2(toNum(it.msrp) * MIN_RATIO);
            const reducible = Math.max(0, round2((p - minP) * qty));
            return { it, qty, p, minP, reducible };
        });
        const totalReducible = reducibles.reduce((a, b) => a + b.reducible, 0);
        if (totalReducible > 0) {
            const factor = Math.min(1, over / totalReducible);
            for (const r of reducibles) {
                const dropValue = round2(r.reducible * factor);
                const dropPerUnit = r.qty > 0 ? round2(dropValue / r.qty) : 0;
                r.it.price = clampPrice(round2(r.p - dropPerUnit), toNum(r.it.msrp));
            }
            total = items.reduce((a, b) => a + sub(b), 0);
            over = round2(Math.max(0, total - T));
        }
    }

    // Step 2: kurangi qty pada item yang qty-nya boleh berubah (proporsional), jaga ≥ MIN_QTY
    if (over > 0) {
        let guard = 0;
        while (over > 1e-6 && guard++ < 10) {
            const qtyAdj = items.filter(
                (it) => (it.lockPrice && !it.lockQty) || (!it.lockPrice && !it.lockQty)
            );
            if (qtyAdj.length === 0) break;

            // kapasitas penurunan = Σ price * (qty - MIN_QTY)
            const capacity = qtyAdj.reduce(
                (a, it) =>
                    a +
                    Math.max(
                        0,
                        round2(toNum(it.price)) * Math.max(0, round2(toNum(it.qty) - MIN_QTY))
                    ),
                0
            );
            if (capacity <= 1e-6) break;

            const f = Math.min(1, over / capacity);
            for (const it of qtyAdj) {
                const price = round2(toNum(it.price));
                const room = Math.max(0, round2(toNum(it.qty) - MIN_QTY));
                const reducibleValue = round2(price * room);
                const take = round2(reducibleValue * f);
                const reduceQty = price > 0 ? round2(take / price) : 0;
                it.qty = round2(Math.max(MIN_QTY, round2(toNum(it.qty)) - reduceQty));
            }

            total = items.reduce((a, b) => a + sub(b), 0);
            over = round2(Math.max(0, total - T));
        }
    }

    // final rounding
    for (const it of items) {
        if (!it.lockPrice) it.price = round2(it.price);
        if (!it.lockQty) it.qty = round2(Math.max(it.qty, MIN_QTY));
    }

    return { items, total: round2(items.reduce((a, b) => a + sub(b), 0)), impossible: over > 1e-6 };
}

/** Orkestrasi: kategori→cap global, atau global langsung */
function calcRecommendation(allItems, targetGlobal, targetByCat) {
    const hasCategoryTarget = Object.values(targetByCat || {}).some((v) => toNum(v) > 0);

    if (hasCategoryTarget) {
        const groups = {};
        for (const it of allItems) {
            if (!groups[it.category]) groups[it.category] = [];
            groups[it.category].push(it);
        }
        let items = [];
        const perCategory = [];
        for (const [cat, arr] of Object.entries(groups)) {
            const t = toNum(targetByCat[cat] || 0);
            const { items: res, used, overLimit } = recommendForScope(arr, t);
            items = items.concat(res);
            perCategory.push({ cat, target: t, used: round2(used), overLimit });
        }
        const capped = enforceGlobalCap(items, targetGlobal);
        return {
            items: capped.items,
            total: capped.total,
            mode: "BY_CATEGORY",
            perCategory,
            globalImpossible: capped.impossible,
            hasLockedZeroQty: allItems.some((x) => x.lockQty && round2(toNum(x.qty)) === 0),
        };
    } else {
        const { items, used, overLimit } = recommendForScope(allItems, toNum(targetGlobal));
        const capped = enforceGlobalCap(items, targetGlobal);
        return {
            items: capped.items,
            total: capped.total,
            mode: "GLOBAL",
            overLimit: overLimit || capped.impossible,
            hasLockedZeroQty: allItems.some((x) => x.lockQty && round2(toNum(x.qty)) === 0),
        };
    }
}

/* ========================= UI Page ========================= */

export default function RekomendasiPage() {
    const [targets, setTargets] = React.useState(INIT_TARGET);
    const [rows, setRows] = React.useState(INIT_ITEMS);
    const [result, setResult] = React.useState(null);

    const handleRekomendasi = () => {
        const res = calcRecommendation(rows, targets.global, targets.byCategory);
        setResult(res);
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Simulasi Rekomendasi</h1>

            {/* Target */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                    <div className="font-medium mb-2">Target Global</div>
                    <input
                        className="w-full border rounded px-3 py-2"
                        inputMode="decimal"
                        step="any"
                        value={targets.global}
                        onChange={(e) =>
                            setTargets((t) => ({ ...t, global: round2(toNum(e.target.value)) }))
                        }
                    />
                </div>
                <div className="border rounded-lg p-4">
                    <div className="font-medium mb-2">Target per Kategori (isi 0 untuk abaikan)</div>
                    {Object.keys(targets.byCategory).map((k) => (
                        <div key={k} className="flex items-center gap-2 mb-2">
                            <div className="w-40 text-sm">{k}</div>
                            <input
                                className="flex-1 border rounded px-3 py-1"
                                inputMode="decimal"
                                step="any"
                                value={targets.byCategory[k]}
                                onChange={(e) =>
                                    setTargets((t) => ({
                                        ...t,
                                        byCategory: { ...t.byCategory, [k]: round2(toNum(e.target.value)) },
                                    }))
                                }
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Data Item */}
            <div className="border rounded-lg">
                <div className="px-4 py-3 font-medium">Data Item</div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left">Kode Item</th>
                            <th className="px-3 py-2 text-left">Kategori</th>
                            <th className="px-3 py-2 text-right">MSRP</th>
                            <th className="px-3 py-2 text-right">Harga</th>
                            <th className="px-3 py-2">Lock Harga</th>
                            <th className="px-3 py-2 text-right">Qty</th>
                            <th className="px-3 py-2">Lock Qty</th>
                            <th className="px-3 py-2 text-right">Subtotal</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.code} className="border-t">
                                <td className="px-3 py-2">{r.code}</td>
                                <td className="px-3 py-2">{r.category}</td>
                                <td className="px-3 py-2 text-right">{fmt2(r.msrp)}</td>
                                <td className="px-3 py-2 text-right">
                                    <input
                                        className="w-28 border rounded px-2 py-1 text-right"
                                        inputMode="decimal"
                                        step="any"
                                        value={rows[i].price}
                                        disabled={r.lockPrice}
                                        onChange={(e) => {
                                            const v = round2(toNum(e.target.value));
                                            setRows((list) => {
                                                const cp = deepClone(list);
                                                cp[i].price = clampPrice(v, cp[i].msrp); // clamp + 2 desimal
                                                return cp;
                                            });
                                        }}
                                    />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={r.lockPrice}
                                        onChange={(e) =>
                                            setRows((list) => {
                                                const cp = deepClone(list);
                                                cp[i].lockPrice = e.target.checked;
                                                if (!cp[i].lockPrice)
                                                    cp[i].price = clampPrice(cp[i].price || cp[i].msrp, cp[i].msrp);
                                                return cp;
                                            })
                                        }
                                    />
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <input
                                        className="w-20 border rounded px-2 py-1 text-right"
                                        inputMode="decimal"
                                        step="any"
                                        value={rows[i].qty}
                                        disabled={r.lockQty}
                                        onChange={(e) => {
                                            const v = round2(toNum(e.target.value));
                                            setRows((list) => {
                                                const cp = deepClone(list);
                                                cp[i].qty = Math.max(round2(v), MIN_QTY); // 2 desimal + min
                                                return cp;
                                            });
                                        }}
                                    />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={r.lockQty}
                                        onChange={(e) =>
                                            setRows((list) => {
                                                const cp = deepClone(list);
                                                cp[i].lockQty = e.target.checked;
                                                if (!cp[i].lockQty) cp[i].qty = Math.max(round2(cp[i].qty), MIN_QTY);
                                                return cp;
                                            })
                                        }
                                    />
                                </td>
                                <td className="px-3 py-2 text-right">{fmt2(sub(r))}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <button
                onClick={handleRekomendasi}
                className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
            >
                Hitung Rekomendasi
            </button>

            {/* Hasil */}
            {result && (
                <div className="space-y-3">
                    <div className="text-lg font-semibold">
                        Hasil Rekomendasi ({result.mode === "BY_CATEGORY" ? "Per Kategori" : "Global"})
                    </div>

                    {result.mode === "BY_CATEGORY" && (
                        <div className="text-sm">
                            {result.perCategory.map((r) => (
                                <div key={r.cat}>
                                    <span className="font-medium">{r.cat}</span> — Target: {fmt2(r.target)} | Terpakai:{" "}
                                    {fmt2(r.used)} {r.overLimit ? " • over limit (fixed > target)" : ""}
                                </div>
                            ))}
                        </div>
                    )}

                    {result.globalImpossible && (
                        <div className="text-sm text-red-600">
                            *Total item yang fixed (lock harga & lock qty) sudah melebihi Target Global — tidak
                            bisa dipaksa turun karena terkunci.
                        </div>
                    )}

                    <div className="border rounded-lg overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left">Kode Item</th>
                                <th className="px-3 py-2 text-left">Kategori</th>
                                <th className="px-3 py-2 text-right">MSRP</th>
                                <th className="px-3 py-2 text-right">Harga (rekom)</th>
                                <th className="px-3 py-2">Lock Harga</th>
                                <th className="px-3 py-2 text-right">Qty (rekom)</th>
                                <th className="px-3 py-2">Lock Qty</th>
                                <th className="px-3 py-2 text-right">Subtotal</th>
                            </tr>
                            </thead>
                            <tbody>
                            {result.items.map((r) => (
                                <tr key={r.code} className="border-t">
                                    <td className="px-3 py-2">{r.code}</td>
                                    <td className="px-3 py-2">{r.category}</td>
                                    <td className="px-3 py-2 text-right">{fmt2(r.msrp)}</td>
                                    <td className="px-3 py-2 text-right">{fmt2(r.price)}</td>
                                    <td className="px-3 py-2 text-center">{r.lockPrice ? "TRUE" : "FALSE"}</td>
                                    <td className="px-3 py-2 text-right">{fmt2(r.qty)}</td>
                                    <td className="px-3 py-2 text-center">{r.lockQty ? "TRUE" : "FALSE"}</td>
                                    <td className="px-3 py-2 text-right">{fmt2(sub(r))}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-medium">
                                <td className="px-3 py-2" colSpan={7}>Total</td>
                                <td className="px-3 py-2 text-right">{fmt2(result.total)}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="text-xs opacity-70">
                        Harga & qty selalu **dibulatkan ke 2 desimal**. Harga di-clamp ke <b>0.75×MSRP</b>–<b>1.25×MSRP</b>,
                        qty yang bisa diubah dijaga minimal <b>{MIN_QTY.toFixed(2)}</b>. Total akhir dijamin ≤ Target Global.
                    </div>
                </div>
            )}
        </div>
    );
}
