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


// Equal-share: bagi target scope sama rata ke baris yang bisa diubah
export function recommendScope(rows, targetRp) {
    const target = ROUND2(asNum(targetRp));
    if (!Array.isArray(rows) || rows.length === 0) return {};

    // Clone + normalisasi awal untuk field UNLOCK
    const clone = rows.map((r) => {
        const rr = { ...r };
        if (!rr.hargaLocked) rr.harga = clampPrice(rr.harga ?? rr.msrp, rr.msrp);
        if (!rr.qtyLocked) rr.qty = ensureQty(rr.qty);
        return rr;
    });

    // Fixed (harga&qty locked) tak boleh melebihi target
    const isFixed = (r) => r.hargaLocked && r.qtyLocked;
    const fixedTotal = ROUND2(clone.filter(isFixed).reduce((s, r) => s + subOf(r), 0));
    if (fixedTotal > target + 1e-6) return {};

    // Baris yang bisa diubah
    const adj = clone.filter((r) => !isFixed(r));
    if (adj.length === 0) return {};

    const targetForAdj = ROUND2(Math.max(0, target - fixedTotal));
    const perRowTarget = ROUND2(targetForAdj / adj.length);

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

    // Hitung nilai yang menghasilkan subtotal = perRowTarget
    const applyTarget = (r, t) => {
        const hpp = asNum(r.hpp);
        const w = normPct(r.persen);
        const harga = asNum(r.harga);
        const qty = asNum(r.qty);

        if (r.qtyLocked && !r.hargaLocked) {
            // Cari harga: (harga - hpp) * qty * w = t  => harga = hpp + t / (qty*w)
            const q = Math.max(qty, MIN_QTY);
            const needHarga = hpp + (w > 0 ? t / (q * w) : 0);
            setHarga(r, needHarga);
        } else {
            // Ubah qty (hargaLocked atau keduanya unlock)
            // (harga - hpp) * qty * w = t  => qty = t / ((harga - hpp)*w)
            const effMargin = Math.max(0, harga - hpp);
            const needQty = (w > 0 && effMargin > 0) ? (t / (effMargin * w)) : MIN_QTY;
            setQty(r, needQty);
        }
    };

    // 1) Set “equal target” untuk setiap baris adj
    adj.forEach((r) => applyTarget(r, perRowTarget));

    // 2) Koreksi residual beberapa iterasi (karena clamp/min/rounding)
    const MAX_ITER = 6, TOL = 0.5; // 0.5 rupiah toleransi
    for (let k = 0; k < MAX_ITER; k++) {
        const nowAdj = clone.filter((r) => !isFixed(r));
        const totals = nowAdj.map((r) => subOf(r));
        const totalNow = ROUND2(fixedTotal + totals.reduce((a, b) => a + b, 0));
        const resid = ROUND2(target - totalNow);
        if (Math.abs(resid) <= TOL) break;

        // Redistribusi residual sama-rata ke baris yang masih bisa bergerak
        const deltaPerRow = ROUND2(resid / nowAdj.length);
        nowAdj.forEach((r, i) => applyTarget(r, ROUND2(totals[i] + deltaPerRow)));
    }

    // 3) Normalisasi akhir
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
