// src/app/komisi/logic/TableProduk/recommend.js
// ======================================================
// 📘 recommend.js
// Algoritma:
// 1) recommendEqualShare(rows, target):
//    - Bagi sisa target sama-rata ke baris yang bisa diubah,
//      lalu hitung balik harga/qty agar subtotal per baris ≈ sama.
//    - Menghormati kunci (hargaLocked/qtyLocked) & batasan clamp/min.
// 2) capToGlobal(rows, targetGlobal):
//    - Jika total > target global, turunkan dulu harga pada baris
//      (qtyLocked && !hargaLocked) proporsional kapasitas, lalu
//      kurangi qty pada baris yang qty-nya bisa diubah.
//
// Keduanya memakai calcSubtotal() yang sudah NORMALISASI persen.
// ======================================================

import { ROUND2, asNum, normPct,  ensureQty } from "./math";
import { MIN_QTY, MIN_RATIO, clampPrice } from "./rules";
import { calcSubtotal } from "./subtotal";

/** Equal-share per scope */
export function recommendEqualShare(rows, targetRp) {
    const target = ROUND2(asNum(targetRp));
    if (!Array.isArray(rows) || rows.length === 0) return {};

    // Clone + normalisasi awal untuk field UNLOCK
    const clone = rows.map((r) => {
        const rr = { ...r };
        if (!rr.hargaLocked) rr.harga = clampPrice(rr.harga ?? rr.msrp, rr.msrp);
        if (!rr.qtyLocked)   rr.qty   = ensureQty(rr.qty);
        return rr;
    });

    // Fixed (harga&qty locked) tak boleh melebihi target
    const isFixed = (r) => r.hargaLocked && r.qtyLocked;
    const fixedTotal = ROUND2(clone.filter(isFixed).reduce((s, r) => s + calcSubtotal(r), 0));
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

    // Hitung balik agar subtotal ≈ target baris
    const applyTarget = (r, t) => {
        const hpp   = asNum(r.hpp);
        const w     = normPct(r.persen);      // ⬅️ wajib normalisasi
        const harga = asNum(r.harga);
        const qty   = asNum(r.qty);

        if (r.qtyLocked && !r.hargaLocked) {
            // (harga - hpp) * qty * w = t  => harga = hpp + t / (qty*w)
            const q = Math.max(qty, MIN_QTY);
            const needHarga = hpp + (w > 0 ? t / (q * w) : 0);
            setHarga(r, needHarga);
        } else {
            // (harga - hpp) * qty * w = t  => qty = t / ((harga - hpp)*w)
            const effMargin = Math.max(0, harga - hpp);
            const needQty = (w > 0 && effMargin > 0) ? (t / (effMargin * w)) : MIN_QTY;
            setQty(r, needQty);
        }
    };

    // 1) set “equal target” untuk setiap baris adj
    adj.forEach((r) => applyTarget(r, perRowTarget));

    // 2) koreksi residual beberapa iterasi (karena clamp/min/rounding)
    const MAX_ITER = 6, TOL = 0.5;
    for (let k = 0; k < MAX_ITER; k++) {
        const nowAdj = clone.filter((r) => !isFixed(r));
        const totals = nowAdj.map((r) => calcSubtotal(r));
        const totalNow = ROUND2(fixedTotal + totals.reduce((a, b) => a + b, 0));
        const resid = ROUND2(target - totalNow);
        if (Math.abs(resid) <= TOL) break;

        // Redistribusi residual sama-rata ke baris yang masih bisa bergerak
        const deltaPerRow = ROUND2(resid / nowAdj.length);
        nowAdj.forEach((r, i) => applyTarget(r, ROUND2(totals[i] + deltaPerRow)));
    }

    // 3) normalisasi akhir (pastikan clamp/min tetap)
    clone.forEach((r) => {
        if (!r.hargaLocked) setHarga(r, asNum(r.harga));
        if (!r.qtyLocked)   setQty(r, asNum(r.qty));
    });

    return patch;
}

