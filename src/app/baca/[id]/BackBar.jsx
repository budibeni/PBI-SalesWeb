"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function BackBar() {
    const sp = useSearchParams()
    const q = sp.get("q") || ""
    const page = Math.max(1, Number(sp.get("page") || 1))

    const p = new URLSearchParams()
    if (q) p.set("q", q)
    p.set("page", String(page))

    const href = `/artikel/terbit?${p.toString()}`

    return (
        <div className="mb-4">
            <Button asChild variant="outline">
                <Link href={href} prefetch={false}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                </Link>
            </Button>
        </div>
    )
}
