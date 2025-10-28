// src/app/komisi/logic/TableProduk/targets.js
// ======================================================
// 📘 targets.js
// Parser input target dari UI menjadi struktur konsisten:
// { mode: "NONE" | "GLOBAL" | "BY_CATEGORY", global, perCat: Map }
// - GLOBAL: isikan nilai nominal target komisi total
// - BY_CATEGORY:
//    - Jika global terisi, perKategori boleh berupa "60%" dst (proporsi dari global)
//    - Jika global kosong, perKategori berupa nominal per kategori
// ======================================================

import { asNum } from "./math";

/**
 * parseTarget(targetKomisi)
 * @param {Object} targetKomisi - { global, perKategori: { A:"60%", B:"40%" } | { A:600000, B:400000 } }
 * @returns {Object} cfg
 *
 * Contoh:
 *  parseTarget({global:"1000000", perKategori:{A:"60%", B:"40%"}})
 *   -> { mode:"BY_CATEGORY", global:1000000, perCat: Map([["a",600000],["b",400000]]) }
 *
 *  parseTarget({global:"1000000"})
 *   -> { mode:"GLOBAL", global:1000000, perCat: Map() }
 *
 *  parseTarget({ perKategori:{ A:"300000" }})
 *   -> { mode:"BY_CATEGORY", global:null, perCat: Map([["a",300000]]) }
 */
export function parseTarget(targetKomisi) {
    const tg  = targetKomisi?.global;
    const per = targetKomisi?.perKategori || {};

    const hasAny = (obj) => Object.values(obj || {}).some(v => String(v ?? "").trim().length > 0);

    const gNum = asNum(tg);
    const globalFilled = String(tg ?? "").trim().length > 0 && gNum > 0;
    const perFilled = hasAny(per);

    if (globalFilled && !perFilled) {
        return { mode: "GLOBAL", global: gNum, perCat: new Map() };
    }

    if (perFilled) {
        const perCat = new Map();
        Object.entries(per).forEach(([kat, raw]) => {
            const s = String(raw ?? "").trim();
            if (!s) return;

            if (globalFilled) {
                // perKategori berupa persen dari global
                const pct = Math.max(0, asNum(s.replace(/%/g, ""))) / 100;
                perCat.set(String(kat).toLowerCase(), gNum * pct);
            } else {
                // perKategori berupa nominal langsung
                perCat.set(String(kat).toLowerCase(), Math.max(0, asNum(s)));
            }
        });
        return { mode: "BY_CATEGORY", global: globalFilled ? gNum : null, perCat };
    }

    return { mode: "NONE", global: null, perCat: new Map() };
}
