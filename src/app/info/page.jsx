import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublicPage() {
    const info = await prisma.tbWebInfo.findFirst({
        orderBy: { id: "desc" },
    });

    if (!info) {
        return (
            <div className="min-h-screen p-6">
                <h1 className="text-xl font-semibold">Web Info</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Data belum tersedia.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-2xl rounded-2xl border p-6 shadow-sm">
                <h1 className="text-2xl font-semibold">
                    {info.app_name || "App"}
                </h1>

                <p className="mt-1 text-sm text-gray-600">
                    {info.company || "-"}
                </p>

                <div className="mt-6 space-y-2 text-sm">
                    <Row label="Mode" value={info.mode} />
                    <Row label="Email" value={info.email} />
                    <Row label="Copyright" value={info.copyright} />
                </div>

                {info.description && (
                    <p className="mt-6 text-sm leading-relaxed text-gray-700">
                        {info.description}
                    </p>
                )}
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium">{value || "-"}</span>
        </div>
    );
}
