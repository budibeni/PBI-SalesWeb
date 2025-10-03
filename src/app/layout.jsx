import "./globals.css";
import AppSidebarLayout from "@/components/AppSidebar";
import ThemeProvider from "@/components/ui/theme-provider";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export const metadata = {
    title: "Sales PBI",
    description: "Bensoft Power Block",
};

export default async function RootLayout({ children }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth")?.value;

    let isLoggedIn = false;
    if (token) {
        try { await verifySession(token); isLoggedIn = true; }
        catch { isLoggedIn = false; }
    }

    return (
        <html lang="en" suppressHydrationWarning>
        <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
            {isLoggedIn ? (
                <AppSidebarLayout>{children}</AppSidebarLayout>
            ) : (
                children
            )}
        </ThemeProvider>
        </body>
        </html>
    );
}
