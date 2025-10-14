// DATA ONLY (contoh singkat, silakan tambah sesuai kebutuhan)
export const OFFICIAL_AAC = [
    { code: "PW", name: "PW", vc: 261630.1, msrp: 389941, step: 0.1, name_id: "Powerblock" },
    { code: "GD", name: "GD", vc: 225149.18, msrp: 283667, step: 0.1, name_id: "Goodblock" },
];

export const OFFICIAL_BOND = [
    { code: "HM-101", name: "HM-101", vc: 20923.0, msrp: 32376.93, step: 1, pack: 40, name_id: "Hi Mortar" },
    { code: "PRO 379 PAPER BAG", name: "PRO 379 PAPER BAG", vc: 14747.53, msrp: 70944.44, step: 1, pack: 40, name_id: "Pengerasan Lantai" },
    { code: "PRO 689 PAPER BAG", name: "PRO 689 PAPER BAG", vc: 38951.67, msrp: 78758.9, step: 1, pack: 40, name_id: "Perekat Keramik Luar & Basah" },
];

const RATE_AAC = (code) => (code.includes("GD") ? 0.0044 / 1 : 0.0044);
const RATE_BOND = 0.0044 * 0.628;

// normalisasi untuk UI
export function buildProducts(aacSrc, bondSrc) {
    const isBad = (v) => v == null || (typeof v === "number" && !Number.isFinite(v));
    const validBond = (bondSrc || []).filter((x) => {
        const vc = +x.vc, msrp = x.msrp == null ? NaN : +x.msrp, step = x.step == null ? NaN : +x.step, pack = x.pack == null ? NaN : +x.pack;
        return !(isBad(x.code) || isBad(x.name) || isBad(vc) || isBad(msrp) || isBad(step) || isBad(pack));
    });

    const aac = (aacSrc || []).map((x) => ({
        sku: x.code || x.name, name: x.name || x.code, family: "AAC",
        pack: Number.isFinite(+x.pack) ? +x.pack : 1, msrp: +x.msrp || 0,
        price: +x.msrp || 0, vc: +x.vc || 0, qty: null, step: x.step ?? 0.1,
        rate: RATE_AAC(x.code), name_id: x.name_id || "", name_en: x.name_en || "",
        search: [x.code||"", x.name||"", x.name_id||"", x.name_en||""].join(" ").toLowerCase(),
    }));

    const bond = validBond.map((x) => ({
        sku: x.code || x.name, name: x.name || x.code, family: "Bond",
        pack: Number.isFinite(+x.pack) ? +x.pack : 1, msrp: +x.msrp || 0,
        price: +x.msrp || 0, vc: +x.vc || 0, qty: null, step: x.step ?? 1,
        rate: RATE_BOND, name_id: x.name_id || "", name_en: x.name_en || "",
        search: [x.code||"", x.name||"", x.name_id||"", x.name_en||""].join(" ").toLowerCase(),
    }));

    return [...aac, ...bond];
}

export const PRODUCTS = buildProducts(OFFICIAL_AAC, OFFICIAL_BOND);
