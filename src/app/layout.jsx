// app/layout.jsx
import "./globals.css"
import ThemeProvider from "@/components/ui/theme-provider"
import AppSidebarLayout from "@/components/AppSidebar"
import { getCurrentUser } from "@/lib/auth-server"
import prisma from "@/lib/db"
import ItemsProvider from "@/providers/ItemsProvider";
import KategoriProvider from "@/providers/KategoriProvider";
import {UserProvider} from "@/providers/UserProvider";

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "default-no-store"

export const metadata = {
    title: "PBI SalesGo",
    description: "Bensoft Power Block",
}

export default async function RootLayout({ children }) {
    const session = await getCurrentUser()
    let user = null

    if (session) {
        // ⬇️ ambil user dari DB (lengkap dengan akses)
        user = await prisma.tbUser.findUnique({
            where: { id: Number(session.sub) },
            select: { id: true, nama: true, akun: true, email: true, kategori:true, role: true, akses: true },
        })
        if (user && (user.akses == null || typeof user.akses !== "object")) {
            user.akses = {}
        }
    }

    return (
        <html lang="en" suppressHydrationWarning>
        <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
            <UserProvider user={user}>
                {user ? (
                    <AppSidebarLayout user={user}>
                        <KategoriProvider>
                            <ItemsProvider>
                                {children}
                            </ItemsProvider>
                        </KategoriProvider>
                    </AppSidebarLayout>
                ) : (
                    children
                )}
            </UserProvider>
        </ThemeProvider>
        </body>
        </html>
    )
}
