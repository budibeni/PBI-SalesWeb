// components/constants/sidebar-menu.js
import { ACCESS_ITEMS } from "@/lib/access-items"
import {
    SquarePercent,
    UserPen,
    Calculator,
    Crosshair,
    FileText,
    Box,
    AppWindow, // default icon
} from "lucide-react"

const DEFAULT_ICON = AppWindow

const ICONS = {
    produk: Box,
    kalkulator: Calculator,
    target: Crosshair,
    "komisi-simulasi": SquarePercent,
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
