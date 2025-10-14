// app/api/items/all/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic"; // selalu hit server
export const revalidate = 0;

// util kecil untuk ETag
function makeETag(payload) {
    const hash = crypto.createHash("sha1").update(payload).digest("hex");
    return `"W/${hash}"`; // weak etag
}

// fields default yang dikirim (response ramping)
const DEFAULT_SELECT = {
    id: true,
    kodeItem: true,
    namaItem: true,
    deskripsi: true,
    kategori: true,
    jenisItem: true,
    harga: true,
    satuan: true,
    nilaiSatuan: true,
    nilaiKonversi: true,
    satuanKonversi: true,
    nilaiPenggunaan: true,
    satuanPenggunaan: true,
    deskripsiPenggunaan: true,
    gambarUrl: true,
    linkWeb: true,
    dibuatTanggal: true,
    diubahTanggal: true,
};

export async function GET(req) {
    try {
        const url = new URL(req.url);

        // filter ringan
        const q = (url.searchParams.get("q") || "").trim();
        const cat = (url.searchParams.get("cat") || "").trim();

        // pilih kolom tertentu: ?fields=id,kodeItem,namaItem
        const fields = (url.searchParams.get("fields") || "").trim();
        let select = { ...DEFAULT_SELECT };
        if (fields) {
            select = fields.split(",").reduce((acc, f) => {
                const k = f.trim();
                if (k) acc[k] = true;
                return acc;
            }, {});
            // minimal selalu kirim id
            select.id = true;
        }

        const where = {
            ...(q
                ? {
                    OR: [
                        { kodeItem:  { contains: q, mode: "insensitive" } },
                        { namaItem:  { contains: q, mode: "insensitive" } },
                        { kategori:  { contains: q, mode: "insensitive" } },
                        { jenisItem: { contains: q, mode: "insensitive" } },
                        { deskripsi: { contains: q, mode: "insensitive" } },
                    ],
                }
                : {}),
            ...(cat ? { kategori: { equals: cat, mode: "insensitive" } } : {}),
        };

        const items = await prisma.tbMasterItem.findMany({
            where,
            orderBy: { namaItem: "asc" },
            select,
        });

        // ETag untuk hemat bandwidth (304 Not Modified)
        const body = JSON.stringify({ success: true, total: items.length, items });
        const etag = makeETag(body);
        const ifNoneMatch = req.headers.get("if-none-match");
        if (ifNoneMatch && ifNoneMatch === etag) {
            return new NextResponse(null, {
                status: 304,
                headers: { ETag: etag, "Cache-Control": "no-store" },
            });
        }

        return new NextResponse(body, {
            headers: {
                "Content-Type": "application/json",
                ETag: etag,
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        console.error("GET /api/items/all error:", err);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
