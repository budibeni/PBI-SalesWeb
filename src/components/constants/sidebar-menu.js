// components/constants/sidebar-menu.js
import { ACCESS_ITEMS } from "@/lib/access-items"
import {
    SquarePercent,
    UserPen,
    Calculator,
    Crosshair,
    FileText,
    Box,
    AppWindow,
    Newspaper,
    PackageSearch,
} from "lucide-react"

const DEFAULT_ICON = AppWindow

const ICONS = {
    produk: PackageSearch,
    kalkulator: Calculator,
    target: Crosshair,
    "komisi": SquarePercent,
    "artikel-terbit" :Newspaper,
    dokumen: FileText,
    bantuan: UserPen,
    users: Box,
}

// Ekspor untuk UI: daftar menu lengkap
export const SIDEBAR_MENUS = ACCESS_ITEMS.map((it) => {
    const icon = ICONS[it.id] ?? DEFAULT_ICON
    return { ...it, icon }
})

export { ACCESS_ITEMS } // kalau UI lain butuh
