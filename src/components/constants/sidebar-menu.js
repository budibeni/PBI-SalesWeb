import {
    SquarePercent,
    UserPen,
    Key,
    Calculator,
    Crosshair,
    FileText,
    Box,
} from "lucide-react"

export const SIDEBAR_MENUS = [
    { href: "/produk",       icon: Box, label: "Daftar Produk",     section: "Menu" },
    { href: "/kalkulator",   icon: Calculator, label: "Kalkulator Produk", section: "Menu" },
    { href: "/target",       icon: Crosshair, label: "Target Penjualan",  section: "Menu" },
    { href: "/komisi/simulasi", icon: SquarePercent, label: "Simulasi Komisi", section: "Menu" },
    { href: "/dokumen",      icon: FileText, label: "Dokumen & Brosur",   section: "Menu" },
    { href: "/akun",         icon: UserPen, label: "Akun Saya",      section: "Lainnya" },
    { href: "/ganti-sandi",  icon: Key, label: "Ganti Sandi",        section: "Lainnya" },
]
