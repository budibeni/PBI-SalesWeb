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
    { id: "produk",           href: "/produk",           icon: Box,           label: "Daftar Produk",    section: "Menu" },
    { id: "kalkulator",       href: "/kalkulator",       icon: Calculator,    label: "Kalkulator Produk", section: "Menu" },
    { id: "target",           href: "/target",           icon: Crosshair,     label: "Target Penjualan",  section: "Menu" },
    { id: "komisi-simulasi",  href: "/komisi/simulasi",  icon: SquarePercent, label: "Simulasi Komisi",   section: "Menu" },
    { id: "dokumen",          href: "/dokumen",          icon: FileText,      label: "Dokumen & Brosur",  section: "Menu" },
    { id: "bantuan",             href: "/bantuan",             icon: UserPen,       label: "Bantuan",         section: "Lainnya" },
];

