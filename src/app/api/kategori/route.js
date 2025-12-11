import { getCurrentUser } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ===== Util sederhana =====
function numOrNull(v) {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function strOrNull(v) {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
}

// ===== GET: list + search + pagination =====
export async function GET(req) {
    try {
        const url = new URL(req.url);
        const q = (url.searchParams.get("q") || "").trim();

        const page = Math.max(1, Number(url.searchParams.get("page") || 1));
        const pageSize = Math.min(
            100,
            Math.max(1, Number(url.searchParams.get("pageSize") || 20))
        );

        const skip = (page - 1) * pageSize;

        const where = q
            ? {
                OR: [
                    { kategori: { contains: q } }, // MySQL otomatis case-insensitive
                    { customer: { contains: q } },
                ],
            }
            : {};

        const [items, total] = await Promise.all([
            prisma.tbMasterKomisi.findMany({
                where,
                orderBy: [{ kategori: "asc" }, { customer: "asc" }],
                skip,
                take: pageSize,
            }),
            prisma.tbMasterKomisi.count({ where }),
        ]);

        return NextResponse.json({
            ok: true,
            items,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        });
    } catch (e) {
        console.error("GET /api/kategori error:", e);
        return NextResponse.json(
            { ok: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// ===== POST: create record baru =====
export async function POST(req) {
    try {
        const body = await req.json();

        const kategori = strOrNull(body.kategori);
        const customer = strOrNull(body.customer);

        if (!kategori) {
            return NextResponse.json(
                { ok: false, error: "Kategori wajib diisi" },
                { status: 400 }
            );
        }

        if (!customer) {
            return NextResponse.json(
                { ok: false, error: "Customer wajib diisi" },
                { status: 400 }
            );
        }

        // Cek duplikat kategori + customer
        const existing = await prisma.tbMasterKomisi.findFirst({
            where: { kategori, customer },
        });

        if (existing) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Kombinasi kategori + customer sudah ada, tidak boleh duplikat.",
                },
                { status: 400 }
            );
        }

        const user = await getCurrentUser();
        const namaUser = user?.akun || user?.nama || user?.email || "system";

        const created = await prisma.tbMasterKomisi.create({
            data: {
                kategori,
                customer,
                persentase: numOrNull(body.persentase),
                minAchKomisiDasar: numOrNull(body.minAchKomisiDasar),
                minAchBonusUtama: numOrNull(body.minAchBonusUtama),
                valueBonusUtama: numOrNull(body.valueBonusUtama),
                minAchBonusExtra: numOrNull(body.minAchBonusExtra),
                valueBonusExtra: numOrNull(body.valueBonusExtra),
                dibuatOleh: namaUser,
            },
        });

        return NextResponse.json(
            { ok: true, data: created },
            { status: 201 }
        );
    } catch (e) {
        const msg =
            e?.code === "P2002"
                ? "Kombinasi kategori + customer sudah ada (unik)."
                : e?.message || "Gagal membuat data";

        console.error("POST /api/kategori error:", e);

        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
