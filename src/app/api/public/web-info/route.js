import prisma from "@/lib/db";

export async function GET() {
    const data = await prisma.tbWebInfo.findFirst({
        orderBy: { id: "desc" },
    });

    return Response.json(
        { ok: true, data },
        {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        }
    );
}
