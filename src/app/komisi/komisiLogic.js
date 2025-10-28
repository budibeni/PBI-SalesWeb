// komisi/komisiLogic.js

// ===== Angka & konstanta dasar =====
export const ROUND2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const asNum = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v));

export const MIN_QTY = 0.01;
export const MIN_RATIO = 0.75; // harga minimal = 0.75 * MSRP
export const MAX_RATIO = 1.25; // harga maksimal = 1.25 * MSRP

export const normPct = (p) => {
    const x = Number(p || 0);
    return x > 1 ? x / 100 : Math.max(0, x);
};

export const clampPrice = (price, msrp) => {
    const p = asNum(price);
    const m = asNum(msrp);
    const minP = m * MIN_RATIO;
    const maxP = m * MAX_RATIO;
    return ROUND2(Math.max(minP, Math.min(p, maxP)));
};

export const ensureQty = (q) => ROUND2(Math.max(asNum(q), MIN_QTY));

export const subOf = (row) => {
    const harga  = asNum(row.harga)
    const hpp    = asNum(row.hpp)
    const qty    = asNum(row.qty)
    const persen = asNum(row.persen)

    if (!hpp || hpp <= 0) return 0

    const margin = Math.max(0, harga - hpp)
    return ROUND2(margin * qty * persen)
}


// ===== Target parsing (sinkron dengan TargetKomisi.jsx) =====
export function parseTargetKomisiObj(targetKomisi) {
    const tg = targetKomisi?.global;
    const per = targetKomisi?.perKategori || {};

    const hasAnyValue = (obj) =>
        Object.values(obj || {}).some((v) => String(v ?? "").trim().length > 0);

    const gNum = asNum(tg);
    const globalFilled = String(tg ?? "").trim().length > 0 && gNum > 0;
    const perFilled = hasAnyValue(per);

    if (globalFilled && !perFilled) {
        return { mode: "GLOBAL", global: gNum, perCat: new Map() };
    }
    if (perFilled) {
        const perCat = new Map();
        Object.entries(per).forEach(([kat, raw]) => {
            const s = String(raw ?? "").trim();
            if (!s) return;
            if (globalFilled) {
                const pct = Math.max(0, asNum(s.replace(/%/g, ""))) / 100;
                perCat.set(String(kat).toLowerCase(), gNum * pct);
            } else {
                perCat.set(String(kat).toLowerCase(), Math.max(0, asNum(s)));
            }
        });
        return { mode: "BY_CATEGORY", global: globalFilled ? gNum : null, perCat };
    }
    return { mode: "NONE", global: null, perCat: new Map() };
}

