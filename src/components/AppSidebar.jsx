"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar"
import { Home, Receipt, BarChart2, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import ThemeToggle from "@/components/ui/theme-toggle"

function MenuItem({ href, icon: Icon, label }) {
    return (
        <Link
            href={href}
            className="
        flex items-center gap-3 rounded-md px-2 py-2 text-sm
        text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
      "
        >
            <Icon size={18} />
            <span>{label}</span>
        </Link>
    )
}

export default function AppSidebarLayout({ children }) {
    return (
        <SidebarProvider>
            {/* Sidebar kiri */}
            <Sidebar
                className="
          bg-sidebar text-sidebar-foreground
          border-r border-sidebar-border
        "
            >
                <SidebarHeader>
                    <div className="flex items-center justify-between px-2">
                        <div className="font-bold">My App</div>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <div className="space-y-1">
                        <div className="px-2 text-xs uppercase text-muted-foreground">Menu</div>
                        <MenuItem href="/komisi/simulasi" icon={Home} label="Simulasi Komisi" />
                        <MenuItem href="/transaksi" icon={Receipt} label="Transaksi" />
                        <MenuItem href="/laporan" icon={BarChart2} label="Laporan" />
                    </div>

                    <div className="mt-6 space-y-1">
                        <div className="px-2 text-xs uppercase text-muted-foreground">Pengaturan</div>
                        <MenuItem href="/settings" icon={Settings} label="Settings" />
                    </div>
                </SidebarContent>

                <SidebarFooter>
                    <div className="flex items-center justify-between px-2">
                        <ThemeToggle />
                        <button
                            className="
                inline-flex items-center gap-2 rounded-md border border-sidebar-border
                px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                ring-1 ring-inset ring-sidebar-ring/0 focus-visible:ring-sidebar-ring/50
              "
                            type="button"
                        >
                            <LogOut size={16} />
                            <span className="hidden md:inline">Keluar</span>
                        </button>
                    </div>
                </SidebarFooter>

                <SidebarRail />
            </Sidebar>

            {/* Area konten (kanan) + tombol trigger */}
            <SidebarInset className="flex min-h-screen flex-col bg-background text-foreground">
                <header
                    className="
            flex h-12 items-center gap-2 border-b border-sidebar-border
            bg-background px-3
          "
                >
                    <SidebarTrigger />
                    {/*ganti Header dengan menu yang dipilih*/}
                    <div className="font-medium">Header</div>
                    <div className="ml-auto">
                        {/* Opsional: toggle di header juga */}
                        {/* <ThemeToggle />*/}
                    </div>
                </header>

                <main className="flex-1 p-4 bg-background text-foreground">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
