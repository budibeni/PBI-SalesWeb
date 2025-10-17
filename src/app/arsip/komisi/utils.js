// komisi/utils.js
export const toNum = (v) => {
    if (v === null || v === undefined) return 0
    // dukung format 1.234.567,89 → 1234567.89
    const s = String(v).replaceAll(".", "").replace(",", ".").trim()
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
}

export const fmt = (n, max = 2) =>
    Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: max })

export const pctToLabel = (p) => `${fmt((p || 0) * 100, 2)}%`
