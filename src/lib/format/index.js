// app/komisi/logic/format.js

/**
 * fmt(n, max)
 * --------------------------------------------
 * Format angka ke string dengan pemisah ribuan.
 * Tidak menambahkan simbol "Rp" — cocok untuk tampilan
 * yang sudah menyertakan label manual.
 *
 * @param {number|string} n - Nilai numerik yang ingin diformat.
 * @param {number} max - Jumlah maksimum digit desimal.
 * @returns {string} Angka dengan format lokal Indonesia.
 *
 * 📍Contoh:
 *   fmt(1234567.891)       // "1.234.567,89"
 *   fmt(1234.56, 0)        // "1.235"
 *   fmt("9000.5")          // "9.000,5"
 */
export function fmt(n, max = 2) {
    const num = Number(n || 0);
    if (!Number.isFinite(num)) return "0";
    return num.toLocaleString("id-ID", { maximumFractionDigits: max });
}

/**
 * fmtFixed(n, digits)
 * --------------------------------------------
 * Format angka dengan jumlah digit desimal tetap.
 * Cocok untuk tampilan nilai dengan presisi tertentu
 * (misalnya Qty atau Harga satuan).
 *
 * @param {number|string} n
 * @param {number} digits - Jumlah digit desimal (default 2)
 * @returns {string}
 *
 * 📍Contoh:
 *   fmtFixed(12.3)         // "12,30"
 *   fmtFixed(12, 3)        // "12,000"
 */
export function fmtFixed(n, digits = 2) {
    const num = Number(n || 0);
    if (!Number.isFinite(num)) return (0).toFixed(digits);
    return num.toLocaleString("id-ID", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

/**
 * fmtPct(p, digits)
 * --------------------------------------------
 * Format angka ke bentuk persentase (%).
 * Jika nilai p = 0.15 → tampil sebagai "15%"
 *
 * @param {number|string} p - Nilai antara 0–1 atau 0–100.
 * @param {number} digits - Jumlah digit desimal (default 0)
 * @returns {string}
 *
 * 📍Contoh:
 *   fmtPct(0.1)            // "10%"
 *   fmtPct(0.1234, 2)      // "12,34%"
 *   fmtPct(15)             // "1500%" ❌ (ingat: gunakan 0.15)
 */
export function fmtPct(p, digits = 0) {
    const num = Number(p || 0);
    return (num * 100).toLocaleString("id-ID", {
        maximumFractionDigits: digits,
    }) + "%";
}

/**
 * fmtMoney(n)
 * --------------------------------------------
 * Format angka langsung sebagai mata uang Rupiah,
 * lengkap dengan simbol "Rp" dan pemisah ribuan.
 *
 * @param {number|string} n
 * @returns {string}
 *
 * 📍Contoh:
 *   fmtMoney(1500000)      // "Rp 1.500.000,00"
 *   fmtMoney(1234.56)      // "Rp 1.234,56"
 */
export function fmtMoney(n) {
    const num = Number(n || 0);
    return num.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
    });
}
