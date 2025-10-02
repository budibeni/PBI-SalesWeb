"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
    const { theme, setTheme, systemTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])
    if (!mounted) return null

    const current = theme === "system" ? systemTheme : theme

    return (
        <button
            type="button"
            onClick={() => setTheme(current === "dark" ? "light" : "dark")}
            className="rounded-md p-2 hover:bg-sidebar-accent"
        >
            {current === "dark" ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </button>
    )
}