/** Global capping agar total semua scope ≤ target global */
export function capToGlobal(rows, targetGlobal) {
    const target = ROUND2(asNum(targetGlobal));
    const clone = rows.map((r) => {
        const rr = { ...r };
        if (!rr.hargaLocked) rr.harga = clampPrice(rr.harga ?? rr.msrp, rr.msrp);
        if (!rr.qtyLocked)   rr.qty   = ensureQty(rr.qty);
        return rr;
    });

    const fixed = ROUND2(clone.filter((r) => r.hargaLocked && r.qtyLocked)
        .reduce((s, r) => s + calcSubtotal(r), 0));
    if (fixed > target + 1e-6) return {};

    let total = ROUND2(clone.reduce((s, r) => s + calcSubtotal(r), 0));
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

    // 1) turunkan harga pada (qtyLock & hargaUnlock) proporsional kapasitas
    const priceAdj = clone.filter((r) => r.qtyLocked && !r.hargaLocked && asNum(r.qty) > 0);
    if (priceAdj.length > 0 && over > 0) {
        const reducibles = priceAdj.map((r) => {
            const q = asNum(r.qty), p = asNum(r.harga), minP = asNum(r.msrp) * MIN_RATIO;
            const w = normPct(r.persen);
            const cap = Math.max(0, (p - minP) * q * w);  // nilai yang bisa diturunkan dari harga
            return { r, q, p, minP, cap, w };
        });
        const totalCap = reducibles.reduce((a, x) => a + x.cap, 0);
        if (totalCap > 0) {
            const f = Math.min(1, over / totalCap);
            for (const x of reducibles) {
                const dropValue = ROUND2(x.cap * f);
                const base = x.q * x.w;
                const dropPerUnit = base > 0 ? ROUND2(dropValue / base) : 0;
                setHarga(x.r, x.p - dropPerUnit);
            }
            total = ROUND2(clone.reduce((s, r) => s + calcSubtotal(r), 0));
            over = ROUND2(Math.max(0, total - target));
        }
    }

    // 2) kurangi qty bila masih over (hargaLock or kedua unlock)
    if (over > 0) {
        const qtyAdj = clone.filter((r) => (r.hargaLocked && !r.qtyLocked) || (!r.hargaLocked && !r.qtyLocked));
        const capacity = qtyAdj.reduce((a, r) => {
            const room = Math.max(0, asNum(r.qty) - MIN_QTY);
            const w = normPct(r.persen);
            return a + ROUND2(asNum(r.harga) * w * room);
        }, 0);
        if (capacity > 0) {
            const f = Math.min(1, over / capacity);
            for (const r of qtyAdj) {
                const room = Math.max(0, asNum(r.qty) - MIN_QTY);
                const w = normPct(r.persen);
                const reducibleValue = ROUND2(asNum(r.harga) * w * room);
                const take = ROUND2(reducibleValue * f);
                const base = asNum(r.harga) * w;
                const reduceQty = base > 0 ? ROUND2(take / base) : 0;
                setQty(r, asNum(r.qty) - reduceQty);
            }
        }
    }

    return patch;
}

/* ------------------------------------------------------
📌 Contoh singkat pemakaian (pseudo):

import { recommendEqualShare, capToGlobal } from "./recommend";

const rows = [
  { id:"1", msrp: 200, hpp:150, harga: 180, qty:1, persen:"20%", hargaLocked:false, qtyLocked:false },
  { id:"2", msrp: 100, hpp: 70, harga:  90, qty:2, persen:"20%", hargaLocked:true,  qtyLocked:false },
];

const patchScope  = recommendEqualShare(rows, 1_000_000);
const afterScope  = rows.map(r => ({ ...r, ...patchScope[r.id] }));

const patchGlobal = capToGlobal(afterScope, 1_000_000);
const finalPatch  = { ...patchScope, ...patchGlobal };

applyPatch(finalPatch);
------------------------------------------------------ */
