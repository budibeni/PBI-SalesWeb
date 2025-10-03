// app/layout.jsx (server component)
import "./globals.css"
import ThemeProvider from "@/components/ui/theme-provider"
import AppSidebarLayout from "@/components/AppSidebar"
import { getCurrentUser } from "@/lib/auth-server"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "default-no-store"

export default async function RootLayout({ children }) {
    const user = await getCurrentUser() // { nama, akun, email, role, ... }

    return (
        <html lang="en" suppressHydrationWarning>
        <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
            {user ? (
                <AppSidebarLayout user={user}>{children}</AppSidebarLayout>
            ) : (
                children
            )}
        </ThemeProvider>
        </body>
        </html>
    )
}
