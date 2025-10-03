"use client"

import { useEffect, useState } from "react"
import { SIDEBAR_MENUS } from "@/components/constants/sidebar-menu"
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail,
    SidebarProvider, SidebarTrigger, SidebarInset,
} from "@/components/ui/sidebar"
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { User, Key, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ThemeToggle from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"

// util kecil buat gabung className
function cx(...cls) {
    return cls.filter(Boolean).join(" ")
}

// komponen item menu dengan state aktif
function MenuItem({ href, icon: Icon, label, active }) {
    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cx(
                "flex items-center gap-3 rounded-md px-4 py-2 text-sm outline-none ring-0",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
        >
            <Icon size={18} />
            <span>{label}</span>
        </Link>
    )
}

export default function AppSidebarLayout({ children, user }) {
    const pathname = usePathname()

    // === nama user ===
    const [me, setMe] = useState(user || null)
    useEffect(() => {
        // fallback fetch hanya jika prop user tidak diberikan
        if (!me) {
            fetch("/api/me")
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => data && setMe(data))
                .catch(() => {})
        }
    }, [me])

    const displayName =
        (me?.nama && me.nama.trim()) || me?.akun || me?.email || "Pengguna"

    // logika aktif: prefix match aman untuk route anak
    const isActive = (href) =>
        pathname === href || (href !== "/" && pathname.startsWith(href + "/"))

    // title header mengikuti menu aktif; fallback ke segmen terakhir
    const activeMenu = SIDEBAR_MENUS.find((m) => isActive(m.href))
    const headerTitle =
        activeMenu?.label ||
        (pathname?.split("/").filter(Boolean).pop() || "Beranda")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())

    // kelompokkan menu by section
    const sectionGroups = SIDEBAR_MENUS.reduce((acc, m) => {
        acc[m.section] = acc[m.section] || []
        acc[m.section].push(m)
        return acc
    }, {})

    return (
        <SidebarProvider>
            {/* Sidebar kiri */}
            <Sidebar className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
                <SidebarHeader>
                    <div className="flex items-center justify-between px-2">
                        <div className="font-bold">SalesGo PBI</div>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    {Object.entries(sectionGroups).map(([section, items]) => (
                        <div key={section} className="space-y-1 mt-2">
                            <div className="px-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {section}
                            </div>
                            {items.map(({ href, icon, label }) => (
                                <MenuItem
                                    key={href}
                                    href={href}
                                    icon={icon}
                                    label={label}
                                    active={isActive(href)}
                                />
                            ))}
                        </div>
                    ))}
                </SidebarContent>

                <SidebarFooter>
                    <div className="flex items-center justify-start px-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                {/* Tombol pemicu di PALING KIRI, varian ghost */}
                                <Button variant="ghost" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {/* tampilkan nama user login */}
                                    <span
                                        className="hidden md:inline font-medium truncate max-w-[160px]"
                                        title={displayName}
                                    >
                    {displayName}
                  </span>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent side="top" align="start" className="w-52">
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    Akun
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem asChild>
                                    <Link href="/account" className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Akun Saya
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild>
                                    <Link href="/account/password" className="flex items-center gap-2">
                                        <Key className="h-4 w-4" />
                                        Ganti Sandi
                                    </Link>
                                </DropdownMenuItem>

                                <form action="/api/auth/logout" method="post">
                                    <DropdownMenuItem asChild>
                                        <button
                                            type="submit"
                                            className="w-full flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Keluar
                                        </button>
                                    </DropdownMenuItem>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </SidebarFooter>

                <SidebarRail />
            </Sidebar>

            {/* Area konten (kanan) + tombol trigger */}
            <SidebarInset className="flex min-h-screen flex-col bg-background text-foreground">
                <header className="flex h-12 items-center gap-3 border-b border-sidebar-border bg-background px-3">
                    <SidebarTrigger />
                    <div className="font-medium">{headerTitle}</div>
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </header>

                <main className="flex-1 p-4 bg-background text-foreground">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
