import { getCurrentUser } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

/* ================== GET ================== */
export async function GET(_req, { params }) {
    try {
        const row = await prisma.tbMasterKomisi.findUnique({
            where: { id: params.id },
        });

        if (!row)
            return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(row);
    } catch (e) {
        console.error("GET /api/komisi/[id] error:", e);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}

/* ================== PATCH ================== */
export async function PATCH(req, { params }) {
    try {
        const body = await req.json();

        /** ❌ DILARANG MENGUBAH KATEGORI */
        if (body.kategori !== undefined) {
            return NextResponse.json(
                { error: "kategori tidak boleh diubah" },
                { status: 400 },
            );
        }

        /** ❌ DILARANG MENGUBAH CUSTOMER */
        if (body.customer !== undefined) {
            return NextResponse.json(
                { error: "customer tidak boleh diubah" },
                { status: 400 },
            );
        }

        /** 🚫 Tidak buat object kategori/customer AT ALL */
        const data = {};

        /** === user update === */
        const user = await getCurrentUser();
        const namaUser =
            user?.akun || user?.nama || user?.email || "system";

        /** === field lain boleh update === */
        if (body.persentase !== undefined)
            data.persentase = numOrNull(body.persentase);

        if (body.minAchKomisiDasar !== undefined)
            data.minAchKomisiDasar = numOrNull(body.minAchKomisiDasar);

        if (body.minAchBonusUtama !== undefined)
            data.minAchBonusUtama = numOrNull(body.minAchBonusUtama);

        if (body.valueBonusUtama !== undefined)
            data.valueBonusUtama = numOrNull(body.valueBonusUtama);

        if (body.minAchBonusExtra !== undefined)
            data.minAchBonusExtra = numOrNull(body.minAchBonusExtra);

        if (body.valueBonusExtra !== undefined)
            data.valueBonusExtra = numOrNull(body.valueBonusExtra);

        data.diubahOleh = namaUser;

        /** UPDATE **/
        const updated = await prisma.tbMasterKomisi.update({
            where: { id: params.id },
            data,
        });

        return NextResponse.json(updated);
    } catch (e) {
        const msg =
            e?.code === "P2002"
                ? "Gagal update: kombinasi kategori + customer sudah ada."
                : e?.message || "Gagal update";

        console.error("PATCH /api/komisi/[id] error:", e);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

/* ================== DELETE ================== */
export async function DELETE(_req, { params }) {
    try {
        await prisma.tbMasterKomisi.delete({ where: { id: params.id } });
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("DELETE /api/komisi/[id] error:", e);
        return NextResponse.json(
            { error: "Gagal hapus" },
            { status: 500 },
        );
    }
}
