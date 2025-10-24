// app/api/items/bulk/route.js

export const runtime = "nodejs";

import prisma from "@/lib/db";
import { NextResponse } from "next/server";

// utils
function numOrNull(v) {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
function intOrNull(v) {
    const n = numOrNull(v);
    return n === null ? null : Math.round(n);
}
function strOrNull(v) {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
}

export async function PATCH(req) {
    try {
        const body = await req.json();
        const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
        if (ids.length === 0) {
            return NextResponse.json({ error: "ids wajib diisi" }, { status: 400 });
        }

        const data = {};
        const maybeSet = (key, val, transform = (x) => x) => {
            if (val === undefined) return;
            const v = transform(val);
            if (v === "" || v === undefined) return; // hindari set string kosong
            data[key] = v;
        };

        // === UMUM (opsional untuk bulk) ===
        maybeSet("kategori", body.kategori, strOrNull);
        maybeSet("jenisItem", body.jenisItem, strOrNull);
        maybeSet("harga", body.harga, intOrNull);

        // === KONVERSI / KALKULATOR ===
        maybeSet("satuan", body.satuan, (v) => {
            const s = strOrNull(v);
            return s; // wajib non-empty bila ingin diubah
        });
        maybeSet("nilaiSatuan", body.nilaiSatuan, numOrNull);
        maybeSet("nilaiKonversi", body.nilaiKonversi, numOrNull);
        maybeSet("satuanKonversi", body.satuanKonversi, strOrNull);

        // === PENGGUNAAN ===
        maybeSet("nilaiPenggunaan", body.nilaiPenggunaan, numOrNull);
        maybeSet("satuanPenggunaan", body.satuanPenggunaan, strOrNull);
        maybeSet("deskripsiPenggunaan", body.deskripsiPenggunaan, strOrNull);

        // === MEDIA ===
        maybeSet("gambarUrl", body.gambarUrl, strOrNull);
        maybeSet("linkWeb", body.linkWeb, strOrNull);



        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Tidak ada field yang diubah" }, { status: 400 });
        }

        const updated = await prisma.tbMasterItem.updateMany({
            where: { id: { in: ids } },
            data,
        });

        return NextResponse.json({ count: updated.count });
    } catch (e) {
        console.error("PATCH /api/items/bulk error:", e);
        return NextResponse.json({ error: "Bulk update gagal" }, { status: 500 });
    }
}
