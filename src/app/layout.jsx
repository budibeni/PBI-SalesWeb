import "./globals.css";
import AppSidebarLayout from "@/components/AppSidebar";
import ThemeProvider from "@/components/ui/theme-provider";

export const metadata = {
    title: "Sales PBI",
    description: "Bensoft Power Block",
};

export default async function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
            <AppSidebarLayout>{children}</AppSidebarLayout>
        </ThemeProvider>
        </body>
        </html>
    );
}
