// app/komisi/logic/TableProduk/subtotal.js
/**
 * calcSubtotal(row):
 *   subtotal komisi = max(0, harga - hpp) × qty × persen
 *   - harga/hpp/qty boleh string/number.
 *   - persen bisa 5 atau 0.05 (ditangani di hulu; kalau 5, jadikan 0.05 sebelum dipakai).
 */
import { asNum, ROUND2 } from "./math.js";

export const calcPotensiKomisi = (row) => {
    const harga  = asNum(row.harga);
    const hpp    = asNum(row.hpp);
    const qty    = asNum(row.qty);
    const persen = asNum(row.persen); // diasumsikan sudah 0..1 dari sumber data
    if (!hpp || hpp <= 0) return 0;
    const margin = Math.max(0, harga - hpp);
    return ROUND2(margin * qty * persen);
};


export const calcMargin = (row) => {
    const harga  = asNum(row.harga);
    const hpp    = asNum(row.hpp);
    const qty    = asNum(row.qty);
    if (!hpp || hpp <= 0) return 0;
    const margin = Math.max(0, harga - hpp);
    return ROUND2(margin * qty);
};