// src/app/komisi/logic/TableProduk/math.js
// ======================================================
// 📘 math.js
// Util numerik murni (pure functions) untuk seluruh modul.
// Berisi konversi angka, pembulatan, normalisasi persen,
// serta helper clamp harga & minimal qty.
// ======================================================

import { MIN_QTY, MIN_RATIO, MAX_RATIO } from "./rules";

/** Pembulatan 2 desimal, aman untuk string/null */
export const ROUND2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Konversi aman ke number. "", null, undefined → 0 */
export const asNum = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v));

/**
 * Normalisasi persen:
 *  - 0.2     -> 0.2
 *  - 20      -> 0.2
 *  - "20%"   -> 0.2
 *  - negative -> dibatasi min 0
 *
 * Contoh:
 *  normPct(25)   // 0.25
 *  normPct("5%") // 0.05
 */
export const normPct = (p) => {
    const x = Number((p ?? "").toString().replace("%", "")) || 0;
    return x > 1 ? x / 100 : Math.max(0, x);
};



/**
 * ensureQty(q)
 * Pastikan qty minimal >= MIN_QTY (0.01).
 *
 * Contoh:
 *  ensureQty(0)     // 0.01
 *  ensureQty(1.234) // 1.23 (setelah ROUND2)
 */
export const ensureQty = (q) => ROUND2(Math.max(asNum(q), MIN_QTY));
