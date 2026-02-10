// src/app/komisi/logic/TableProduk/rules.js
// ======================================================
// 📘 rules.js
// Kumpulan konstanta aturan domain untuk modul Komisi.
// Simpan di satu tempat agar mudah diubah global.
// ======================================================

import {asNum, ROUND2} from "@/app/komisi/logic/TableProduk/math";

export const MIN_QTY   = 0.01; // minimal qty yang diizinkan
export const MIN_RATIO = 0; // harga minimal = 0.75 * MSRP
export const MAX_RATIO = 10; // harga maksimal = 1.25 * MSRP

// 🔎 Contoh pemakaian (di file lain):
// import { MIN_QTY } from "./rules";
// if (qty < MIN_QTY) qty = MIN_QTY;

/**
 * clampPrice(price, msrp)
 * Batasi harga ke rentang [0.75..1.25] * MSRP (mengacu rules.js).
 *
 * Contoh:
 *  clampPrice(5000, 10000)  // 7500 (karena min 0.75*MSRP)
 *  clampPrice(20000,10000)  // 12500 (max 1.25*MSRP)
 */
export const clampPrice = (price, msrp) => {
    const p = asNum(price);
    const m = asNum(msrp);
    const minP = m * MIN_RATIO;
    const maxP = m * MAX_RATIO;
    return ROUND2(Math.max(minP, Math.min(p, maxP)));
};