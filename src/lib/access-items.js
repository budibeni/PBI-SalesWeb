// lib/access-items.js


// Satu sumber kebenaran menu/akses
export const ACCESS_ITEMS = [
    { id: "produk",             href: "/produk",            label: "Cari Produk",     section: "Menu"},
    { id: "kalkulator",         href: "/kalkulator",        label: "Kalkulator", section: "Menu"},
    { id: "komisi",             href: "/komisi",            label: "Simulasi Komisi",   section: "Menu"},
    // { id: "target",             href: "/target",            label: "Target Penjualan",  section: "Menu"},
    // { id: "dokumen",            href: "/dokumen",           label: "Dokumen & Brosur",  section: "Menu" },

    // 🔓 PUBLIK: tidak perlu akses, tidak dicek middleware, tapi boleh tampil di sidebar
    { id: "artikel-terbit",   href: "/artikel/terbit",   label: "Baca Artikel",      section: "Menu", public: true },

    // 🔒 ADMIN/PROTECTED
    { id: "items",          href: "/items",          label: "Items",           section: "Master" },
    { id: "artikel",          href: "/artikel",          label: "Artikel",           section: "Master" },
    // { id: "bantuan",          href: "/bantuan",          label: "Bantuan",           section: "Lainnya"},
    { id: "users",            href: "/users",            label: "Users",             section: "Lainnya" },
]