// ===== Algoritma rekomendasi per-scope =====
// rows: array baris dengan { id, harga, qty, msrp, persen, hargaLocked, qtyLocked }
// targetRp: number
// return: patch map { [id]: { harga?: number, qty?: number } }
export function recommendScope(rows, targetRp) {
    const target = ROUND2(asNum(targetRp));
    if (!Array.isArray(rows) || rows.length === 0) return {};

    // Normalisasi awal pada salinan
    const clone = rows.map((r) => {
        const rr = { ...r };
        if (!rr.hargaLocked) rr.harga = clampPrice(rr.harga ?? rr.msrp, rr.msrp);
        if (!rr.qtyLocked) rr.qty = ensureQty(rr.qty);
        return rr;
    });

    let fixed = 0;
    for (const r of clone) if (r.hargaLocked && r.qtyLocked) fixed += subOf(r);
    fixed = ROUND2(fixed);
    if (fixed > target + 1e-6) return {}; // tak mungkin dipenuhi

    let remaining = ROUND2(Math.max(0, target - fixed));
    const patch = {};
    const setHarga = (r, v) => {
        const x = clampPrice(v, r.msrp);
        (patch[r.id] ??= {}).harga = x;
        r.harga = x;
    };
    const setQty = (r, v) => {
        const x = ensureQty(v);
        (patch[r.id] ??= {}).qty = x;
        r.qty = x;
    };

    // 1) qty lock, harga unlock → rata-kan harga proporsional sisa
    const lockQtyOnly = clone.filter((r) => r.qtyLocked && !r.hargaLocked && asNum(r.qty) > 0);
    if (remaining > 0 && lockQtyOnly.length > 0) {
        const sumQP = lockQtyOnly.reduce((a, r) => a + asNum(r.qty) * normPct(r.persen), 0);
        if (sumQP > 0) {
            const unit = ROUND2(remaining / sumQP);
            for (const r of lockQtyOnly) setHarga(r, unit);
            const used = lockQtyOnly.reduce((a, r) => a + subOf(r), 0);
            remaining = ROUND2(Math.max(0, remaining - used));
        }
    }

    // 2) harga lock, qty unlock → tambah qty proporsional
    const lockPriceOnly = clone.filter((r) => r.hargaLocked && !r.qtyLocked);
    if (remaining > 0 && lockPriceOnly.length > 0) {
        const denom = lockPriceOnly.reduce((a, r) => a + asNum(r.harga) * normPct(r.persen), 0);
        if (denom > 0) {
            for (const r of lockPriceOnly) {
                const share = (asNum(r.harga) * normPct(r.persen)) / denom;
                const addValue = ROUND2(remaining * share);
                const base = asNum(r.harga) * normPct(r.persen);
                const addQty = base > 0 ? ROUND2(addValue / base) : 0;
                setQty(r, asNum(r.qty) + addQty);
            }
            remaining = 0;
        }
    }

    // 3) unlock keduanya → tambah qty (harga sudah di-clamp)
    const unlockBoth = clone.filter((r) => !r.hargaLocked && !r.qtyLocked);
    if (remaining > 0 && unlockBoth.length > 0) {
        const denom = unlockBoth.reduce((a, r) => a + asNum(r.harga) * normPct(r.persen), 0);
        if (denom > 0) {
            for (const r of unlockBoth) {
                const share = (asNum(r.harga) * normPct(r.persen)) / denom;
                const addValue = ROUND2(remaining * share);
                const base = asNum(r.harga) * normPct(r.persen);
                const addQty = base > 0 ? ROUND2(addValue / base) : 0;
                setQty(r, asNum(r.qty) + addQty);
            }
            remaining = 0;
        }
    }

    // 4) Cap ≤ target: turunkan harga (qty lock & harga unlock), lalu kurangi qty
    const totalNow = ROUND2(clone.reduce((s, r) => s + subOf(r), 0));
    if (totalNow > target + 1e-6) {
        let over = ROUND2(totalNow - target);

        // 4a) turunkan harga pada (qty lock & harga unlock) ke batas min clamp
        const priceAdj = clone.filter((r) => r.qtyLocked && !r.hargaLocked && asNum(r.qty) > 0);
        if (priceAdj.length > 0 && over > 0) {
            const reducibles = priceAdj.map((r) => {
                const q = asNum(r.qty), p = asNum(r.harga), minP = asNum(r.msrp) * MIN_RATIO;
                const cap = Math.max(0, (p - minP) * q * normPct(r.persen));
                return { r, q, p, minP, cap };
            });
            const totalCap = reducibles.reduce((a, x) => a + x.cap, 0);
            if (totalCap > 0) {
                const f = Math.min(1, over / totalCap);
                for (const x of reducibles) {
                    const dropValue = ROUND2(x.cap * f);
                    const base = x.q * normPct(x.r.persen);
                    const dropPerUnit = base > 0 ? ROUND2(dropValue / base) : 0;
                    setHarga(x.r, x.p - dropPerUnit);
                }
                over = ROUND2(clone.reduce((s, r) => s + subOf(r), 0) - target);
            }
        }

        // 4b) kurangi qty pada baris qty unlock (jaga ≥ 0.01)
        if (over > 0) {
            const qtyAdj = clone.filter((r) => (r.hargaLocked && !r.qtyLocked) || (!r.hargaLocked && !r.qtyLocked));
            const capacity = qtyAdj.reduce((a, r) => {
                const room = Math.max(0, asNum(r.qty) - MIN_QTY);
                return a + ROUND2(asNum(r.harga) * normPct(r.persen) * room);
            }, 0);
            if (capacity > 0) {
                const f = Math.min(1, over / capacity);
                for (const r of qtyAdj) {
                    const room = Math.max(0, asNum(r.qty) - MIN_QTY);
                    const reducibleValue = ROUND2(asNum(r.harga) * normPct(r.persen) * room);
                    const take = ROUND2(reducibleValue * f);
                    const base = asNum(r.harga) * normPct(r.persen);
                    const reduceQty = base > 0 ? ROUND2(take / base) : 0;
                    setQty(r, asNum(r.qty) - reduceQty);
                }
            }
        }
    }

    // normalisasi akhir (pastikan clamp/min tetap)
    clone.forEach((r) => {
        if (!r.hargaLocked) setHarga(r, asNum(r.harga));
        if (!r.qtyLocked) setQty(r, asNum(r.qty));
    });

    return patch;
}

// ===== Global capping agar total semua scope ≤ target global =====
export function enforceGlobalCap(rows, targetGlobal) {
    const target = ROUND2(asNum(targetGlobal));
    const clone = rows.map((r) => {
        const rr = { ...r };
        if (!rr.hargaLocked) rr.harga = clampPrice(rr.harga ?? rr.msrp, rr.msrp);
        if (!rr.qtyLocked) rr.qty = ensureQty(rr.qty);
        return rr;
    });

    const fixed = ROUND2(clone.filter((r) => r.hargaLocked && r.qtyLocked).reduce((s, r) => s + subOf(r), 0));
    if (fixed > target + 1e-6) return {};

    let total = ROUND2(clone.reduce((s, r) => s + subOf(r), 0));
    if (total <= target + 1e-6) return {};

    let over = ROUND2(total - target);
    const patch = {};
    const setHarga = (r, v) => {
        const x = clampPrice(v, r.msrp);
        (patch[r.id] ??= {}).harga = x;
        r.harga = x;
    };
    const setQty = (r, v) => {
        const x = ensureQty(v);
        (patch[r.id] ??= {}).qty = x;
        r.qty = x;
    };

    // turunkan harga dahulu pada (qty lock & harga unlock)
    const priceAdj = clone.filter((r) => r.qtyLocked && !r.hargaLocked && asNum(r.qty) > 0);
    if (priceAdj.length > 0 && over > 0) {
        const reducibles = priceAdj.map((r) => {
            const q = asNum(r.qty), p = asNum(r.harga), minP = asNum(r.msrp) * MIN_RATIO;
            const cap = Math.max(0, (p - minP) * q * normPct(r.persen));
            return { r, q, p, minP, cap };
        });
        const totalCap = reducibles.reduce((a, x) => a + x.cap, 0);
        if (totalCap > 0) {
            const f = Math.min(1, over / totalCap);
            for (const x of reducibles) {
                const dropValue = ROUND2(x.cap * f);
                const base = x.q * normPct(x.r.persen);
                const dropPerUnit = base > 0 ? ROUND2(dropValue / base) : 0;
                setHarga(x.r, x.p - dropPerUnit);
            }
            total = ROUND2(clone.reduce((s, r) => s + subOf(r), 0));
            over = ROUND2(Math.max(0, total - target));
        }
    }

    // kurangi qty bila masih over
    if (over > 0) {
        const qtyAdj = clone.filter((r) => (r.hargaLocked && !r.qtyLocked) || (!r.hargaLocked && !r.qtyLocked));
        const capacity = qtyAdj.reduce((a, r) => {
            const room = Math.max(0, asNum(r.qty) - MIN_QTY);
            return a + ROUND2(asNum(r.harga) * normPct(r.persen) * room);
        }, 0);
        if (capacity > 0) {
            const f = Math.min(1, over / capacity);
            for (const r of qtyAdj) {
                const room = Math.max(0, asNum(r.qty) - MIN_QTY);
                const reducibleValue = ROUND2(asNum(r.harga) * normPct(r.persen) * room);
                const take = ROUND2(reducibleValue * f);
                const base = asNum(r.harga) * normPct(r.persen);
                const reduceQty = base > 0 ? ROUND2(take / base) : 0;
                setQty(r, asNum(r.qty) - reduceQty);
            }
        }
    }

    return patch;
}
